# Thai Courtyard White-Label — Replication Guide (clone → live in <1 hour)

This template is a cloneable **Next.js 16 + Neon Postgres + Drizzle + Vercel + Vercel Blob** restaurant site with:
- Customer pages + 11 area SEO pages (now DB-driven `areaServed`)
- Menu with protein/spice choice groups + 14 UK FSA allergens (definite allergens auto-filled)
- Collection ordering with slot rules (Tue–Sat 12–21 default, 15/20 min configurable)
- Bookings, Contact, Review funnel, Newsletter, Admin + Reports + SEO overrides
- **100% same functionality as Thai Courtyard live** — kept intact because Thai Courtyard is the seed row (id=1) guarded by `setup_completed`.

---

## 1. Clone & install (2 min)

```bash
git clone https://github.com/panudate78-cpu/thai-courtyard-website.git my-restaurant
cd my-restaurant
npm install
cp .env.example .env.local
# Fill .env.local (see below) — at minimum DATABASE_URL and NEXT_PUBLIC_SITE_URL
```

Requires Node 20+ (see Vercel Node 20 runtime).

---

## 2. Create Neon Postgres (5 min)

1. Go to **neon.tech** → New Project → pick region closest to diners (e.g. `eu-west-2` for UK).
2. Copy the **connection string** (`postgres://…?sslmode=require`) → paste as `DATABASE_URL` in `.env.local` and in Vercel env (step 4).
3. No manual SQL needed — the app auto-migrates on first request (`ensureDatabase()` + `ensureRestaurantConfig()`). For a fresh push from the laptop:

```bash
npm run db:push        # uses drizzle-kit push via drizzle.config.ts
npm run db:seed:reset  # optional — wipes and re-seeds Thai Courtyard sample menu (or your CSV)
```

---

## 3. Create Vercel Blob store (3 min)

1. Vercel Dashboard → **Storage** → **Create Blob Store** → pick same region.
2. Copy **BLOB_READ_WRITE_TOKEN** → add to `.env.local` + Vercel env.
3. Without this, Step 5 of `/setup` (logo/hero/gallery/OG uploads) will show:

> `BLOB_READ_WRITE_TOKEN is not set — create a Vercel Blob store…`

Uploads are blocked until the token is set — no silent failures.

---

## 4. Deploy to Vercel & set envs (5 min)

```bash
npm i -g vercel   # if needed
vercel            # link to a new Vercel project
# Or: import the GitHub repo in Vercel Dashboard → New Project
```

In **Vercel → Project → Settings → Environment Variables**, add every key from `.env.example` (at least: `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_PASSWORD`, `SETUP_TOKEN`, `BLOB_READ_WRITE_TOKEN`). Redeploy after changing envs.

Set the **canonical domain**:

- Vercel → Settings → Domains → add `www.example.co.uk` (and apex redirect). Point DNS at Vercel (A/CNAME per Vercel instructions). Once DNS is green, set `NEXT_PUBLIC_SITE_URL=https://www.example.co.uk` (no trailing slash).

---

## 5. Run the /setup wizard (15–30 min)

Open `https://www.example.co.uk/setup?token=YOUR_SETUP_TOKEN` (token required if `SETUP_TOKEN` is set; if `setup_completed=true`, `/setup` is locked and shows how to re-open).

**6 steps:**

1. **Business & Branding** — name, address, phone, email, site URL, Deliveroo, Google Place/Review URLs, colours, fonts. Replaces every hardcoded Thai Courtyard string.
2. **Hours & Ordering Rules + Payments** — per-day open/close, slot interval (15), lead time (20), max days ahead (7), payment notice & announcement banner, **and payment mode**: `pay_on_collection` (default, no Stripe — zero Stripe SDK calls), `stripe_online` (all collection orders pay online via Stripe Checkout), or `customer_choice` (guest picks at checkout). If Stripe is chosen, diagnostics in Step 6 validates `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_WEBHOOK_SECRET`; leaving it on pay_on_collection keeps Stripe completely optional.
3. **Local SEO** — town + `areaServed` list (used for footer, `LocalBusiness` JSON-LD, sitemap). Edit from the Thai default 11 areas.
4. **Menu & Allergens** — upload **CSV** or **JSON** (`/sample-menu.csv` + `/sample-menu.json` are downloadable). Definite 14 FSA allergens are auto-filled and editable in **Admin → Menu** afterwards (no numbers like F5/P11, no scary cross-contamination language).
5. **Pictures** — upload logo/hero/gallery/OG via **Vercel Blob** (`@vercel/blob` `put` to `setup/…`). Falls back clearly if `BLOB_READ_WRITE_TOKEN` is missing.
6. **Check & Go Live** — diagnostics panel checks `DATABASE_URL`, migrations/tables, `BLOB_READ_WRITE_TOKEN`, `SMTP_*`/`RESEND_API_KEY`, `NEXT_PUBLIC_SITE_URL`, **Stripe keys + payment_mode + webhook** (`/api/webhooks/stripe` — events: `checkout.session.completed`); send test email; **set admin password** (bcrypt-hashed into `restaurant_config.admin_password_hash` — `ADMIN_PASSWORD` env remains fallback); tick confirm and **Complete Setup & Launch** (sets `setup_completed=true` and locks `/setup`).

