# AGENTS.md: read this first

You are building **Brightloop Billing**, a subscription management system for a hackathon. Judges will run it, click through it, and watch a demo video. Correctness of the required features comes first; visual polish and a few memorable extras come second.

## Mission
Build one platform covering: auth and roles, products and variants, plans, quotation templates, subscriptions with a lifecycle, automatic invoicing with taxes and discounts, payments, and a finance dashboard. Every page must respond in **under 2 seconds** with thousands of subscriptions.

## Where things are
- Feature list and acceptance criteria: `docs/01-PRD.md`
- Billing rules (read before touching invoices, discounts, payments): `docs/06-BILLING-LOGIC.md`
- Database schema: `docs/03-DATABASE.md`
- Endpoints and permissions: `docs/04-API.md`
- UI tokens and motion: `docs/05-DESIGN-SYSTEM.md`
- Phase-by-phase plan: `docs/07-BUILD-PHASES.md`

## Working agreement
1. **Plan first.** For each phase, write an implementation plan and wait for approval before coding.
2. **One phase at a time.** Do not jump ahead. Do not start extras (Phase 8) until Phases 1 to 7 pass their verification steps.
3. **Verify in the running app.** After each phase, run the app, exercise the feature in the browser, and report what you tested. Do not claim a feature works without running it.
4. **Business logic lives in `src/server/`**, never inside React components.
5. **Authorization is enforced on the server** for every read and write. Hiding a button is not security.
6. **Keep everything on one git branch (`main`).** Commit small and often, with clear messages.
7. **Ask when a rule is ambiguous.** If `docs/` does not answer something, ask rather than guessing, then record the decision in `docs/06-BILLING-LOGIC.md` under "Decisions log".

## Non-negotiables (the problem statement)
- Email is unique per account. Password must be **more than 8 characters** (minimum 9) with an uppercase letter, a lowercase letter and a special character.
- Password reset link goes to the registered email.
- Only Admin can create staff. Only Admin can create discounts, taxes.
- Customers only ever see their own subscriptions and invoices.
- Subscription status: Draft → Quotation → Confirmed → Active → Closed.
- Invoice status: Draft → Confirmed → Paid. Invoices can be confirmed, cancelled, sent and printed.
- **Nothing billed twice, nothing skipped.**
- Discounts apply automatically on the next invoice and stop when expired or exhausted.
- Payments record method, amount, date and note against an invoice. Outstanding and overdue are always visible.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
