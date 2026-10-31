# 07: Build phases (prompts for Antigravity)

**How to use:** open the project folder in Antigravity. For each phase, paste the prompt into a **new task**. Let the agent propose a plan, read it, approve it, then let it build. At the end of each phase, run the **verification** yourself before moving on. Commit when a phase passes.

Do not start Phase 8 until Phases 1 to 7 pass. Never mix two phases in one task.

Suggested Antigravity setup: use **Agent-assisted** mode (the agent does the work, you approve key decisions), keep review of plans on, and let `.agents/rules/` do the repeating.

---

## Phase 0: Project setup and design foundation

```
Read AGENTS.md and everything under docs/. Then, for Phase 0, produce an implementation plan and wait for my approval before writing code.

Phase 0 goal: a running Next.js app with the design foundation, database connected, and seed scaffold.

Tasks:
- Create a Next.js (App Router) + TypeScript (strict) + Tailwind project in this folder (keep the existing docs and .agents folders).
- Install and configure shadcn/ui, Motion, lucide-react, sonner, cmdk, date-fns, zod, TanStack Table, Recharts via shadcn charts.
- Implement the design tokens and .glass / .glass-strong / .btn-brutal classes from docs/05-DESIGN-SYSTEM.md in src/styles/globals.css, with Geist and Space Grotesk fonts.
- Build AuroraBackground, GlassCard, BentoGrid, StatusPill, Money components.
- Create the app shell layout (glass sidebar, top bar placeholder) for the (app) route group and a public layout.
- Set up Prisma with the schema from docs/03-DATABASE.md, connect to DATABASE_URL, run the first migration, and create an empty prisma/seed.ts.
- Create a .env.example from the README.

Verification: npm run dev starts; the home page shows the aurora background and a sample glass bento grid; prisma migrate succeeds; I can open Prisma Studio and see all tables.
```

---

## Phase 1: Authentication and roles

```
Phase 1: Authentication and roles. Read docs/01-PRD.md section 1, docs/02-ARCHITECTURE.md section 4 and docs/04-API.md section 2. Plan first and wait for approval.

Build:
- Auth.js credentials login with JWT sessions carrying userId and role.
- Signup (creates CUSTOMER) with the exact password rule: more than 8 characters, with uppercase, lowercase and special character. One shared Zod schema for client and server. Live PasswordChecklist component on the signup form.
- Unique email (case-insensitive) with a friendly error message.
- Forgot password: emailed reset link (Resend), hashed single-use token expiring in 30 minutes, identical response whether or not the email exists. Reset password page.
- Middleware plus server-side requireRole / requireUser helpers.
- Admin-only "Staff" page to create staff accounts.
- Login page with one-click "Demo as Admin / Staff / Customer" buttons.
- Seed the three demo users from the README.
- Route guards: customers go to /portal; staff and admin go to /dashboard.

Verification:
1. Sign up twice with the same email: second attempt fails with a clear message.
2. "Abcdefg1!" works; "Abcdef1!" (8 chars) is rejected; each missing rule shows its own message.
3. Reset flow works end to end and a used token cannot be reused.
4. Staff cannot reach /staff; a customer cannot reach /dashboard; an unauthenticated user is redirected to /login.
5. Only the admin can create a staff account.
```

---

## Phase 2: Catalog (products, variants, taxes, plans)

```
Phase 2: Catalog. Read docs/01-PRD.md sections 2, 3, 7 and docs/04-API.md section 3. Plan first.

Build admin pages with server-paginated tables, create/edit dialogs or pages, Zod validation and role checks:
- Products: name, type, sales price, cost price, notes; variants (attribute, value, extra price). Show margin and effective variant price.
- Taxes: name, percentage (stored as basis points), active.
- Plans: price, period (daily/weekly/monthly/yearly), minimum quantity, available from/to, flags autoClose / closable / pausable / renewable, trialDays.
- Seed realistic data, including a product with variant Brand = Odoo adding +560 to the price.

Rules: only Admin can create/edit products, taxes, plans; staff can view. Money stored in minor units, shown with the Money component.

Verification: create a product with a +560 variant and see the effective price; create plans for each period; staff cannot edit; a plan outside its availability window is flagged.
```

---

