# Hardcoded Thai Courtyard Audit & White-Label Plan

**Branch:** `arena/8e6b0a43-thai-courtyard-website` → `eabc3f6` main
**Date:** 2026-11-21

## 1) Every hardcoded Thai Courtyard reference found

### Core identity & SEO (`src/lib/site.ts` — single source of truth, ~80% of duplication)
- `SITE.name` = "Thai Courtyard"
- `SITE.fullName` = "Thai Courtyard East Molesey"
- `SITE.tagline` = "Authentic Thai Cuisine in the Heart of East Molesey"
- `SITE.description` / `shortDescription` — long SEO copy including Walton Road, KT8, Hampton Court
- `SITE.url` = `https://www.thaicourtyardmolesey.co.uk` (fallback for `NEXT_PUBLIC_SITE_URL`)
- `SITE.phoneDisplay` = "020 8941 3595" / `phoneHref` `tel:+442089413595` / `phoneIntl` "+44 20 8941 3595"
- `SITE.email` = `info@thaicourtyardmolesey.co.uk` (`NEXT_PUBLIC_CONTACT_EMAIL` fallback)
- `SITE.address` = { street "105 Walton Road", locality "East Molesey", region "Surrey", postcode "KT8 0DR", country "GB" } + `addressLine`, `geo.lat` 51.4006 / `lng` -0.3557
- `SITE.areaServed[11]` = East Molesey, West Molesey, Hampton Court, Thames Ditton, Hampton, Teddington, Esher, Walton-on-Thames, Hersham, Surbiton, Kingston upon Thames
- `SITE.deliverooUrl` = deliveroo.co.uk/menu/london/east-molesey...
- `SITE.googleMapsUrl` / `googleDirectionsUrl` / `googleReviewUrl` / `googleMapsEmbedUrl` (built from `mapsQuery` "Thai Courtyard, 105 Walton Road..." + `NEXT_PUBLIC_GOOGLE_PLACE_ID`)
- `SITE.paymentNotice`, `hoursSummary` "Tuesday – Saturday, 12:00 – 21:00", `hoursShort`, `priceRange` "££", `currenciesAccepted`, `paymentAccepted`, `servesCuisine` ["Thai","Asian"], `foundingLocation`
- `OPENING_HOURS` Record<number, {open,close}|null> Tue-Sat 12:00-21:00, Sun/Mon null; `DAY_NAMES`
- `SITE.newManagement` (currently empty)

