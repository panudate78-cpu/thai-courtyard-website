# Vercel Deployment Guide

Step-by-step deployment of one restaurant on Vercel + Neon. Repeat per client.

## 1. Import the project

1. Push the platform code to a GitHub repository (one repo per client is
   recommended so clients can be handed over independently).
2. In Vercel: **Add New → Project → Import** the repository.
3. Framework preset auto-detects **Next.js**. Leave build/install commands at
   their defaults (`npm run build`, `npm install`).

## 2. Connect the database (Neon)

Option A — **Vercel integration (fastest):**
Project → **Storage → Create Database → Neon → Continue**. Vercel creates the
Neon project and injects `DATABASE_URL` (plus related vars) into all
environments automatically.

Option B — **Existing Neon project:** copy the pooled connection string from
Neon and add it manually in the next step (see [Neon Setup Guide](neon-setup.md)).

## 3. Environment variables

Project → **Settings → Environment Variables** (Production):

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon pooled string (skip if using the integration) |
| `ADMIN_PASSWORD` | A strong unique password for this restaurant's admin |
| `NEXT_PUBLIC_SITE_URL` | `https://www.<restaurant-domain>` (no trailing slash) |
| `RESEND_API_KEY` *or* `SMTP_*` | For order/booking email notifications |
| `DB_POOL_MAX` | `5` (recommended on Neon free/Launch) |

Tip: before the custom domain is live, temporarily set
`NEXT_PUBLIC_SITE_URL` to the `*.vercel.app` URL and update it at go-live.

## 4. Deploy & set up

1. **Deploy.** The first request creates all tables and the demo dataset —
   no migration command needed.
2. Visit `https://<deployment>/setup` and run the Setup Wizard with the
   client's assets (see [Setup Guide](setup.md)).
3. Sign in at `/admin/login`, then **Settings → Remove Demo Data**.
4. Place a test order and booking; confirm they show in the admin and that
   notification emails arrive.

## 5. Preview deployments

Pull requests get preview URLs automatically. Previews share the Production
database **unless** you give the Preview environment its own `DATABASE_URL`
(recommended: a Neon *branch* of production) so test orders never pollute
live data.

## 6. Go-live

1. Attach the domain (see [Domain Setup Guide](domain-setup.md)).
2. Update `NEXT_PUBLIC_SITE_URL` to the final domain and redeploy.
3. Verify `/sitemap.xml` lists the final domain; submit it in Google Search
   Console.
4. Change `ADMIN_PASSWORD` if a temporary one was used during setup, and
   record it in your password manager / handover pack.

## Costs (typical single restaurant)

- Vercel **Hobby** (free) works for trials; **Pro** (~$20/mo) is recommended
  for commercial client sites (licence terms, analytics, higher limits).
- Neon **Free** is enough to start; **Launch** (~$19/mo) adds longer backup
  history and removes cold-start pauses.
