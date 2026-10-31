# 02: Architecture

## 1. Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript strict | UI and API in one repo, one-click Vercel deploy |
| Styling | Tailwind CSS + shadcn/ui | Accessible primitives for forms, dialogs, tables, sidebar |
| Motion | Motion (formerly Framer Motion) | Number tickers, page transitions, layout animations |
| Charts | shadcn/ui Charts (Recharts) | Area, bar, donut, sparkline |
| Tables | TanStack Table | Server-side pagination, sorting, filtering |
| Database | PostgreSQL (Neon or Supabase) | Real constraints, indexes, aggregates |
| ORM | Prisma | Type-safe, migrations, seed |
| Auth | Auth.js (credentials provider) | Email and password. Password hashing with argon2 or bcrypt |
| Validation | Zod | Shared schemas for client and server |
| Email | Resend | Reset link, invoice send, dunning |
| PDF | `@react-pdf/renderer` | Invoice download and print |
| Jobs | Vercel Cron → `/api/cron/billing` | Plus the manual Run Billing Now button |
| Extras | `sonner`, `cmdk`, `lucide-react`, `date-fns`, `lenis` | Toasts, command palette, icons, dates, smooth scroll |

## 2. Layering (the most important rule)

```
UI (React components, pages)
  → server actions / route handlers      (auth check + Zod validation only)
    → services in src/server/*           (ALL business rules)
      → Prisma client                    (data access)
        → PostgreSQL
```

- Components never contain pricing, tax, discount, status or billing logic.
- Services never import React. They take plain inputs and an `actor` (the current user) and return plain data.
- Policies (`src/server/policies`) answer "may this actor do this to this record?" and are called by services.

## 3. Folder structure

```
src/
├── app/
│   ├── (public)/            landing, login, signup, forgot/reset password
│   ├── (app)/               admin + staff shell (sidebar layout)
│   │   ├── dashboard/
│   │   ├── products/  plans/  templates/
│   │   ├── subscriptions/   [id]/
│   │   ├── invoices/        [id]/
│   │   ├── payments/
│   │   ├── discounts/  taxes/  staff/      (admin only)
│   │   ├── billing-run/
│   │   └── reports/
│   ├── portal/              customer shell
│   └── api/
│       ├── cron/billing/    GET, protected by CRON_SECRET
│       ├── invoices/[id]/pdf/
│       └── export/[entity]/ CSV export
├── components/
│   ├── ui/                  shadcn primitives
│   ├── glass/               GlassCard, BentoGrid, AuroraBackground, StatusPill
│   ├── charts/  tables/  forms/
├── server/
│   ├── services/            auth, products, plans, templates, subscriptions,
│   │                        invoices, billing, discounts, taxes, payments, reports, dunning
│   ├── policies/            permissions by role and ownership
│   ├── transitions.ts       status transition maps (single source of truth)
│   └── jobs/                billing run, dunning run
├── lib/
│   ├── db.ts  auth.ts  money.ts  dates.ts  numbering.ts
│   ├── validators/          Zod schemas
│   ├── pdf/  email/
└── styles/globals.css       design tokens
prisma/
├── schema.prisma
└── seed.ts
```

## 4. Authentication and authorization

- **Sessions:** Auth.js with the credentials provider and JWT sessions carrying `userId` and `role`.
- **Hashing:** argon2id (or bcrypt cost 12). Never store or log plain passwords.
- **Middleware:** redirects unauthenticated users to `/login`; sends customers away from `/(app)` routes and staff away from `/portal`.
- **Server checks:** every action calls `requireRole(["ADMIN"])` etc. Middleware alone is not enough.
- **Ownership:** in the service layer, customer queries are always scoped with `where: { customerId: actor.id }`.
- **Reset tokens:** 32 random bytes, stored as SHA-256 hash, expiry 30 minutes, single-use (`usedAt`).
- **Rate limiting:** simple in-memory or DB-based limiter on login and reset endpoints (stretch).

## 5. Performance strategy (the "under 2 seconds" requirement)

1. **Indexes** on every filter and sort column (see `03-DATABASE.md`).
2. **Server pagination** (page size 20 to 50) for every table.
3. **SQL aggregates** for all dashboard numbers. No loading rows to sum in JavaScript.
4. **Select only needed columns.** No `include` of deep relations on list pages.
5. **Parallel queries** on the dashboard with `Promise.all`.
6. **Cache** slow-changing aggregates briefly (`unstable_cache` with a 30–60 s revalidate) if a query is heavy. Billing and payments revalidate the relevant tags.
7. **Region:** deploy the app and database in the same region.
8. **Proof:** a small "loaded in N ms" badge fed by server timing, plus a note in the README with measured numbers on the 2,000-subscription seed.
9. **Billing run** processes subscriptions in batches (for example 100 at a time) so it stays inside serverless time limits; the UI polls progress.

## 6. Billing job

- `POST /api/billing/run` (admin/staff session) with optional `asOf` date → runs the service, returns a summary.
- `GET /api/cron/billing` (requires `Authorization: Bearer $CRON_SECRET`) → same service, `asOf = today`.
- Both call `billingService.run({ asOf, actor })`. The logic is identical; only the trigger differs.

## 7. Error handling and UX rules

- Services throw typed errors (`ForbiddenError`, `NotFoundError`, `ValidationError`, `ConflictError`). Route handlers map them to HTTP codes; actions map them to form errors.
- Every page has loading (skeleton), empty and error states.
- Destructive actions (cancel invoice, close subscription) require a confirm dialog.

## 8. Deployment

1. Push to GitHub (`main`).
2. Import the repo in Vercel; set the env vars from the README.
3. Run `prisma migrate deploy` and the seed against the production database once.
4. Add a Vercel Cron entry for `/api/cron/billing` (daily). Check plan limits; the manual button covers the demo regardless.
5. Smoke-test: sign in with each demo login on the deployed URL.
