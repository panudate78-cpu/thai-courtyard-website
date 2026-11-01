# Keeping the Neon compute bill down

The database is Neon Postgres on the **Free plan** (100 CU-hours per project per month).
Neon only bills compute while the database is **awake**, and on the Free plan it goes
back to sleep **5 minutes after the last query** — that 5-minute delay cannot be changed.

That means: **anything that queries the database more often than every 5 minutes keeps
it awake 24/7**, which costs 24 × 31 × 0.25 CU ≈ 186 CU-hours a month — the whole
allowance and then some.

## What the site used to do

| Panel | Timer | Queries per day |
| --- | --- | --- |
| Admin → Orders board (`/admin/orders`) | every 15 s, all day | 5,760 |
| Admin sidebar "Site visits" counter | every 60 s, all day | 1,440 |

A dashboard tab left open in the restaurant — or just left open overnight on a phone —
was enough to keep the database permanently awake.

## What it does now

Auto-refresh runs **only while the restaurant is trading**: Tuesday – Saturday,
**12:00 – 21:00 UK time**, and only while the browser tab is **visible**.

| Panel | Timer inside the window |
| --- | --- |
| Orders board | every 20 s |
| Site visits counter | every 60 s |

Outside the window nothing is polled: a single timer waits for the next 12:00 and
then starts again. Both panels show a **"Paused · back …"** badge, and the
**Refresh** button on the orders board always fetches on demand.

Worst case is now 9 h × 5 days = **45 hours of compute a week** (~195 h/month ≈
49 CU-hours at the smallest compute size), and in practice far less, because the
timers only run while somebody actually has the admin panel open.

### Where to change it

- Trading window: `SERVICE_WINDOW` in `src/lib/refresh-schedule.ts`
  (days use JS numbering, 0 = Sunday; times are minutes past midnight, UK time).
- Timers: `POLL_INTERVALS` in the same file.

## Other things that wake the database

Worth checking after the change if usage is still high:

1. **Uptime monitors.** If an uptime service (UptimeRobot, Pingdom, a cron job,
   BetterStack…) pings `/api/health` every minute, that endpoint runs
   `select 1` and keeps the database awake forever. Either point the monitor at
   `https://www.thaicourtyardmolesey.co.uk/` instead, or check it every 30 minutes.
2. **Vercel Cron jobs / scheduled functions.** None are configured in this repo
   (there is no `vercel.json`), but check the Vercel project's *Cron Jobs* tab.
3. **Public page views.** Every page on the public site is rendered on demand
   (`force-dynamic`) and reads menu + settings from Postgres, so each visitor
   wakes the database for 5 minutes. Occasional visitors are cheap; a busy day of
   Google traffic is not. If that shows up in the usage graph, the menu/home pages
   can be cached for a few minutes with `export const revalidate = 300`, at the
   cost of menu edits taking up to 5 minutes to appear.
4. **Neon console → Usage.** The graph shows exactly which hours the compute was
   awake. Compare it with the opening hours — anything awake outside 12:00–21:00
   is coming from one of the three items above.
