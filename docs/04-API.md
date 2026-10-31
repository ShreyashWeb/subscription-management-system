# 04: API and permissions

The app can expose these as **server actions** (preferred for forms) or **route handlers** (needed for PDF, CSV, cron). Whichever you choose, the contract below is the same: authenticate → authorize → validate (Zod) → call service → return typed result.

## 1. Permission matrix

A = Admin · S = Staff · C = Customer (own records only) · ✓ allowed · ✗ denied · own = only where `customerId` is the actor

| Resource / action | A | S | C |
|---|---|---|---|
| Sign up (becomes Customer) | public | public | public |
| Create staff account | ✓ | ✗ | ✗ |
| Products: create / edit | ✓ | ✗ | ✗ |
| Products: view | ✓ | ✓ | ✗ |
| Plans: create / edit | ✓ | ✗ | ✗ |
| Plans: view | ✓ | ✓ | view available plans |
| Quotation templates: create / edit | ✓ | ✓ | ✗ |
| Taxes: create / edit | ✓ | ✗ | ✗ |
| **Discounts: create / edit** | ✓ | ✗ | ✗ |
| Discounts: view | ✓ | ✓ | ✗ |
| Subscriptions: create / edit / transition | ✓ | ✓ | own (pause / cancel / change plan, if plan allows) |
| Subscriptions: view | ✓ | ✓ | own |
| Invoices: generate (billing run) | ✓ | ✓ | ✗ |
| Invoices: confirm / cancel / send | ✓ | ✓ | ✗ |
| Invoices: view / download PDF | ✓ | ✓ | own |
| Payments: record | ✓ | ✓ | ✗ (stretch: own via Pay now) |
| Payments: view | ✓ | ✓ | own |
| Customers: view / edit | ✓ | ✓ | own profile |
| Dashboard and reports | ✓ | ✓ | ✗ |
| CSV export | ✓ | ✓ | ✗ |
| Run cron endpoint | secret | secret | ✗ |

Return **404** (not 403) when a customer requests another customer's record, so IDs cannot be probed.

## 2. Auth

| Endpoint / action | Input | Notes |
|---|---|---|
| `signup` | name, email, password | Zod password schema. Lowercase email. Duplicate email → `ConflictError` with friendly message. Creates CUSTOMER. |
| `login` | email, password | Auth.js credentials. Generic failure message. |
| `requestPasswordReset` | email | Always returns success. If user exists: create token, email link `APP_URL/reset-password?token=...`. |
| `resetPassword` | token, newPassword | Token valid, unexpired, unused. Validates password schema. Marks token used. |
| `createStaff` (admin) | name, email, temp password | Role STAFF. Prompt to change password on first login (stretch). |

**Password Zod schema (single source of truth):**

```ts
export const passwordSchema = z
  .string()
  .min(9, "Password must be more than 8 characters")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[^A-Za-z0-9]/, "Add a special character");
```

## 3. Catalog

| Action | Roles | Input (summary) |
|---|---|---|
| `products.list` | A, S | search, type, page, pageSize |
| `products.create/update` | A | name, type, salesPrice, costPrice, notes, variants[] |
| `plans.list` | A, S, C(available only) | filters, page |
| `plans.create/update` | A | price, period, minQty, availableFrom/To, autoClose, closable, pausable, renewable, trialDays |
| `taxes.list/create/update` | A (list also S) | name, ratePercent, active |
| `templates.list/create/update` | A, S | name, planId, validityDays, lines[] |

## 4. Subscriptions

| Action | Roles | Notes |
|---|---|---|
| `subscriptions.list` | A, S, C(own) | filters: status, customerId, planId, q, dateFrom/To; sorted; paginated |
| `subscriptions.get` | A, S, C(own) | with lines, next allowed actions, activity |
| `subscriptions.createFromTemplate` | A, S | templateId, customerId, startDate |
| `subscriptions.create/update` | A, S | allowed while DRAFT or QUOTATION |
| `subscriptions.transition` | A, S | `{ id, to }`. Validated by `transitions.ts`. Sets `nextInvoiceDate` on activation. |
| `subscriptions.pause / resume` | A, S, C(own) | Rejected if plan `pausable = false` |
| `subscriptions.close` | A, S, C(own) | Rejected if plan `closable = false` (for early close) |
| `subscriptions.renew` | A, S, C(own) | Rejected if plan `renewable = false`. Extends expiry by plan term |
| `subscriptions.changeQuantity/plan` | A, S, C(own) | Computes proration (see billing logic). Preview endpoint: `previewChange` |

## 5. Invoices and billing

| Endpoint / action | Roles | Notes |
|---|---|---|
| `billing.run` | A, S | `{ asOf?: date }` → `{ created, skipped, failed, invoices[] }`. Runs in batches. |
| `GET /api/cron/billing` | secret | Same as above with `asOf = today`. Header `Authorization: Bearer $CRON_SECRET`. |
| `invoices.list` | A, S, C(own) | filters: status, customerId, overdue, dateFrom/To, q |
| `invoices.get` | A, S, C(own) | lines, payments, outstanding |
| `invoices.confirm` | A, S | DRAFT → CONFIRMED. Sets issue and due date if not set. |
| `invoices.cancel` | A, S | Only DRAFT or CONFIRMED with no payments. |
| `invoices.send` | A, S | Emails PDF link, sets `sentAt`. |
| `GET /api/invoices/[id]/pdf` | A, S, C(own) | Returns PDF. Used for print and download. |
| `invoices.confirmAllDrafts` | A, S | Bulk confirm (optionally by run). |

## 6. Discounts

| Action | Roles | Notes |
|---|---|---|
| `discounts.list` | A, S | includes `usedCount / usageLimit` |
| `discounts.create/update` | **A only** | type, value, minPurchase, minQty, dates, usageLimit, scope, targets |
| `discounts.deactivate` | A | Soft-disable |

Discounts are **never applied by the client**. They are resolved by the billing service at invoice generation.

## 7. Payments

| Action | Roles | Notes |
|---|---|---|
| `payments.record` | A, S | `{ invoiceId, method, amount, paidOn, note }`. Invoice must be CONFIRMED. Amount ≤ outstanding. Updates `paidTotal`; flips to PAID at zero balance. Single transaction. |
| `payments.list` | A, S, C(own) | filters: method, date range, invoice, customer |
| `payments.delete` | A | Reverses `paidTotal`; PAID → CONFIRMED if balance reopens |

## 8. Reports

| Action | Returns |
|---|---|
| `reports.summary({ from, to, customerId?, planId? })` | activeSubscriptions, revenueInvoiced, paymentsReceived, outstanding, overdueCount, overdueAmount |
| `reports.mrrSeries({ months })` | per month: new, expansion, contraction, churned, closing MRR |
| `reports.overdue({ page })` | overdue invoices with days late and customer |
| `reports.topLate()` | top 5 customers by overdue amount |
| `GET /api/export/[entity]` | CSV of the filtered list (subscriptions, invoices, payments) |

All reports use SQL aggregates and are cached briefly where appropriate.

## 9. Standard response shape

```ts
type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: "VALIDATION" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "SERVER"; message: string; fields?: Record<string, string> } };
```

Paginated lists return `{ items, page, pageSize, total }`.
