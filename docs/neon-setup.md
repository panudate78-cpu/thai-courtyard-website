# Neon Setup Guide

Neon is a serverless PostgreSQL host with a generous free tier — the
recommended database for this platform. **Each restaurant gets its own Neon
project** (or its own database within a project), so client data is fully
isolated.

## Create a database

1. Sign up at <https://neon.tech> and create a **new project**
   (name it after the restaurant, e.g. `the-little-bistro`).
2. Choose the region closest to the restaurant's customers
   (e.g. *AWS eu-west-2 (London)* for UK restaurants).
3. Neon creates a database called `neondb` by default — that's fine.
4. On the project dashboard, copy the **pooled connection string**
   (it contains `-pooler` in the host name), e.g.

   ```
   postgres://user:password@ep-example-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
   ```

   The pooled endpoint is the right choice for Vercel/serverless.

## Use it

- **Locally:** put it in `.env.local` as `DATABASE_URL=...`
- **On Vercel:** either connect Neon via the Vercel integration
  (Storage → Neon → Connect — it injects `DATABASE_URL` automatically),
  or paste the string into the project's Environment Variables.

That's all. On first request the platform automatically:

- creates every table and index,
- seeds the demo restaurant profile + demo menu (only until setup completes),
- and is then ready for the Setup Wizard at `/setup`.

There are **no SQL files to run by hand** and no seed data from any other
restaurant — a fresh Neon database stays clean until the wizard/demo runs.

## Notes

- **Free tier limits** (as of 2026): 0.5 GB storage, autoscaled compute.
  More than enough for a single restaurant's orders/bookings for years.
  Neon free projects pause after inactivity; the first request after a pause
  takes ~1s longer while compute wakes.
- **Connection limits:** if you run many Vercel instances, set
  `DB_POOL_MAX=5` to cap connections per instance.
- **Backups:** Neon keeps point-in-time recovery history (24h on free,
  longer on paid). For client launches, consider the Launch plan for
  longer retention.
- **Branches:** Neon database branches are a safe way to test a menu import
  or upgrade before applying it to production — branch, point a preview
  deployment at it, verify, then discard.