### Pages & copy that hardcode Walton Road / KT8 / Hampton Court / BYOB
- `src/app/layout.tsx` — metadataBase, title template "%s | Thai Courtyard East Molesey", 16 keywords ("Thai restaurant East Molesey" etc.), `openGraph.siteName`, `twitter.creator`
- `src/lib/seo.ts` — `restaurantJsonLd()` (name, alternateName, slogan, servesCuisine, priceRange, address, geo, areaServed, sameAs, amenityFeature BYOB/family-friendly, knowsAbout, potentialAction OrderAction/ReserveAction), `websiteJsonLd`, `organizationJsonLd`, `menuJsonLd` (name "Thai Courtyard Menu"), `breadcrumbJsonLd`, `faqJsonLd`
- `src/app/(site)/page.tsx` — hero `tagline`, addressLine, hoursSummary, phoneDisplay, FAQs ("thaicourtyardmolesey.co.uk/book or call 020 8941 3595")
- `src/app/(site)/about/page.tsx` — title "About Us — Our Story in East Molesey, Near Hampton Court", intro "cosy Thai restaurant on Walton Road... minutes from Hampton Court Palace", story 2 paragraphs + SEO "Thai restaurant East Molesey / Thai takeaway Hampton Court / Thai food near me KT8"
- `src/app/(site)/menu/page.tsx` — metadata description "The Thai Courtyard menu — starters... in East Molesey, Surrey KT8", OG title "Thai Courtyard Menu | East Molesey • Hampton Court", Express Lunch "East Molesey", photo bands, FAQs (BYOB, KT8), footer "Serving East Molesey, Hampton Court..."
- `src/app/(site)/book/page.tsx` — title "Book a Table — Thai Restaurant East Molesey, KT8", description "Book a table at Thai Courtyard...", FAQs referencing 020 8941 3595
- `src/app/(site)/contact/page.tsx` — title "Contact & Opening Hours — Thai Courtyard East Molesey, KT8 0DR", all address/phone blocks, Google Map embed title, "Near Hampton Court Palace • Surrey KT8", `SITE.googleMapsEmbedUrl`
- `src/app/(site)/order/page.tsx` — title "Order Thai Takeaway for Collection — East Molesey KT8 | Thai Courtyard", collection copy "105 Walton Road, KT8 0DR • Tue–Sat 12–21", `SITE.addressLine` in serving list
- `src/app/(site)/order/confirmation/[id]/page.tsx` — "Your collection order has been sent to Thai Courtyard", addressLine, googleDirectionsUrl, share text "Thai Courtyard — authentic Thai in East Molesey", phoneDisplay
- `src/app/(site)/review/page.tsx` — googleReviewUrl, share wa.me text
- `src/app/(site)/page.tsx` / `about/page.tsx` / `book/page.tsx` / `contact/page.tsx` — `IMG.heroSpread`, `IMG.thaiSpread` etc. (photo-manifest)
- `src/lib/image-manifest.ts` — all 22 images hardcode `/images/hero-spread.jpg` etc. with blurDataURL; `IMG.logo.src` used for JSON-LD logo
- `src/lib/seo-resolve.ts` — `getResolvedSeo(path)` merges `seo_overrides` table on top of hardcoded SEO
- `src/app/sitemap.ts` — hardcodes 6 routes + `SITE.url` as base + images from `IMG.*`
- `src/app/robots.ts` — hardcodes `SITE.url` + sitemap host, disallow GPTBot/CCBot
- `src/app/opengraph-image.tsx` / `twitter-image.tsx` / `manifest.ts` / `icon.png` — generate OG 1200×630 with Thai Courtyard branding
- `src/app/globals.css` — colour palette: charcoal, teak, gold, cream, jade, chili (Thai branding), fonts (serif/sans)
- `src/lib/hours.ts` / `src/lib/opening-hours.ts` / `src/lib/refresh-schedule.ts` — imports `OPENING_HOURS` from `site.ts`; slot interval 15min, lead 20min, maxDaysAhead 7, TIME_ZONE Europe/London
- `src/lib/auth.ts` — admin password checks `ADMIN_PASSWORD` env var only (no DB hash)
- `src/lib/email.ts` — SMTP templates hardcode Thai Courtyard name, `RESTAURANT_EMAIL`, `EMAIL_FROM`, order/booking/contact subjects
- `src/components/site/Footer.tsx` / `Header.tsx` — uses `SITE.*`, `NAV_LINKS`, hoursSummary, social links
- `src/db/seed-data.ts` — Thai menu categories/items entirely Thai (Starters Soups Curries etc.), no allergens before our patches
- `.env` / Vercel envs — `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL` = thaicourtyardmolesey.co.uk, `NEXT_PUBLIC_GOOGLE_PLACE_ID`, `NEXT_PUBLIC_CONTACT_EMAIL`, `ADMIN_PASSWORD`, `SMTP_HOST/PORT/USER/PASS`, `EMAIL_FROM`, `RESTAURANT_EMAIL`, `GOOGLE_REVIEW_URL`, `BLOB_READ_WRITE_TOKEN` (for template)
- `next.config.ts` — image domains, HSTS
- `package.json` — name `nextjs-postgresql-template` (already generic)

## 2) Schema & wizard plan (confirmed)