## Phase 3: Templates and subscriptions

```
Phase 3: Quotation templates and subscriptions. Read docs/01-PRD.md sections 4 and 5, docs/06-BILLING-LOGIC.md sections 1 and 2, docs/04-API.md section 4. Plan first.

Build:
- Quotation templates (plan, lines, validity days).
- Subscription numbering with the Counter table (SUB-YYYY-NNNNN) inside the creating transaction.
- Create subscription from template or from scratch (customer, plan, start date, expiry, payment terms, lines with product, variant, quantity, unit price, tax, computed amount). Enforce plan minimum quantity and availability window.
- Status transitions via src/server/transitions.ts (single source of truth) with server-side validation; reject invalid jumps.
- Pause, resume, close, renew actions that honor the plan flags on the server.
- Subscription list (filters, search, pagination) and detail page with the StatusStepper, lines table and activity timeline.
- Activation sets nextInvoiceDate.

Verification: Draft to Quotation to Confirmed to Active works and invalid jumps fail; pause is rejected when the plan is not pausable; expired quotation cannot be confirmed; numbers are unique and sequential.
```

---

## Phase 4: Invoicing, taxes, discounts and the billing run

```
Phase 4: Invoicing and billing run. This is the most important phase. Read ALL of docs/06-BILLING-LOGIC.md first, plus docs/03-DATABASE.md and docs/04-API.md sections 5 and 6. Plan first, and include in the plan how idempotency and concurrency are guaranteed.

Build:
- Discount rules (admin only): fixed or percent, min purchase, min quantity, start/end, usage limit, scope product or subscription, with targets. List shows usedCount/usageLimit.
- billingService.run({ asOf, actor }) exactly as specified: select due ACTIVE subscriptions, per-subscription transaction with row lock (FOR UPDATE SKIP LOCKED), catch-up loop for missed periods, insert-or-ignore on unique (subscriptionId, periodStart), discount resolution with guarded atomic usage increment, per-line tax, advance nextInvoiceDate, auto-close when appropriate, summary result.
- Invoice numbering via Counter (INV-YYYY-NNNNNN). Invoice lines snapshot product, variant and prices.
- Invoice pages: list (filters), detail with lines, discount and tax breakdown. Actions: confirm, cancel, send (email), print/download PDF (@react-pdf/renderer).
- Billing Run page with the brutalist "Run Billing Now" button, an "as of" date picker (time-travel), progress, and a result summary dialog (created, skipped, failed, duration).
- Cron route /api/cron/billing protected by CRON_SECRET.

Verification (do all of these and report results):
1. Run billing twice for the same date: the second run creates zero invoices.
2. A subscription three periods behind gets three invoices with correct period ranges.
3. Paused subscription is skipped; after resume it is caught up.
4. A discount with usageLimit 2 applies to exactly two invoices and then stops; an expired discount never applies.
5. Totals: subtotal - discount + tax = total, per line and overall.
6. Confirm, cancel and PDF download work.
```

---

## Phase 5: Payments, outstanding and overdue

```
Phase 5: Payments. Read docs/06-BILLING-LOGIC.md section 8 and docs/01-PRD.md section 9. Plan first.

Build:
- payments.record in a single transaction with invoice row lock: method (cash, bank transfer, card, UPI, cheque), amount, date, note. Reject overpayment and payments on non-confirmed invoices. Update paidTotal; flip invoice to PAID automatically at zero balance. Write activity log.
- Payments list with filters.
- Outstanding balance shown on every invoice, and an Overdue view (status confirmed, balance > 0, dueDate < today) with days late.
- Dunning reminders at 1, 3 and 7 days late, idempotent via the unique (invoiceId, stage) key, logged and emailed if possible; show a reminder timeline on the invoice.
- Admin-only payment deletion that reopens the balance correctly.

Verification: partial payment keeps the invoice Confirmed with correct outstanding; final payment flips it to Paid; overpayment is rejected; overdue list matches seeded data; running dunning twice sends no duplicate reminders.
```

---

## Phase 6: Dashboard and reports (performance phase)