**Re-opening setup:** Admin → Restaurant → Setup Wizard → “Re-open Setup Wizard (unlock)” (needs admin session or `SETUP_TOKEN`), or `POST /api/setup/reopen`.

---

## 6. Scripts

```bash
npm run dev              # next dev
npm run build            # next build (exits non-zero on type errors)
npm run typecheck        # tsc --noEmit
npm run db:push          # drizzle-kit push
npm run db:seed:reset    # node scripts/seed-reset.mjs  (wipes categories/items and re-seeds)
npm run client:init      # node scripts/provision-client.mjs  (creates .env.local stub + checks envs + prints /setup link)
```

---

## 7. What is DB-driven after white-label

| Area | DB table / column | Used by | Fallback |
|------|------------------|---------|----------|
| Identity, address, phone, email, geo, links | `restaurant_config` | Header/Footer, pages, emails, JSON-LD, sitemap/robots/OG/manifest | `src/lib/site.ts` Thai Courtyard |
| Hours & slot rules | `restaurant_config.opening_hours`, `slot_*`, `closed_dates` | `lib/hours.ts` collection/booking slots | `OPENING_HOURS` Tue–Sat 12–21 |
| Payments | `restaurant_config.payment_mode` (`pay_on_collection` default, `stripe_online`, `customer_choice`) + `orders.payment_method/payment_status/stripe_session_id/paid_at` | `/order` checkout, Stripe webhook, admin order cards, emails | `pay_on_collection` — zero Stripe calls |
| Theme | `theme_*`, `font_preset`, `logo/hero/gallery/og_image` | layout, hero, OG image | sand/charcoal, `/images/hero-spread.jpg` |
| Copy | `hero_*`, `about_*` | Home/About | Thai defaults |
| SEO areas | `area_served` | Footer, LocalBusiness schema, sitemap extras | 11 Surrey towns |
| Admin password | `admin_password_hash` | `/api/admin/login` (bcrypt + env fallback) | `ADMIN_PASSWORD` env or `Th@1courtyard!` preview fallback |
| Menu | `menu_*`, `option_*` | `/menu`, `/order`, Admin → Menu | seed-data Thai menu |

`SITE` and `OPENING_HOURS` in `src/lib/site.ts` **remain as safe defaults** — Thai Courtyard production keeps working even before any `restaurant_config` row exists.

---

## 8. Thai Courtyard live stays intact

- `restaurant_config.id=1` is seeded with Thai Courtyard values on first boot (`ensureRestaurantConfig()`).
- Until a new client runs `/setup` and sets `setup_completed=true`, the live site behaves exactly as before.
- `HARDCODED_AUDIT.md` lists every former hardcoded reference and what now reads from `restaurant_config`.

---

## 9. Stripe (optional online payments)

- Default `payment_mode = pay_on_collection` — no Stripe env needed and `npm run build` passes with no Stripe keys. The `/api/orders` pay-on-collection path makes zero Stripe SDK calls.
- To accept online payments: set `payment_mode` to `stripe_online` (all orders) or `customer_choice` (guest picks) in `/setup` Step 2 or Admin → Restaurant → Collection payments. Then add in Vercel + `.env.local`:
  ```
  STRIPE_SECRET_KEY=sk_test_… (or sk_live_…)
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_… (or pk_live_…)
  STRIPE_WEBHOOK_SECRET=whsec_…   # from Stripe Dashboard → Developers → Webhooks → Add endpoint → https://www.example.co.uk/api/webhooks/stripe (event: checkout.session.completed)
  ```
- Flow: guest chooses Pay online → server creates **Stripe Checkout Session** from Postgres prices (never trusting client totals), stores `payment_status=unpaid` + `stripe_session_id` on `orders`; kitchen is **not** emailed. On verified `checkout.session.completed` webhook the order is marked `paid`, `paid_at` set, and restaurant + customer emails are sent. Abandoned checkouts stay unpaid and don’t spam the kitchen.
- Admin order cards show **payment method** (Pay on collection / Paid online) + **payment status** (Paid/Unpaid) + Stripe session snippet; emails show `Paid online (Stripe)` vs `Pay on collection`. `/api/setup/diagnostics` and `/api/admin/restaurant-config` validate Stripe keys before saving a Stripe mode.

## 10. Checklist before handing to a client

- [ ] `DATABASE_URL` and `BLOB_READ_WRITE_TOKEN` in Vercel env + locally
- [ ] Domain + `NEXT_PUBLIC_SITE_URL` correct (https, no trailing slash)
- [ ] `/setup?token=…` → all 6 steps completed, test email received, diagnostics green (Stripe shows “not configured” if staying on pay_on_collection — that’s expected)
- [ ] If Stripe enabled: webhook at `/api/webhooks/stripe` added in Stripe Dashboard and `STRIPE_WEBHOOK_SECRET` set; test checkout → webhook marks paid and emails arrive; abandoned checkout does not email kitchen
- [ ] Menu reviewed in Admin → Menu (allergens editable)
- [ ] Logo/hero images show (Blob URLs, not `/images/*` placeholders)
- [ ] `npm run build` passes locally (also passes with no `STRIPE_*` set)
