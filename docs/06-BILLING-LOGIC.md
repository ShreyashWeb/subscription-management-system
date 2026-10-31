# 06: Billing logic

This is the heart of the project. Judges will test these rules. Read before touching invoices, discounts or payments.

All amounts are **integer minor units**. All "dates" below are calendar days (no time zone drift); use UTC date math or `date-fns` on date-only values.

---

## 1. Subscription lifecycle

```
DRAFT ──► QUOTATION ──► CONFIRMED ──► ACTIVE ──► CLOSED
   ▲          │                          │  ▲
   └──────────┘ (revise)                 ▼  │
                                     paused / resumed (flag, not a status)
```

Transition map (single source of truth: `src/server/transitions.ts`):

| From | Allowed to |
|---|---|
| DRAFT | QUOTATION, CLOSED |
| QUOTATION | DRAFT, CONFIRMED, CLOSED |
| CONFIRMED | ACTIVE, CLOSED |
| ACTIVE | CLOSED |
| CLOSED | (none; renewal creates a new subscription or reopens per plan rule, see §9) |

Rules:
- QUOTATION → CONFIRMED is rejected if `quotationValidUntil < today`.
- CONFIRMED → ACTIVE happens when the start date is reached (a daily job or the billing run activates due subscriptions) or manually with an "Activate" action. On activation: `nextInvoiceDate = startDate` (or `startDate + trialDays` if the plan has a trial).
- ACTIVE → CLOSED sets `closedAt` and `nextInvoiceDate = null`.
- **Pause** (`isPaused = true`) only if `plan.pausable`. While paused, the billing run skips it and reports it as "skipped: paused". **Resume** sets `isPaused = false`; `nextInvoiceDate` stays as it was, so the missed periods are billed on the next run unless the product decision below says otherwise.
- **Early close** only if `plan.closable`.
- **Auto-close:** if `plan.autoClose` and the next period would start after `expiryDate` (or the plan's `availableTo`), the subscription becomes CLOSED after its last invoice is generated.
- **Renew** only if `plan.renewable`: extends `expiryDate` by one plan term (or by the subscription's original length), or reopens a CLOSED subscription if it closed within a short grace window. Keep the implemented behavior simple and document it in the Decisions log.

---

## 2. Period math

```ts
function addPeriod(date: Date, period: BillingPeriod): Date {
  switch (period) {
    case "DAILY":   return addDays(date, 1);
    case "WEEKLY":  return addDays(date, 7);
    case "MONTHLY": return addMonths(date, 1);   // date-fns clamps Jan 31 → Feb 28/29
    case "YEARLY":  return addYears(date, 1);
  }
}
// period covers [periodStart, addPeriod(periodStart) - 1 day]
```

For monthly subscriptions that start on the 31st, anchor on the original start day and clamp, so the cycle does not permanently drift to the 28th: compute period N as `addMonths(startDate, N)` rather than repeatedly adding one month to the previous result.

---

## 3. The billing run (no double billing, no skipped periods)

Input: `asOf` (date, default today), `actor`.

```
candidates = subscriptions WHERE
    status = ACTIVE
    AND nextInvoiceDate <= asOf
    ORDER BY nextInvoiceDate, id
    (process in batches of ~100)

for each candidate (own transaction):
    SELECT ... FOR UPDATE SKIP LOCKED      -- two concurrent runs never grab the same row
    if isPaused:                 report "skipped: paused"; continue
    while nextInvoiceDate <= asOf AND (expiryDate is null OR nextInvoiceDate <= expiryDate):
        periodStart = nextInvoiceDate
        periodEnd   = addPeriod(periodStart) - 1 day
        invoice = buildInvoice(subscription, periodStart, periodEnd)      -- §4, §5, §6
        INSERT invoice ... ON CONFLICT (subscriptionId, periodStart) DO NOTHING
        if conflict (invoice already exists): do NOT consume discounts; just advance the date
        nextInvoiceDate = addPeriod(periodStart)
    update subscription.nextInvoiceDate
    if plan.autoClose AND nextInvoiceDate beyond expiry/availableTo: status = CLOSED
    commit

summary = { created, skippedPaused, alreadyBilled, failed[], durationMs }
```

Why this is safe:
- The **unique index** `(subscriptionId, periodStart)` makes a second insert for the same period impossible, even under concurrency.
- The **`while` loop** catches up on every missed period, so nothing is skipped after downtime or a pause.
- **Per-subscription transactions** mean one bad record does not abort the whole run; it is listed in `failed[]`.
- Discount `usedCount` increments **inside the same transaction** as the invoice insert, so a rollback also rolls back the usage.

Invoices created by the run start as **DRAFT** (the team confirms them) unless the setting `autoConfirmInvoices` is on. Provide a bulk "Confirm all drafts" action.

Test cases to automate or manually verify:
1. Run twice for the same `asOf` → second run creates 0.
2. Subscription with `nextInvoiceDate` 3 periods old → 3 invoices, correct period ranges, date ends after `asOf`.
3. Paused subscription → skipped, then billed (catch-up) after resume.
4. Two runs triggered at once → no duplicates, no errors surfaced to the user.

---

## 4. Invoice building

For each subscription line:

```
lineSubtotal = quantity * unitPrice
discountAmount = (resolved in §5)
taxable = lineSubtotal - discountAmount
taxAmount = round(taxable * tax.rateBps / 10000)      // per line, round half up
amount = taxable + taxAmount
```

Invoice totals:

```
subtotal      = Σ lineSubtotal
discountTotal = Σ discountAmount            // includes subscription-scope discounts allocated across lines
taxTotal      = Σ taxAmount
total         = subtotal - discountTotal + taxTotal
```

- `issueDate = asOf` (or the period start; pick one and log it in Decisions). `dueDate = issueDate + subscription.paymentTermsDays`.
- Copy product name, variant and price **onto the invoice line** (snapshot). Later edits to the product must not alter old invoices.
- Plan price vs line prices: lines carry the unit price (base + variant extra). If the plan has its own price, treat it as the default unit price when a line is created from the plan; document the chosen behavior.

---

## 5. Discount resolution

A discount is **eligible** for an invoice (or line) if all hold:
- `active = true`
- `startDate <= invoice issue date` and (`endDate is null` or `issue date <= endDate`)
- `usageLimit is null` or `usedCount < usageLimit`
- scope matches: PRODUCT → the line's product is in the discount's targets; SUBSCRIPTION → this subscription is in the targets (or the discount has no targets, meaning all subscriptions)
- thresholds: `minQty` against the line quantity (PRODUCT) or total quantity (SUBSCRIPTION); `minPurchase` against the line subtotal (PRODUCT) or invoice subtotal (SUBSCRIPTION)

Amount:
- FIXED: `min(value, base)` (never discount below zero). For PRODUCT scope, per line; for SUBSCRIPTION scope, once per invoice, allocated proportionally across lines.
- PERCENT: `round(base * value / 10000)`.

**Stacking decision (default):** no stacking. If several eligible discounts target the same line, apply the one with the largest saving. A subscription-scope discount applies to the amount remaining after product discounts. Record the choice in the Decisions log; keep the code in one function so it is easy to change.

**Usage counting:** one "use" = one invoice that the discount was applied to. Increment atomically:

```sql
UPDATE "Discount"
SET "usedCount" = "usedCount" + 1
WHERE id = $1 AND ("usageLimit" IS NULL OR "usedCount" < "usageLimit")
```

If it updates 0 rows, the discount ran out between selection and application; skip it and recompute. Because this runs in the invoice transaction, a failed invoice never burns a use.

Show on the invoice: discount name, amount, per line. In the admin list: `usedCount / usageLimit` and an "expired / exhausted / active" badge.

---

## 6. Taxes

- Tax rules are admin-defined (`name`, `rateBps`, `active`). Lines reference a tax.
- Inactive taxes stay on old invoices but cannot be chosen for new lines.
- Rounding is per line (so the printed lines add up to the printed total).

---

## 7. Invoice lifecycle

| From | To | Rule |
|---|---|---|
| DRAFT | CONFIRMED | Allowed. Locks lines and totals. |
| DRAFT | CANCELLED | Allowed. |
| CONFIRMED | PAID | **Automatic** when `paidTotal >= total` (never set by hand). |
| CONFIRMED | CANCELLED | Only if `paidTotal = 0`. |
| PAID | CONFIRMED | Only via deleting a payment (admin) that reopens a balance. |
| CANCELLED | (none) | Terminal. Cancelling does not "unbill" the period; the unique key keeps that period from regenerating. Document this in the Decisions log. |

**Send:** emails the customer a link or PDF and sets `sentAt`. **Print:** `GET /api/invoices/:id/pdf`.

---

## 8. Payments and outstanding

```
outstanding = total - paidTotal
```

`payments.record` (single transaction):
1. Lock the invoice row.
2. Reject if invoice is not CONFIRMED (or PAID with zero balance), or if `amount <= 0` or `amount > outstanding`.
3. Insert payment.
4. `paidTotal += amount`.
5. If `paidTotal == total` → status PAID.
6. Write activity log.

**Overdue:** `status = CONFIRMED AND paidTotal < total AND dueDate < today`. Use the `(status, dueDate)` index. `daysLate = today - dueDate`.

**Dunning (extra):** a daily job (or part of the billing run) finds overdue invoices at 1, 3 and 7 days late and inserts `DunningReminder(invoiceId, stage)`; the unique key makes it idempotent. If email is configured, send the reminder.

---

## 9. Proration (extra)

When quantity or plan changes mid-cycle on an ACTIVE subscription:

```
periodDays    = days in the current period
remainingDays = periodEnd - changeDate + 1
credit        = round(oldRecurringTotal * remainingDays / periodDays)
charge        = round(newRecurringTotal * remainingDays / periodDays)
adjustment    = charge - credit        // positive = extra charge, negative = credit
```

Add the adjustment as a line (`"Proration: <change>"`) on the **next invoice** (simplest, safe) or as its own adjustment invoice. Always show a **preview** to the user before they confirm. Update the subscription lines going forward immediately.

---

## 10. Reporting definitions

| Metric | Definition |
|---|---|
| Active subscriptions | `status = ACTIVE` (optionally exclude paused; show both) |
| Revenue (invoiced) | Σ `total` of CONFIRMED and PAID invoices in the date range |
| Payments received | Σ payment `amount` with `paidOn` in range |
| Outstanding | Σ (`total - paidTotal`) of CONFIRMED invoices |
| Overdue | CONFIRMED, balance > 0, `dueDate < today`; show count and amount |
| MRR | Σ over ACTIVE, non-paused subscriptions of the recurring total normalized to a month |
| ARR | MRR × 12 |
| Churn rate | MRR of subscriptions closed in the month ÷ MRR at the start of the month |
| NRR | (start MRR − churned + expansion − contraction) ÷ start MRR |

Monthly normalization of a recurring amount `a`:

| Period | Monthly equivalent |
|---|---|
| DAILY | a × 30 |
| WEEKLY | a × 52 ÷ 12 |
| MONTHLY | a |
| YEARLY | a ÷ 12 |

MRR movement chart categories per month: **new** (subscriptions activated), **expansion** (quantity or plan upgrades), **contraction** (downgrades), **churned** (closed). For hackathon scope, derive expansion and contraction from the activity log entries written at plan/quantity change.

---

## 11. Decisions log

Append a line whenever you choose between valid options. Start with these defaults and edit them as you build.

| # | Decision | Default chosen |
|---|---|---|
| D1 | Discount stacking | No stacking; best single discount per line; subscription-scope applies after product-scope |
| D2 | Invoices from billing run | Created as DRAFT; bulk confirm available; `autoConfirmInvoices` setting |
| D3 | Invoice issue date | Equal to the run's `asOf` date |
| D4 | Billing on resume after pause | Missed periods are billed (catch-up) |
| D5 | Cancelled invoice period | Stays "consumed"; not regenerated automatically |
| D6 | Overpayment | Rejected |
| D7 | Currency | Single currency from `DEFAULT_CURRENCY` |
| D8 | Renewal | Extends expiry by one plan term |
