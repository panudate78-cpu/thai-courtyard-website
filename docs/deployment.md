# Deployment Guide

The platform is a standard Next.js app. The recommended production stack is
**Vercel (hosting) + Neon (database)**, which is what the guides assume, but
any Node 20+ host with Postgres works.

- Full Vercel walkthrough: [Vercel Deployment Guide](vercel-deployment.md)
- Database: [Neon Setup Guide](neon-setup.md)
- Custom domain: [Domain Setup Guide](domain-setup.md)

## Deployment checklist (per restaurant)

1. **Fork/clone** this repository into a new repo for the client
   (or reuse one repo with separate Vercel projects per client).
2. **Create the Neon database** and copy the pooled `DATABASE_URL`.
3. **Create the Vercel project**, import the repo (framework preset: Next.js;
   no build settings need changing).
4. **Set environment variables** in Vercel (Production):
   - `DATABASE_URL` (Neon pooled string)
   - `ADMIN_PASSWORD` (strong, unique per restaurant)
   - `NEXT_PUBLIC_SITE_URL` (final https domain, no trailing slash)
   - Email provider keys if sending notifications (`RESEND_API_KEY` or SMTP)
   - Optional: `DB_POOL_MAX=5`
5. **Deploy.** First request auto-creates the schema and demo dataset.
6. **Run the Setup Wizard** at `https://<domain>/setup` with the client's
   logo, details, hours and menu (see [Setup Guide](setup.md)).
7. **Remove demo data**: Admin → Settings → *Remove Demo Data*.
8. **Verify**: place a test order + booking, confirm both appear in the
   admin, check notification emails, fetch `/sitemap.xml` and `/robots.txt`.
9. **Attach the custom domain** and submit the sitemap in Google Search
   Console.

## Environment variables reference

See `.env.example` for the full annotated list. Production-critical ones:

| Variable | Why |
|---|---|
| `DATABASE_URL` | App will not start without it |
| `ADMIN_PASSWORD` | Without it the admin uses the public demo password `admin123` (a warning banner shows in admin) |
| `NEXT_PUBLIC_SITE_URL` | Canonical/OG/sitemap URLs; wrong value hurts SEO |
| `RESEND_API_KEY` or `SMTP_*` | Without one, no email notifications (app still works) |

## Other hosts

- **Any Node host** (Railway, Render, Fly.io, a VPS): `npm run build &&
  npm run start`, set the same env vars, put the app behind HTTPS.
- **Docker:** use a standard Node 22 image; run `npm ci && npm run build`,
  start with `npm run start`. The app listens on `$PORT` via Next defaults
  when using `next start -p $PORT`.

## Updating a live restaurant

Pull the latest platform code, `npm install`, redeploy. Schema changes are
additive and applied automatically at startup (`ensureDatabase()` runs
idempotent `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`
migrations), so upgrades do not require manual SQL. Always test against a
Neon branch first for paying clients.

## Health checks

`GET /api/health` returns `{ "ok": true }` — safe to use for uptime monitors
(it does not require the database).