### `restaurant_config` (Drizzle `pgTable` `restaurant_config`, single row id=1)
```
id integer PK=1
setup_completed boolean default false
setup_token_hash text (optional, not storing plain)
restaurant_name text default 'Thai Courtyard'
full_name text default 'Thai Courtyard East Molesey'
tagline text default 'Authentic Thai Cuisine in the Heart of East Molesey'
description text
short_description text
address_street text default '105 Walton Road'
address_locality text default 'East Molesey'
address_region text default 'Surrey'
address_postcode text default 'KT8 0DR'
address_country text default 'GB'
address_line text generated fallback
geo_lat numeric default 51.4006
geo_lng numeric default -0.3557
phone_display text default '020 8941 3595'
phone_href text default 'tel:+442089413595'
phone_intl text default '+44 20 8941 3595'
email text default 'info@thaicourtyardmolesey.co.uk'
order_email text
deliveroo_url text
google_place_id text
google_review_url text
google_maps_url text (computed or stored)
opening_hours jsonb default {0:null,1:null,2:{open:"12:00",close:"21:00"}...}
area_served text[] default 11 Thai Courtyard areas
price_range text default '££'
serves_cuisine text[] default '{Thai,Asian}'
currencies_accepted text default 'GBP'
payment_accepted text default 'Cash, Credit Card, Debit Card'
founding_location text default 'East Molesey, Surrey'
hero_title text default 'Thai Courtyard Menu' etc.
hero_intro text
about_title / about_intro / about_story text
theme_primary text default '#1a2a3a' (charcoal)
theme_accent text default '#c8a96a' (gold)
font_preset text default 'serif-sans'
logo_url text default '/images/logo.png'
hero_image_url text default '/images/hero-spread.jpg'
gallery_urls text[] default photo bands
og_image_url text default '/opengraph-image'
slot_interval_minutes integer default 15
lead_time_minutes integer default 20
max_days_ahead integer default 7
closed_dates text[] default '{}'
announcement text
payment_notice text
admin_password_hash text (bcrypt)
smtp_host/port/user/pass/email_from/restaurant_email text (optional mirror of env, for diagnostics only, never logs secret)
site_url text default 'https://www.thaicourtyardmolesey.co.uk'
updated_at timestamp
```

**Migration safety:** on first boot, if `restaurant_config` empty, seed it with Thai Courtyard `SITE` values (so live production keeps 100% same behaviour; `setup_completed=false` by default but we will set `true` for existing Thai Courtyard via migration guard or env).

**Dynamic reading:** new `src/lib/restaurant.ts` exports `getRestaurantConfig(): Promise<RestaurantConfig>` — cached per-request via `cache()` + global memo, merges DB row over `SITE` fallback (so every import of `SITE` still works during transition, but pages/metadata/JSON-LD/sitemap/robots/OG/email will call `getRestaurantConfig()`). Existing `SITE` stays as fallback constant for build without DB.

**Admin password:** `src/lib/auth.ts` will first check `restaurant_config.admin_password_hash` (bcrypt compare) if present, else fallback to `ADMIN_PASSWORD` env var (so Thai Courtyard prod with env continues to work, new clients can set via wizard).

