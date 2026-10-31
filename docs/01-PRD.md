# 01: Product Requirements (PRD)

Legend: **[PS]** required by the problem statement · **[X]** extra that makes the project stand out · **[S]** stretch, only if time remains.

Priority order: all [PS] first, then [X] marked *(core extra)*, then the rest.

---

## 1. Authentication and roles

| ID | Requirement | Type |
|---|---|---|
| AUTH-1 | Sign up with email and password. Each email belongs to one account only (case-insensitive unique). | PS |
| AUTH-2 | Password must be **more than 8 characters** (so at least 9), with at least one uppercase letter, one lowercase letter and one special character. Same Zod schema on client and server. | PS |
| AUTH-3 | Forgot password: a reset link is emailed to the registered email. Token is single-use, hashed in the database, expires in 30 minutes. The response is identical whether or not the email exists (no account enumeration). | PS |
| AUTH-4 | Three roles: Admin, Internal staff, Customer. | PS |
| AUTH-5 | Only Admin can create staff accounts. Self sign-up always creates a Customer. | PS |
| AUTH-6 | Customers see only their own subscriptions and invoices (portal). | PS |
| AUTH-7 | "Demo as Admin / Staff / Customer" one-click buttons on the login page. | X *(core extra)* |
| AUTH-8 | Live password-strength checklist while typing. | X |

**Acceptance:** signing up twice with the same email fails with a clear message. A password like `Abcdefg1!` (9 chars) is accepted; `Abcdef1!` (8 chars) is rejected. A customer opening another customer's invoice URL gets 404/403.

---

## 2. Products and variants

| ID | Requirement | Type |
|---|---|---|
| PROD-1 | Admin creates products with name, type, sales price, cost price, notes. | PS |
| PROD-2 | Products can have variants defined by an attribute and value, each with an extra price (e.g. attribute *Brand*, value *Odoo*, extra **+560**). | PS |
| PROD-3 | Effective price of a variant = sales price + extra price. | PS |
| PROD-4 | Margin (sales minus cost) shown on the product page. | X |

**Acceptance:** a product with sales price 1000 and variant *Brand = Odoo (+560)* shows an effective price of 1560 when that variant is added to a subscription line.

---

## 3. Plans

| ID | Requirement | Type |
|---|---|---|
| PLAN-1 | Plan has price and billing period: **daily, weekly, monthly or yearly**. | PS |
| PLAN-2 | Plan has minimum quantity and available-from / available-to dates. | PS |
| PLAN-3 | Per plan, admin decides: auto-close at end, closable early, pausable, renewable. | PS |
| PLAN-4 | A plan outside its availability window cannot be selected for new subscriptions. | PS |
| PLAN-5 | Free-trial days on a plan. | X |
| PLAN-6 | Pricing-table style plan comparison cards in the portal. | X |

**Acceptance:** with `pausable = false`, the Pause action is hidden in the UI **and** rejected by the server. Quantity below the plan minimum is rejected.

---

## 4. Quotation templates

| ID | Requirement | Type |
|---|---|---|
| TPL-1 | Template has a name, a plan, product lines (product, variant, quantity) and a validity in days. | PS |
| TPL-2 | "Create subscription from template" pre-fills plan and lines, creating a Draft/Quotation. | PS |
| TPL-3 | Quotation expiry = creation date + validity days. Expired quotations cannot be confirmed. | PS |

---

## 5. Subscriptions

| ID | Requirement | Type |
|---|---|---|
| SUB-1 | Each subscription has an auto-generated unique number (e.g. `SUB-2026-00042`). | PS |
| SUB-2 | Fields: customer, plan, start date, expiry date, payment terms (days). | PS |
| SUB-3 | Lines: product, quantity, unit price, taxes, amount. | PS |
| SUB-4 | Status flow **Draft → Quotation → Confirmed → Active → Closed**, visible to every team member. | PS |
| SUB-5 | Pause, resume, renew and close actions, available only where the plan flags allow. | PS |
| SUB-6 | Visual status stepper on the detail page. | X *(core extra)* |
| SUB-7 | Activity timeline: who changed what and when. | X |
| SUB-8 | Proration when quantity or plan changes mid-cycle. | X |

**Acceptance:** an invalid jump (e.g. Draft → Active) is rejected by the server. The detail page always shows the current status and the next allowed actions.

---

## 6. Invoicing

