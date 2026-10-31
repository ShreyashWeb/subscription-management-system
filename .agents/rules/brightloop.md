# Brightloop Billing: project rules

## Stack
Next.js App Router, TypeScript (strict), Tailwind CSS, shadcn/ui, Motion, Prisma, PostgreSQL, Zod, Auth.js, Resend.

## Code organization
- All business rules live in `src/server/*` services. React components only render and call services via server actions or route handlers.
- Validation uses Zod schemas in `src/lib/validators`, shared by client and server. The password schema is defined once and reused.
- Every server action and route handler starts with an authorization check (`requireRole(...)` or `requireUser()`), then input validation, then the service call.
- Customers can only read or write rows where `customerId` matches their own user. Enforce this inside the service layer, not only in the UI.

## Data rules
- Money is stored as **integer minor units** (paise or cents). Format with `Intl.NumberFormat` in the UI only.
- Dates that mean "a calendar day" (due date, period start) are stored as `DATE`, not timestamps.
- Every list endpoint is **server-paginated** and filterable. Never load all rows into memory.
- Dashboard numbers come from **SQL aggregates** (`groupBy`, `_sum`, `_count`, or raw SQL), not from fetching rows and summing in JavaScript.
- Add an index for every column used in a filter, join or sort. See `docs/03-DATABASE.md`.

## Quality
- Every page has a loading state (skeleton), an empty state and an error state.
- Forms show field-level errors and disable the submit button while pending.
- No `any`. No unchecked `as` casts on external input.
- Keep everything on a single git branch (`main`). Small commits with clear messages.
- After each phase, run the app and verify the feature in the browser before reporting done.
