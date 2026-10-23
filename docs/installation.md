# Installation Guide

How to run the Restaurant Management Platform locally for development or evaluation.

## Prerequisites

- **Node.js 20+** (22 LTS recommended) and npm
- **A PostgreSQL database** — Neon (free) is the recommended host, but any
  Postgres 14+ works, including a local install.
- Git

## 1. Get the code

```bash
git clone https://github.com/panudate78-cpu/restaurant-management-platform.git
cd restaurant-management-platform
npm install
```

## 2. Create a database

Create a free Neon database (see [Neon Setup Guide](neon-setup.md)) or use a
local Postgres:

```bash
createdb restaurant_platform
```

The platform creates **all tables automatically** on first run — there is no
migration step to perform manually. Point it at a **brand-new empty database**
and it will bootstrap itself, including the demo restaurant dataset used
before setup is completed.

## 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and set at minimum:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string (required) |
| `ADMIN_PASSWORD` | Password for `/admin` (defaults to demo `admin123` if unset — change before going live!) |
| `NEXT_PUBLIC_SITE_URL` | Public URL, e.g. `http://localhost:3000` locally |

Optional variables (email, Google, Stripe-ready config) are documented inline
in `.env.example`.

## 4. Run

```bash
# Development (hot reload)
npm run dev

# Production build + start
npm run build
npm run start
```

Open <http://localhost:3000>.

## 5. First run

1. The site opens as the **Demo Restaurant** with demo menu/orders so you can
   explore immediately.
2. Go to <http://localhost:3000/setup> and complete the 9-step Setup Wizard
   (see [Setup Guide](setup.md)).
3. Sign in to the admin at `/admin/login` with `ADMIN_PASSWORD` (or `admin123`
   if you haven't set one yet) and finish configuring under
   **Business settings**.

## Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npx drizzle-kit studio` | Browse the database (uses `DATABASE_URL`) |

## Troubleshooting

- **`DATABASE_URL is required`** — create `.env.local` (step 3) or export the
  variable in your shell/hosting environment.
- **Setup page says the database can't be reached** — check the connection
  string, that the Neon project isn't paused, and that your IP is allowed
  (Neon allows all by default).
- **Site shows demo content after setup** — complete the wizard's final
  **Launch** step; until then the platform stays in demo mode on purpose.