| ID | Requirement | Type |
|---|---|---|
| INV-1 | Invoices are generated **from subscriptions**, pre-filled with customer details, product lines, taxes and totals. No manual typing. | PS |
| INV-2 | Taxes are computed automatically from admin-defined tax rules. | PS |
| INV-3 | Actions: confirm, cancel, send (email), print (PDF download). | PS |
| INV-4 | Status flow **Draft → Confirmed → Paid**. Cancelled is a terminal side state. | PS |
| INV-5 | **Never billed twice, never skipped.** Unique `(subscription, period start)`, transactional billing, catch-up for missed periods. | PS |
| INV-6 | Billing run page: "Run Billing Now" with progress and a result summary (created, skipped, failed). | X *(core extra)* |
| INV-7 | **Time-travel simulator:** run billing "as of" any date (demo and testing). | X *(core extra)* |
| INV-8 | Bulk actions: confirm all drafts from a run. | X |

**Acceptance:** run billing twice for the same date → the second run reports 0 created. A subscription 3 periods behind gets 3 invoices in order.

---

## 7. Taxes

| ID | Requirement | Type |
|---|---|---|
| TAX-1 | Admin creates tax rules (name, percentage, active). | PS |
| TAX-2 | Tax rule is selectable per subscription line. | PS |
| TAX-3 | Invoice shows subtotal, discount, tax and total. | PS |

---

## 8. Discounts

| ID | Requirement | Type |
|---|---|---|
| DISC-1 | **Only Admin** can create discount rules. | PS |
| DISC-2 | Type: fixed amount or percentage. | PS |
| DISC-3 | Conditions: minimum purchase amount, minimum quantity, start date, end date. | PS |
| DISC-4 | Usage limit (maximum number of times it can be applied). | PS |
| DISC-5 | Scope: specific products or whole subscriptions. | PS |
| DISC-6 | Applied **automatically** on the next invoice. Stops when expired or exhausted. | PS |
| DISC-7 | "Used 7 / 10" counter on the discount list. | X |

---

## 9. Payments

| ID | Requirement | Type |
|---|---|---|
| PAY-1 | Record a payment with method, amount, date and note against an invoice. | PS |
| PAY-2 | Methods: cash, bank transfer, card, UPI, cheque (configurable list). | PS |
| PAY-3 | See at any moment which invoices are paid and which are outstanding. | PS |
| PAY-4 | Partial payments supported. Invoice becomes Paid when balance reaches zero. | PS |
| PAY-5 | Overdue invoices list for chasing. | PS |
| PAY-6 | Dunning timeline: reminders at day 1, 3 and 7 after due date, logged (and emailed if email is configured). | X |
| PAY-7 | Stripe test-mode "Pay now" in the portal (or mock gateway). | S |

---

## 10. Finance dashboard and reports

| ID | Requirement | Type |
|---|---|---|
| REP-1 | One place showing: active subscriptions, revenue, payments received, amount still owed, overdue invoices. | PS |
| REP-2 | Filters (date range, customer, plan, status) and a summary view. | PS |
| REP-3 | **Every page responds in under 2 seconds** with thousands of subscriptions (indexes, pagination, SQL aggregates). | PS |
| REP-4 | MRR, ARR, churn rate, net revenue retention. Monthly MRR movement chart (new, expansion, contraction, churned). | X *(core extra)* |
| REP-5 | "Revenue at risk" card: total overdue plus top five late customers. | X |
| REP-6 | CSV export of any filtered table. | X |
| REP-7 | Small "loaded in N ms" badge to prove the performance requirement. | X |

---

## 11. Customer portal

| ID | Requirement | Type |
|---|---|---|
| POR-1 | Customer sees own subscriptions and invoices only. | PS |
| POR-2 | Download invoice PDF. | X |
| POR-3 | Self-serve pause / cancel / change plan (where plan flags allow) with proration preview. | X |

---

## 12. Global polish

- Command palette (⌘K) to jump to pages, customers, invoices. **[X]**
- Skeleton loaders, toasts, empty-state illustrations, optimistic updates where safe. **[X]**
- Seed script with realistic data (about 2,000 subscriptions, 6,000+ invoices). **[X]**

---

## Out of scope

Multi-currency, real tax-authority integrations, usage-based metering, multi-tenant organizations, real payment settlement. Mention them in the README as "future work" so judges see you considered them.
