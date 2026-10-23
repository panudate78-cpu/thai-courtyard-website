# Architecture Guide

How the Restaurant Management Platform is put together, and where to extend it.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) + React 19 + TypeScript |
| Styling | Tailwind CSS 4 (CSS-first tokens, runtime brand theming) |
| Database | PostgreSQL (Neon recommended) via Drizzle ORM + `pg` |
| Validation | Zod schemas shared between API routes and forms |
| Email | Resend **or** SMTP (nodemailer), branded templates |
| Menu import | `unpdf` (PDF text), `xlsx` (Excel), built-in CSV parser |
| Icons | lucide-react (+ inline brand icons) |

## One codebase, many restaurants

This is a **single-tenant-per-deployment** white label: each restaurant gets
its own deployment + database. All identity/branding comes from data, never
from code:

```
restaurant_profile (id=1) ──┐
business_settings (hours) ──┼─► getRestaurantConfigSafe() ─► every page/email/report
site_settings (ordering) ───┘        (src/lib/restaurant.ts)
```

- `src/lib/site.ts` contains only **neutral platform defaults** (the Demo
  Restaurant) used before setup or if the DB is unreachable (pages degrade
  gracefully instead of erroring).
- Brand colours are applied at runtime as CSS variables over the Tailwind
  token set (`brandCss()` in the root layout), so no rebuild is needed to
  rebrand.
- Report/CSV filenames, email subjects, JSON-LD, sitemap and metadata are
  all generated from the same config object.

## Key modules

| Path | Responsibility |
|---|---|
| `src/lib/restaurant.ts` | Profile load/save, `RestaurantConfig`, theming, live opening-hours helpers |
| `src/lib/hours.ts` / `opening-hours.ts` | Europe/London slot maths for collection + bookings, holiday exceptions |
| `src/lib/orders.ts` | Order creation (atomic stock of truth: server-side pricing), listing, status |
| `src/lib/menu-import.ts` | PDF/CSV/XLSX → draft → publish pipeline + CSV template |
| `src/lib/demo.ts` | Demo dataset generation/reset/clear (everything demo is tagged: `is_demo`, `source='demo'`, `Demo ·` names) |
| `src/lib/payments.ts` | Payment option architecture (see Payments below) |
| `src/lib/business/*` | Analytics: live aggregates, sample fallback, margins, SEO pages/data |
| `src/db/bootstrap.ts` | Idempotent schema creation + demo menu seeding; menu insert/replace helpers |
| `src/db/schema.ts` | Drizzle schema (single source of truth for tables) |
| `src/app/(site)/*` | Public website (home, about, menu, order, book, contact) |
| `src/app/admin/*` | Admin panel (cookie-session auth, `ADMIN_PASSWORD`) |
| `src/app/setup` + `src/components/setup` | First-run wizard (locked after launch unless admin) |
| `src/app/api/*` | JSON APIs: public orders/bookings/contact; admin CRUD; setup; menu import; demo |

## Database bootstrap

There is no external migration step. `ensureDatabase()` (called lazily by
data loaders, memoised per process) runs idempotent DDL
(`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`) under an advisory
lock, then seeds the demo profile/menu **only while setup is incomplete**.
Consequences:

- A blank Neon database becomes a working system on first request.
- Upgrades are deploy-only; new columns appear automatically.
- Drizzle Kit (`drizzle.config.ts`) remains available for inspection/Studio.

Core tables: `restaurant_profile`, `business_settings`, `site_settings`,
`menu_categories`, `menu_items`, `menu_item_choices`, `orders`,
`order_items`, `bookings`, `customers`, `contact_messages`, `menu_imports`
(audit), plus counters for human-friendly order numbers.

## Ordering invariants (Europe/London)

- Collection slots: within opening hours, ≥ lead time from now, on the slot
  interval, not on closed dates/holidays; short grace after close.
- Bookings: 30-min steps from open to close−60min, ≤ 90 days ahead,
  party 1–30.
- Server always re-prices from the DB — client-sent prices are ignored.
- Rate limits on orders/bookings/contact/login; honeypot field on public
  forms; Zod validation everywhere.

## Payments (Stripe-ready, checkout intentionally not built)

- `orders.payment_method` / `payment_status` are stored on every order.
- Checkout offers **Pay on Collection** (live) and **Pay Online** (disabled,
  "Stripe — Coming Soon"); the API rejects `pay_online` with HTTP 422 until
  enabled.
- Business Settings stores the Stripe *publishable* key + test/live flag.
  The *secret* key must only ever be the `STRIPE_SECRET_KEY` env var.
- To activate later: add a Stripe Checkout session route that creates the
  order in `pending_payment`, a webhook to mark `paid`, and flip
  `pay_online_enabled`. No schema migration required.

## Demo mode

Until the wizard completes, the site runs as the Demo Restaurant with a
seeded menu and (on first reset) ~14–90 days of demo orders/bookings so every
dashboard has content. Analytics fall back to deterministic *sample* data
(clearly labelled) when there are no live orders — the same code paths serve
real data as soon as it exists.

## Security notes

- Admin = single shared password → signed, httpOnly session cookie
  (`rmp_admin_session`); login is rate-limited with a fixed delay.
  Multi-user roles are a roadmap item, not a config change.
- Setup writes are guarded: before launch anyone may complete setup (fresh
  deploys have no admin session yet); after launch only admins.
- Uploaded logos are resized client-side and stored as data URLs; menu
  imports are capped (8 MB) and parsed server-side into drafts — publishing
  always requires a deliberate admin action.

## Extending

- **New public page:** add under `src/app/(site)/`, take `config` from
  `getRestaurantConfigSafe()`, add to `NAV_LINKS`/sitemap if public.
- **New analytics:** aggregate in `src/lib/business/`, render under
  `src/app/admin/(panel)/`, reuse the widgets in
  `src/components/admin/business/widgets.tsx`.
- **New integration (POS, delivery):** orders/bookings already flow through
  `src/lib/orders.ts` / API routes — hook webhooks there.
- **Multi-tenancy:** deliberately out of scope; isolation per deployment
  keeps client handovers and billing simple.