```
Phase 6: Finance dashboard and reports. Read docs/01-PRD.md section 10, docs/06-BILLING-LOGIC.md section 10 and docs/02-ARCHITECTURE.md section 5. Plan first.

Before building the dashboard, extend the seed so the database holds ~2,000 subscriptions and 6,000+ invoices (backfill by running the billing service month by month, then generate payments and overdue invoices as described in docs/03-DATABASE.md section 5).

Build:
- Bento dashboard: KPI tiles with number tickers (active subscriptions, revenue invoiced, payments received, outstanding, overdue count and amount), revenue-vs-payments chart, status donut, overdue list preview, "revenue at risk" card with top five late customers.
- Filters (date range, customer, plan, status) and a summary view.
- Reports page: MRR, ARR, churn, NRR, MRR movement chart.
- CSV export for filtered lists.
- Every number computed with SQL aggregates (groupBy / raw SQL), queries run in parallel, short caching where useful.
- A small "loaded in N ms" badge fed by server timing.

Verification: with the seeded data, measure and report load time for dashboard, subscriptions list, invoices list, overdue list and reports. Each must respond in under 2 seconds. If any exceeds it, inspect the query plan (EXPLAIN ANALYZE), add or fix indexes, and re-measure. Report the final numbers.
```

---

## Phase 7: Customer portal

```
Phase 7: Customer portal. Read docs/01-PRD.md section 11 and the permission matrix in docs/04-API.md. Plan first.

Build /portal with a simple glass layout:
- My subscriptions (cards with status stepper, next invoice date, amount) and detail pages.
- My invoices with outstanding amount, status, PDF download.
- Self-service pause / cancel / change quantity or plan where the plan flags allow, with a proration preview (docs/06-BILLING-LOGIC.md section 9) before confirming.
- Plan comparison cards for available plans.

Security: every query scoped by the logged-in customer; other customers' IDs return 404.

Verification: log in as the demo customer, see only their data; change the URL to another customer's invoice ID and get 404; a non-pausable plan shows no pause button and the server also rejects it.
```

---

## Phase 8: Standout extras and polish

```
Phase 8: Polish and extras. All previous phases pass. Plan first, and keep each item small.

Build, in this order, stopping when time runs out:
1. Landing page with hero, spotlight/aurora, pricing-table section from seeded plans, "Demo as Admin" button.
2. Command palette (Cmd+K): navigate to pages, search customers, subscriptions, invoices.
3. Skeletons, empty states with small illustrations, toasts, consistent error states on every page.
4. Page transitions and staggered list animations; respect prefers-reduced-motion.
5. Proration engine integrated with plan/quantity changes (admin and portal).
6. MRR movement chart refinements and CSV exports.
7. (Stretch) Stripe test-mode "Pay now" in the portal, or a mock gateway.

Verification: Lighthouse performance and accessibility pass on the landing page and dashboard; keyboard navigation works; no console errors; all earlier verifications still pass.
```

---

## Phase 9: Hardening, deploy and submission

```
Phase 9: Hardening and deployment.

- Review every server action and route for role checks and ownership scoping; list what you checked.
- Add unit tests for: password schema, transition maps, period math, discount resolution, tax rounding, proration, overdue calculation, and an integration test proving billing idempotency.
- Fix lint and type errors; remove dead code.
- Write the final README: overview, screenshots, setup steps, demo logins, architecture summary, performance numbers, decisions log summary, future work.
- Prepare Vercel deployment: env vars, prisma migrate deploy, seed instructions, cron configuration.

Verification: clean build, tests pass, deployed app works with all three demo logins, and docs/09-CHECKLIST.md is fully ticked.
```

---

## Handy mid-build prompts

**Agent got stuck or drifted:**
```
Stop. Re-read AGENTS.md and the rule files. Summarize what you changed in this task, what is not yet working, and propose the smallest next step.
```

**Verify without trusting the agent:**
```
Run the app and demonstrate this feature in the browser step by step. Report what you clicked, what you saw, and any mismatch with docs/01-PRD.md.
```

**Slow page:**
```
This page is slow. Capture the SQL it runs, run EXPLAIN ANALYZE, propose index or query changes, apply them, and report before/after timings.
```

**Security review:**
```
Audit all server actions and route handlers for missing role checks and missing customer-ownership scoping. Output a table: endpoint, check present, fix needed. Then fix the gaps.
```