### Guided `/setup` wizard (protect with `SETUP_TOKEN` env var)
- Route `src/app/setup/page.tsx` (server component checks DB `setup_completed` and `SETUP_TOKEN` query or header; if `setup_completed=true` and user not admin, redirect to `/`; if `SETUP_TOKEN` set, require `?token=...` or `x-setup-token` header matching env).
- Client wizard `src/components/setup/SetupWizard.tsx` 6 steps, progress bar, save per step via `POST /api/setup` (zod validation, upsert restaurant_config, handles `@vercel/blob` uploads).
  - **Step 1 Business Details & Branding:** name, fullName, tagline, about/story (hero/about copy), address (street/locality/region/postcode/country), phoneDisplay/phoneIntl/email/orderEmail, deliverooUrl, googlePlaceId/reviewUrl, maps link, primary/accent colour pickers, font preset (serif-sans / sans / display), logoUrl preview.
  - **Step 2 Opening Hours & Ordering Rules:** weekday 0–6 open/close/closed toggles (default Tue-Sat 12-21), slotInterval 5-60, leadTime 10-60, maxDaysAhead 1-14, closedDates multi-date, announcement, paymentNotice.
  - **Step 3 Local SEO & Area Pages:** main town (locality) + dynamic list of surrounding areas/villages (chips input, add/remove), auto-generates LocalBusiness `areaServed` and page titles/descriptions (no hardcoded 11). Shows live JSON-LD preview.
  - **Step 4 Menu Upload & Allergen Auto-Fill:** file input CSV/JSON + downloadable `sample-menu.csv` + paste-friendly bulk JSON textarea + editable table; parser normalises categories/items/groups/choices, calls existing `allergen-seed` logic to auto-fill 14 UK FSA definite allergens (editable checkboxes before save), then `POST /api/setup/menu` replaces menu via transaction (preserves Thai seed if skipped).
  - **Step 5 Picture Uploads (Vercel Blob):** 5 uploaders (logo, hero, OG, gallery 3-6, dish images) using `put()` from `@vercel/blob` client via `/api/blob/upload` (server checks `BLOB_READ_WRITE_TOKEN`, returns friendly error if missing, stores returned URL in config). Preview + URL display.
  - **Step 6 Vercel, Database & Email Check + Go Live:** diagnostics panel fetching `/api/setup/diagnostics` (checks DATABASE_URL connected, drizzle tables exist, BLOB token present, SMTP_* + EMAIL_FROM + RESTAURANT_EMAIL env, NEXT_PUBLIC_SITE_URL vs host, blob upload test, send test email button to `POST /api/setup/test-email`), set admin password (hash with bcrypt, min 8 chars), checkbox "I confirm details are correct", button "Complete Setup & Launch" → sets `setup_completed=true`, locks `/setup`.

**Locking:** middleware or page check: if `setup_completed=true` then `/setup` returns 404 or redirects unless `?token=SETUP_TOKEN` or admin session. Admin can re-open via `/admin` → Settings → "Re-open Setup Wizard" button that sets `setup_completed=false` (admin only).

### Vercel & Provisioning
- `.env.example` — documents every var: `DATABASE_URL` (Neon, required), `NEXT_PUBLIC_SITE_URL` (canonical, required), `ADMIN_PASSWORD` (fallback), `SETUP_TOKEN` (protect /setup), `BLOB_READ_WRITE_TOKEN` (Vercel Blob, required for uploads), `SMTP_HOST/PORT/USER/PASS` + `EMAIL_FROM` + `RESTAURANT_EMAIL`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_GOOGLE_PLACE_ID`, `NEXT_PUBLIC_GOOGLE_REVIEW_URL` (optional).
- `scripts/provision-client.mjs` — Node 18+ helper: prompts for client slug, clones, creates GitHub repo via `gh`, creates Neon project via `neonctl` or manual, runs `drizzle-kit push` / `npm run db:push`, creates Vercel project (`vercel --yes`), enables Blob (`vercel blob`), sets env vars (`vercel env add`), adds domain (`vercel domains add`), prints DNS records. Plus `npm run client:init` wrapper.
- `scripts/reset-db.mjs` + `npm run db:seed:reset` — truncates menu/orders/bookings, re-seeds Thai Courtyard `SEED_MENU` + `restaurant_config` default.
- `REPLICATION.md` — step-by-step Clone → Neon → Vercel → env → domain/DNS → /setup → Go Live in <60 min, with screenshots checklist and troubleshooting (migrations, blob token, SMTP test, setup lock).

**TypeScript & build:** all new code strict, `zod` validation, `bcryptjs` for hash, `@vercel/blob` for uploads, no `any`, `npm run build` green with dummy DATABASE_URL.
