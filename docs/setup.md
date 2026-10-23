# Setup Guide — the First-Run Wizard

Every fresh deployment starts in **demo mode** (demo restaurant, menu, orders
and reports) so the platform can be explored safely. The Setup Wizard at
`/setup` turns it into a real restaurant's website. It is open to anyone
**only until setup is completed**; afterwards only a signed-in admin can open
it, and day-to-day edits happen in *Admin → Business settings*.

## Before you start — gather

- Restaurant logo (PNG/JPG/SVG/transparent square works best)
- Business name, address, phone, email, social links
- Opening hours
- The menu — a PDF, CSV or Excel file if you have one
- 2–4 good photos (hero, interior, a couple of dishes)

## The 9 steps

1. **Restaurant name** — name, tagline, cuisine. Used in the header, page
   titles, emails and Google structured data.
2. **Logo & colours** — upload the logo (stored with the profile) and pick
   primary/secondary brand colours from presets or the colour picker. The
   whole site re-themes instantly.
3. **Business details** — address, phone, email, socials, Google Place ID.
4. **Opening hours** — per-day open/close or closed. These drive the public
   hours display, collection slots and booking times.
5. **Collection settings** — enable/disable collection ordering, prep lead
   time, slot interval, how many days ahead guests can order, plus the
   collection instructions shown at checkout.
6. **Delivery settings** — optionally show a delivery button linking to the
   restaurant's delivery partner (Deliveroo/Uber Eats/Just Eat/own link),
   with fee/minimum/notes stored for display. Also covers the **Payments**
   choice: *Pay on Collection* (active) and *Pay Online — Stripe (Coming
   Soon)* where the Stripe publishable key can be stored ready.
7. **Menu categories** — create your category names (Starters, Mains, …).
8. **Import menu** — upload a **PDF, CSV or Excel** menu. Categories, dishes,
   descriptions and prices are detected automatically and shown as a
   **reviewable draft** — nothing is published yet. (CSV template:
   `/menu-template.csv` or Admin → Menu import → Download.)
9. **Launch** — review the summary and choose what happens to the menu
   (keep demo menu / start empty / use my categories / publish my import),
   then **Launch website**.

## After launch

- The wizard locks; the site now shows the restaurant's own branding.
- Remove leftover demo orders/bookings: **Admin → Settings → Remove Demo
  Data** (the menu choice from step 9 is preserved).
- Change the admin password if still on the demo default (set
  `ADMIN_PASSWORD` env var and redeploy).
- Fine-tune dishes in **Admin → Menu & prices**, hours and all business
  details in **Admin → Business settings**.

## Re-running the wizard

Signed-in admins can reopen `/setup` any time (Admin → Setup wizard). Saving
from the wizard writes through the same Business Settings profile, so it's a
safe way to do a full rebrand.

## Demo data

- **Admin → Settings → Reset Demo Data** restores the demo menu and
  regenerates demo customers, orders, bookings and reports (demo records are
  tagged, real records are never touched — but note Reset *does* replace the
  live menu with the demo menu).
- **Remove Demo Data** deletes everything demo-tagged and switches the
  dashboards to live-data-only.
