# 10: Resources: components, animations, assets

Everything here is free to start with. Always check each library's license before shipping, and copy only the components you actually use.

## Component libraries (copy-paste, shadcn-compatible)

| Library | Best for | Use it in this project for |
|---|---|---|
| **shadcn/ui** (ui.shadcn.com) | Accessible foundation | Forms, dialogs, dropdowns, tables, sidebar, charts |
| **Magic UI** (magicui.design) | Free animated components | Number ticker, bento grid, shimmer button, border beam, animated list, marquee |
| **Aceternity UI** (ui.aceternity.com) | Showpiece hero effects | Aurora background, spotlight, 3D card, background beams, sparkles |
| **React Bits** (reactbits.dev) | Creative text and backgrounds | Gradient text, aurora/particle backgrounds, cursor effects |
| **21st.dev** | Community marketplace | Search "dashboard", "pricing", "sidebar", "bento" for ready blocks |
| **Motion Primitives**, **Cult UI**, **Animata**, **Eldora UI** | Extra free animated pieces | Fill gaps without a paid tier |
| **Origin UI**, **Kibo UI** | Breadth of free components | Extra inputs, tables, kanban-style blocks |

Most install per component with the shadcn CLI. Example pattern: `npx shadcn@latest add @aceternity/<component-name>`. Check each site's install tab for the exact command or registry URL.

## Where to use what

| Screen | Pieces |
|---|---|
| Landing hero | Aceternity aurora or spotlight, Magic UI shimmer button, React Bits gradient text |
| Dashboard | Magic UI bento grid, number ticker, border beam on the hero KPI, shadcn charts, sparklines |
| Tables | shadcn table + TanStack Table, Magic UI animated list for row entrance (limit to the first rows) |
| Billing run | Brutalist button (own CSS), progress bar, result dialog with number tickers |
| Subscription detail | Own StatusStepper with Motion layout animations |
| Portal | Plan comparison cards with hover lift |
| Global | `cmdk` command palette, `sonner` toasts, `lenis` smooth scroll (landing only) |

## Motion and animation tools

| Tool | Use |
|---|---|
| **Motion** (motion.dev) | Page transitions, layout animations, staggered lists |
| **LottieFiles** (lottiefiles.com) | Success tick, empty-state animations, loading |
| **Spline** (spline.design) | Optional 3D scene for the landing hero (check performance on low-end machines) |
| **Rive** (rive.app) | Lightweight interactive animations (optional) |
| **GSAP** | Only if you need timeline-heavy hero choreography; Motion covers most needs |

## Glass and gradient helpers

| Tool | Use |
|---|---|
| **css.glass** or similar glassmorphism generators | Tune blur, border and opacity values |
| **Haikei**, **Mesh Gradient** generators | Aurora or mesh backgrounds as static fallbacks |
| **Realtime Colors** | Preview text/background combinations quickly |
| **WebAIM contrast checker** | Verify body text readable on glass |
| **Coolors** | Adjust the palette if you change the accent |

## Icons, fonts, illustrations

| Need | Source |
|---|---|
| Icons | `lucide-react` (already in shadcn) |
| Fonts | Geist (via `next/font`), Space Grotesk or Manrope (Google Fonts via `next/font`) |
| Spot illustrations (empty states) | unDraw, Storyset, or LottieFiles; recolor to the accent |
| Mock data text | Faker (`@faker-js/faker`) in the seed script |
| Logo / favicon | Simple text-based mark made in Figma or Canva; export SVG |

## Reference products to study (for features and layout ideas)

| Product | Look at |
|---|---|
| **Kill Bill** (open source) | Subscription lifecycle, plugin architecture, analytics |
| **Lago** (open source) | Plans, coupons, add-ons, invoicing, analytics layout |
| **Invoice Ninja** (open source) | Invoice, quote and client-portal flows |
| **FOSSBilling** (open source) | Client management and recurring invoicing |
| **Odoo Subscriptions** | The product this hackathon is modeled on: quotation templates, recurring plans, close reasons |
| **Stripe Billing, Chargebee, Recurly** | Proration, dunning, customer portal, MRR dashboards |

Study their screens for ideas, but build your own UI and logic; do not copy code or assets.

## Antigravity tips

- Keep `AGENTS.md` and `.agents/rules/` in the repo so every task starts with the right context.
- One goal per task. Review the plan before approving.
- Ask the agent to **verify in the browser** and report what it saw.
- Use "Agent-assisted" mode for feature work; use stricter review settings before anything that touches money logic.
- When the agent drifts, paste the "Stop. Re-read AGENTS.md" prompt from `docs/07-BUILD-PHASES.md`.

## Learning and debugging

| Topic | Search for |
|---|---|
| Prisma raw queries and `FOR UPDATE SKIP LOCKED` | "prisma $queryRaw transaction row lock" |
| Auth.js credentials + roles | "Auth.js credentials provider role jwt callback" |
| React PDF invoices | "@react-pdf/renderer Next.js route handler" |
| Vercel cron | "Vercel cron jobs Next.js route handler CRON_SECRET" |
| Slow queries | "Postgres EXPLAIN ANALYZE index" |
| Date math | "date-fns addMonths end of month" |
