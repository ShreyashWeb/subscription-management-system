# Brightloop Billing

> One platform for plans, subscriptions, invoices, payments and revenue reporting.
> Built for the Odoo Hackathon: *Subscription Management System*.

Brightloop Software sells everything on subscription. This system replaces their spreadsheet-and-memory workflow with one unified platform: set up products and plans, turn quotes into subscriptions, generate invoices automatically on billing day, record payments, and give the finance lead a live view of recurring revenue.

---

## How to use this documentation pack

This folder is the **single source of truth** for the build. Drop it into an empty project folder, open the folder in Antigravity, and build phase by phase.

| File | Purpose |
|---|---|
| `README.md` | This file: overview, quick start, repo layout |
| `AGENTS.md` | Short brief the coding agent reads first |
| `.agents/rules/*.md` | Persistent Antigravity rules (project, billing logic, design) |
| `docs/01-PRD.md` | Every feature, mapped to the problem statement, with acceptance criteria |
| `docs/02-ARCHITECTURE.md` | Stack, folder structure, layering, auth, performance strategy |
| `docs/03-DATABASE.md` | Full schema (Prisma), indexes, constraints, seed plan |
| `docs/04-API.md` | Endpoints / server actions and the role permission matrix |
| `docs/05-DESIGN-SYSTEM.md` | Aurora Glass + Bento design tokens, components, motion rules |
| `docs/06-BILLING-LOGIC.md` | The tricky rules: idempotent billing, discounts, tax, proration, overdue, MRR |
| `docs/07-BUILD-PHASES.md` | Ready-to-paste prompts, one per phase, with verification steps |
| `docs/08-DEMO-SCRIPT.md` | 3-minute demo video script |
| `docs/09-CHECKLIST.md` | Pre-submission checklist and judging angles |
| `docs/10-RESOURCES.md` | Where to get UI components, animations and assets |

**Reading order for the agent:** `AGENTS.md` → `docs/01` → `docs/06` → `docs/03` → the rest as needed.

---

## Quick start (for you)

1. Create a GitHub repo (suggested name: `brightloop-billing`), clone it, and copy this pack into the root.
2. Open the folder in Antigravity.
3. Open `docs/07-BUILD-PHASES.md` and paste **Phase 0** as the first task. Review the plan the agent proposes before approving it.
4. Work through the phases in order. Do not start Phase 8 (extras) until Phases 1 to 7 work end to end.
5. Commit often on a **single branch** (`main`). The hackathon requires all code in one branch.

### Accounts to create before building
- **Neon** or **Supabase** (free PostgreSQL)
- **Resend** (free email, for reset links and invoice emails)
- **Vercel** (free hosting, connect to your GitHub repo)

### Environment variables (`.env.local`)

```bash
DATABASE_URL="postgresql://..."          # Neon/Supabase connection string
AUTH_SECRET="generate with: openssl rand -base64 32"
APP_URL="http://localhost:3000"          # production URL on Vercel later
RESEND_API_KEY="re_..."
EMAIL_FROM="Brightloop <onboarding@resend.dev>"
CRON_SECRET="any-long-random-string"     # protects the billing cron endpoint
DEFAULT_CURRENCY="INR"                   # change if you prefer USD
```

---

## Tech stack (summary)

Next.js (App Router) + TypeScript, Tailwind CSS, shadcn/ui, Motion, shadcn Charts (Recharts), TanStack Table, PostgreSQL, Prisma, Auth.js, Zod, Resend, `@react-pdf/renderer`. Details in `docs/02-ARCHITECTURE.md`.

## Roles

| Role | Can do |
|---|---|
| **Admin** | Everything: staff accounts, taxes, discounts, plans, products, billing, reports |
| **Internal staff** | Day-to-day work: customers, subscriptions, invoices, payments. No taxes, discounts or staff management |
| **Customer** | Portal only: own subscriptions and invoices |

## Demo logins (created by the seed script)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@brightloop.test` | `Admin@12345` |
| Staff | `staff@brightloop.test` | `Staff@12345` |
| Customer | `customer@brightloop.test` | `Customer@12345` |

## Target repo layout

```
brightloop-billing/
├── README.md
├── AGENTS.md
├── .agents/rules/
├── docs/
├── prisma/            schema.prisma, seed.ts
├── src/
│   ├── app/           routes (public, (app) admin/staff, portal, api)
│   ├── components/    ui/ (shadcn), glass/, charts/, tables/, forms/
│   ├── server/        services, policies, jobs  (all business logic)
│   ├── lib/           db, auth, money, dates, validators, pdf, email
│   └── styles/        globals.css (design tokens)
└── public/
```
