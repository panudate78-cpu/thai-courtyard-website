# Restaurant Management Platform

A white-label restaurant website + operating system: public website, online
collection ordering, table bookings, and a full admin with sales/food/
customer/booking analytics — deployable per restaurant in under an hour.

A new restaurant launches with only: **logo, business details, opening hours,
menu, photos, a Neon database and a domain name.**

## What's inside

**Public website** — Homepage, About, Menu, online Collection Ordering,
Table Bookings, Contact, local-SEO (metadata, JSON-LD, sitemap, OG images).

**Admin** (`/admin`) — Dashboard, Orders board, Bookings, Customers,
Messages, Menu & prices, **Menu Import (PDF/CSV/Excel)**, Business Settings,
Settings, and the first-run **Setup Wizard** (`/setup`).

**Analytics** — Sales dashboard, Food performance & margins, Customer
analytics, Booking analytics, Marketing, SEO dashboard, downloadable
Reports (CSV/PDF).

**Payments** — *Pay on Collection* works today. *Pay Online (Stripe)* is
architected and config-ready (keys stored in Business Settings, payment
fields on every order) with checkout intentionally marked **Coming Soon**.

**Demo mode** — ships as a fully explorable "Demo Restaurant" with demo
menu/customers/orders/bookings/reports, plus **Reset Demo Data** /
**Remove Demo Data** controls in admin settings.

## Quick start

```bash
npm install
cp .env.example .env.local   # set DATABASE_URL (Neon), ADMIN_PASSWORD
npm run dev                  # http://localhost:3000
```

Then open `/setup` and run the 9-step wizard. The database schema is
created automatically on first request — point `DATABASE_URL` at a brand-new
empty Neon database and deploy.

## Documentation

| Guide | Contents |
|---|---|
| [docs/installation.md](docs/installation.md) | Local install & first run |
| [docs/setup.md](docs/setup.md) | The 9-step Setup Wizard & demo data |
| [docs/onboarding.md](docs/onboarding.md) | Repeatable client launch process |
| [docs/admin-guide.md](docs/admin-guide.md) | Day-to-day admin handbook (client-facing) |
| [docs/deployment.md](docs/deployment.md) | Production deployment checklist |
| [docs/vercel-deployment.md](docs/vercel-deployment.md) | Vercel step-by-step |
| [docs/neon-setup.md](docs/neon-setup.md) | Neon database setup |
| [docs/domain-setup.md](docs/domain-setup.md) | Custom domain, DNS, Google |
| [docs/architecture.md](docs/architecture.md) | How it works & how to extend |

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Drizzle ORM ·
PostgreSQL (Neon) · Zod · Resend/SMTP email.

## Commands

```bash
npm run dev        # development server
npm run build      # production build
npm run start      # run production build
npm run lint       # ESLint
npm run typecheck  # TypeScript
```

## Defaults to change before going live

- `ADMIN_PASSWORD` — the demo fallback is `admin123` (admin shows a warning
  until you set a real one).
- `NEXT_PUBLIC_SITE_URL` — must be the final https domain for correct SEO.
- Remove demo data (Admin → Settings) once setup is complete.
