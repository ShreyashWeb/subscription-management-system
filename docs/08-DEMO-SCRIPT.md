# 08: Demo video script (about 3 minutes)

The video is judged alongside the code. Show the problem, then show the system solving it. Aim for 2:45 to 3:15. Record at 1080p, browser zoom 100 to 110 percent, one smooth take per section.

## Before recording

- Deployed app is live and seeded; demo logins work.
- Dashboard shows healthy numbers (about 2,000 subscriptions).
- Create one subscription that is **three periods behind** so the billing run visibly produces three invoices. Name it something recognizable (for example "Acme Retail").
- Have one active discount with usage 1/2 so you can show it applying and then running out.
- Close other tabs and turn off notifications.
- Rehearse once; the billing run is the climax, so know its click path.

## Script

| Time | Screen | What you say / do |
|---|---|---|
| **0:00 to 0:15** | Landing page, aurora animating | "Brightloop sells everything on subscription, but renewals were missed, invoices typed by hand and nobody knew their recurring revenue. This is the system that fixes it." |
| **0:15 to 0:35** | Click **Demo as Admin**; dashboard loads, numbers tick up | "The finance lead gets one place: active subscriptions, revenue, outstanding, overdue, MRR." Point at the loaded-in-ms badge: "Every page responds in well under two seconds with two thousand subscriptions." |
| **0:35 to 1:00** | Products → open a product with the Odoo variant; Plans page | "Admin sets up products with variants. Choosing the Odoo brand adds 560 to the price. Plans define the billing period, minimum quantity, availability, and whether a plan can pause, close early or renew." |
| **1:00 to 1:25** | Templates → create subscription from template; stepper | "Sales starts from a quotation template, not from scratch. The subscription gets its own number and moves from Draft to Quotation to Confirmed to Active. Anyone on the team can see where it stands." |
| **1:25 to 2:00** | **Billing Run** page; set "as of" date forward; click **Run Billing Now**; summary | "Billing day. Nobody types invoices. One click. Acme was three periods behind and got three invoices, taxes calculated automatically." Click Run again: "Run it twice and nothing is billed twice." |
| **2:00 to 2:20** | Open the new invoice; show discount line and tax; Confirm; download PDF | "The admin's discount rule applied itself on this invoice, and it will stop when it runs out. The team can confirm, send or print." |
| **2:20 to 2:40** | Record a partial payment, then the rest | "Payments are recorded with method, amount, date and note. Outstanding updates instantly, and the invoice flips to Paid when the balance hits zero." Show the overdue list: "Overdue invoices to chase, before they become lost revenue." |
| **2:40 to 3:00** | Reports: MRR movement chart, revenue at risk | "MRR, churn and revenue at risk, live." |
| **3:00 to 3:15** | Log in as Customer (Demo as Customer); try other customer's URL → 404 (optional); proration preview | "Customers see only their own subscriptions and invoices, and can manage them without emailing anyone, with a proration preview on plan changes." Close with the tagline. |

## Delivery tips

- Narrate outcomes, not clicks ("the invoice flips to Paid") rather than "now I click here".
- Keep the cursor slow and deliberate; zoom into numbers that matter.
- If something takes more than two seconds to load on camera, cut or re-record; it contradicts your own performance claim.
- End on the dashboard or landing page with the repo and live link on screen.
- Upload as unlisted (or whatever the portal accepts) and test the link in a private window before the leader submits it.

## Slide-free alternative

If you want a 20-second intro card, show: project name, one-line value proposition, team name, tech stack icons. Nothing more.
