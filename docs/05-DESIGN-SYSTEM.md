# 05: Design system: Aurora Glass + Bento

**Concept:** a dark, premium fintech feel. Frosted-glass cards float over a slowly moving aurora gradient. The dashboard is a bento grid. One neo-brutalist button gives the demo a memorable hook.

Why this style: charts and KPI numbers glow on glass; bento layouts feel designed, not templated. Neo-brutalism and claymorphism hurt readability on data-heavy finance screens, so they are used only as accents.

---

## 1. Tokens (`src/styles/globals.css`)

```css
:root {
  /* surfaces */
  --bg: #07070d;
  --glass: rgba(255, 255, 255, 0.06);
  --glass-strong: rgba(255, 255, 255, 0.10);
  --glass-border: rgba(255, 255, 255, 0.14);

  /* aurora */
  --aurora-1: #6d5dfc;   /* violet */
  --aurora-2: #22d3ee;   /* cyan */
  --aurora-3: #f472b6;   /* pink */

  /* text */
  --text: #f5f5fa;
  --muted: #a1a1b5;

  /* status */
  --ok:   #34d399;
  --warn: #fbbf24;
  --bad:  #fb7185;

  /* shape */
  --radius: 20px;
  --radius-sm: 12px;
  --gap: 16px;

  /* accent */
  --accent: linear-gradient(135deg, var(--aurora-1), var(--aurora-2));
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: "Geist", "Inter", system-ui, sans-serif;
}

.glass {
  background: var(--glass);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  border-radius: var(--radius);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.glass-strong { background: var(--glass-strong); }   /* tables and forms */

.num { font-family: "Space Grotesk", "Manrope", sans-serif; font-variant-numeric: tabular-nums; }

/* The one neo-brutalist exception */
.btn-brutal {
  background: #fde047;
  color: #0b0b12;
  font-weight: 800;
  border: 3px solid #0b0b12;
  border-radius: 12px;
  box-shadow: 5px 5px 0 #0b0b12;
  transition: transform .12s ease, box-shadow .12s ease;
}
.btn-brutal:hover  { transform: translate(-2px, -2px); box-shadow: 7px 7px 0 #0b0b12; }
.btn-brutal:active { transform: translate(3px, 3px);  box-shadow: 2px 2px 0 #0b0b12; }
```

> Note: `#fde047` and `#0b0b12` on the brutalist button are the only hard-coded colors allowed; move them into tokens (`--brutal-fill`, `--brutal-ink`) if you prefer zero exceptions.

## 2. Aurora background

A fixed full-screen layer behind the app, three large blurred radial blobs (violet, cyan, pink) at 25–35 % opacity, drifting slowly with CSS keyframes or Motion (20–40 s loops). Add a faint noise texture (2–4 % opacity) to avoid banding. Pause or simplify the animation under `prefers-reduced-motion`.

Ready-made options: Aceternity "Aurora Background" or "Background Beams", React Bits aurora/gradient backgrounds. Adapt colors to the tokens above.

## 3. Layout

- **App shell:** collapsible left sidebar (glass), top bar with ⌘K search, user menu and role badge.
- **Content width:** max 1400px, 24px padding (16px on mobile).
- **Bento grid:** 12-column CSS grid, `gap: var(--gap)`. Mix spans: one hero card (span 6–8), KPI tiles (span 3), chart cards (span 6), list cards (span 4).
- **Portal:** simpler top-nav layout, lots of white space, plan cards.

## 4. Typography

| Use | Font | Weight / size |
|---|---|---|
| UI text | Geist or Inter | 400 / 500, 14–15 px |
| Headings | Geist or Inter | 600, 20–32 px |
| Big numbers (KPIs, totals) | Space Grotesk or Manrope | 600–700, 32–56 px, tabular numerals |
| Muted labels | Geist | 12–13 px, `--muted`, uppercase tracking optional |

## 5. Core components to build (`src/components/glass`)

| Component | Notes |
|---|---|
| `AuroraBackground` | Fixed, behind everything |
| `GlassCard` | `.glass`, optional `strong` prop, optional hover lift and border-beam |
| `BentoGrid` / `BentoItem` | Responsive spans |
| `KpiTile` | Label, number ticker, delta chip, sparkline |
| `StatusPill` | Subscription and invoice statuses; glow dot + label |
| `StatusStepper` | Draft → Quotation → Confirmed → Active → Closed with animated progress |
| `DataTable` | TanStack Table on `.glass-strong`, sticky header, skeleton rows, server pagination |
| `Money` | Formats minor units, tabular numerals |
| `EmptyState` | Small illustration or Lottie, message, primary action |
| `RunBillingButton` | `.btn-brutal`, progress bar and result summary dialog |
| `CommandPalette` | cmdk, glass overlay |
| `PasswordChecklist` | Live rule ticks for signup |

### Status colors

| Status | Color |
|---|---|
| Draft | muted gray |
| Quotation | amber |
| Confirmed | blue/cyan |
| Active / Paid | green |
| Overdue | red (pulsing dot) |
| Closed / Cancelled | dim gray |

## 6. Motion rules

| Where | Effect |
|---|---|
| Page change | fade + 8px slide, 200–250 ms |
| KPI numbers | count-up ticker, 800 ms ease-out, once on mount |
| Lists / table rows | staggered fade-in (30 ms stagger, max 10 rows) |
| Cards | hover lift 2px + brighter border |
| Status change | pill morphs color; stepper fills smoothly |
| Billing run | progress bar, then confetti-free summary dialog with count-up numbers |
| Toasts | `sonner`, bottom-right |

Keep durations under 300 ms for interactions, and never block input on an animation. Use `prefers-reduced-motion` to switch to opacity-only transitions.

## 7. Landing page (public `/`)

Hero with aurora background and a spotlight, headline ("Billing that runs itself."), short subline, two buttons (Get started, Demo as Admin), a glass mock of the dashboard, three feature bento cards, a pricing-table section with the seeded plans, and a footer. Keep it to one scroll screen and a half.

## 8. Accessibility and performance

- Body text contrast at least 4.5:1 against the card surface. Raise opacity if it fails.
- Visible focus rings on all interactive elements.
- Limit `backdrop-filter` to cards, not to full-page layers or very long tables (use `.glass-strong` with less blur there).
- Lazy-load heavy chart and animation components below the fold.
- Keyboard: everything reachable; ⌘K opens the palette.

## 9. Component sources

See `docs/10-RESOURCES.md`.
