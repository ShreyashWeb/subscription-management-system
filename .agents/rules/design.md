# Design rules: Aurora Glass + Bento

Full detail is in `docs/05-DESIGN-SYSTEM.md`.

- Dark theme first. Animated aurora gradient background (violet, cyan, pink) behind everything, fixed position, low opacity blobs, blurred.
- Cards use the `.glass` class: translucent fill, 1px light border, backdrop blur, soft shadow, inner top highlight.
- **Data-dense surfaces (tables, forms) use `.glass-strong`** (more opaque) so text stays readable.
- Dashboard uses a **bento grid**: mixed card sizes, consistent gaps, one hero card.
- Use only CSS variables from `globals.css` for color. No hard-coded hex values in components.
- One accent gradient (violet to cyan). Status colors: green (paid / active), amber (pending / due soon), red (overdue / failed).
- Fonts: Geist or Inter for UI, Space Grotesk or Manrope for large numbers. Always `font-variant-numeric: tabular-nums` on money.
- Motion: subtle and purposeful. Number tickers for KPIs, fade-slide on page transitions, layout animations for lists. Respect `prefers-reduced-motion`.
- The "Run Billing Now" button is the one neo-brutalist exception: thick border, hard offset shadow, bold type.
- Check contrast: body text on glass must stay readable. If in doubt, increase the card opacity.
- Mobile: layouts collapse to a single column. Tables become horizontally scrollable or card lists.
