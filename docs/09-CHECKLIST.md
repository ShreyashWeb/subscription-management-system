# 09: Checklist and judging angles

## A. Problem statement coverage (must all be ticked)

### Auth and roles
- [ ] Email unique per account
- [ ] Password more than 8 chars (min 9) + uppercase + lowercase + special character
- [ ] Reset link emailed to registered address
- [ ] Admin / Staff / Customer roles behave differently
- [ ] Only Admin can add staff
- [ ] Customer sees only own subscriptions and invoices (try another ID in the URL)

### Catalog
- [ ] Product: name, type, sales price, cost price, notes
- [ ] Variants with extra price (Odoo brand +560)
- [ ] Plan: price, period (daily/weekly/monthly/yearly), min quantity, availability dates
- [ ] Plan flags: auto-close, closable, pausable, renewable (enforced on the server)

### Quotes and subscriptions
- [ ] Quotation template with plan, lines and validity days
- [ ] Subscription from template
- [ ] Unique subscription number
- [ ] Customer, plan, start, expiry, payment terms, lines with taxes and amounts
- [ ] Status flow Draft → Quotation → Confirmed → Active → Closed, visible to team

### Invoicing
- [ ] Invoices generated from subscriptions (nothing typed by hand)
- [ ] Taxes auto-calculated from admin rules
- [ ] Confirm, cancel, send, print work
- [ ] Status Draft → Confirmed → Paid
- [ ] Running billing twice creates no duplicates
- [ ] Missed periods are caught up (nothing skipped)

### Discounts
- [ ] Admin-only creation
- [ ] Fixed and percentage
- [ ] Min purchase / min quantity, start and end dates, usage limit
- [ ] Applies to products or whole subscriptions
- [ ] Appears automatically on the next invoice
- [ ] Stops at expiry and when usage limit is reached

### Payments
- [ ] Method, amount, date, note, against the right invoice
- [ ] Paid vs outstanding visible at any time
- [ ] Overdue list available
- [ ] Partial payments work; invoice becomes Paid at zero balance

### Finance dashboard
- [ ] Active subscriptions, revenue, payments, overdue invoices in one place
- [ ] Filters and summary view
- [ ] Every page under 2 seconds with seeded thousands of records (numbers recorded in README)

## B. Standout extras (tick what you shipped)
- [ ] Run Billing Now with progress and result summary
- [ ] Time-travel "as of" billing date
- [ ] Dunning reminders at 1, 3, 7 days
- [ ] Proration with preview
- [ ] MRR / ARR / churn / NRR and movement chart
- [ ] Revenue-at-risk card
- [ ] Customer self-service portal
- [ ] Command palette (Cmd+K)
- [ ] CSV export
- [ ] Demo-login buttons
- [ ] "Loaded in N ms" badge

## C. Quality
- [ ] No console errors on any page
- [ ] Loading, empty and error states everywhere
- [ ] Works at laptop and phone widths
- [ ] Keyboard focus visible; contrast acceptable on glass cards
- [ ] No secrets in the repo (check `.env.local` is git-ignored; only `.env.example` committed)
- [ ] Lint and type check clean; build succeeds
- [ ] Tests for billing idempotency, discount resolution, password schema

## D. Hackathon portal logistics
- [ ] All teammates confirmed participation on the portal with the same GitHub ID
- [ ] Mentor's GitHub added as collaborator (invite accepted if possible)
- [ ] Joined the Discord server
- [ ] **Everything on a single branch** of the repo
- [ ] Repo is accessible (public, or collaborators added) when submitted
- [ ] Team leader selected the problem statement (cannot be changed afterwards)
- [ ] Team leader submitted the GitHub repo link
- [ ] Team leader submitted the video link; opened it in a private window to confirm it plays
- [ ] Submitted before the milestone deadline

## E. README must contain
1. One-paragraph overview and screenshot or GIF
2. Live demo link and demo logins
3. Feature list mapped to the problem statement
4. Extras you built
5. Tech stack and architecture diagram (simple)
6. How to run locally (env vars, migrate, seed)
7. Performance numbers measured on the seed
8. Key decisions (idempotent billing, discount rules, no stacking)
9. Future work (multi-currency, usage-based billing, real payment gateway, tax integrations)

## F. How judges will likely evaluate (play to these)

| Angle | What to make obvious |
|---|---|
| Completeness | Every bullet of the problem statement works; nothing half-built |
| Correctness | No double billing, correct totals, correct overdue logic, correct discount stopping |
| Security | Role enforcement on the server; customers cannot read others' data |
| Performance | Evidence for the 2-second claim |
| UX and visual quality | Clean flows, consistent glass and bento design, thoughtful empty states |
| Innovation | Time-travel billing, dunning, proration, MRR analytics, portal |
| Demo | Clear story, no dead air, nothing slow or broken on camera |
| Code quality | Layered architecture, validation, tests, readable README |

## G. Last-hour rules
1. Freeze new features at least 90 minutes before the deadline.
2. Fresh clone, install, migrate, seed, run: prove a stranger could do it.
3. Re-run the full demo script on the deployed URL.
4. Record the video last, after everything is stable.
5. Submit early; do not wait for the final minutes.
