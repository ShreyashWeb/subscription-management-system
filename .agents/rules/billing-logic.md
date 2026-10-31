# Billing logic rules (always apply)

Full detail is in `docs/06-BILLING-LOGIC.md`. Summary of the rules that must never be broken:

1. **Idempotent billing.** The `invoices` table has a unique constraint on `(subscriptionId, periodStart)`. Invoice creation uses insert-or-ignore semantics. Running billing twice for the same date creates zero additional invoices.
2. **Transactional per subscription.** Each subscription is billed in its own transaction: lock the row, create the invoice and lines, apply discounts, advance `nextInvoiceDate`, commit. One failure must not stop the others, and must be reported in the run summary.
3. **No skipped periods.** If `nextInvoiceDate` is several periods in the past, bill each missed period in order until `nextInvoiceDate` is later than the run date.
4. **Discount usage is atomic.** Increment `usedCount` with a guarded update (`WHERE usedCount < usageLimit`). If the guarded update affects zero rows, the discount is not applied.
5. **Tax is computed from admin-defined tax rules**, per line, after discount, rounded per line to the minor unit.
6. **Outstanding = invoice total minus sum of payments.** When it reaches zero the invoice becomes Paid automatically. Reject payments larger than the outstanding balance.
7. **Overdue = invoice is Confirmed, balance greater than zero, and dueDate earlier than today.**
8. **Status transitions are validated in one place** (a transition map per entity). Never set a status directly from a route handler.
9. **Every important change writes an activity log row** (who, what, when).
