# Admin Guide

For restaurant owners and staff. Sign in at `https://<your-domain>/admin/login`.

## Dashboard

Your day at a glance: new orders needing action, pending bookings, today's
covers, recent activity and quick links into Sales, Food performance and
Reports. If setup hasn't been finished, a banner guides you back to the
Setup Wizard.

## Orders

- New collection orders appear in real time (the board auto-refreshes and can
  play a sound / browser notification — allow notifications when asked).
- Progress each order: **New → Accepted → Preparing → Ready → Collected**
  (or Cancel with a note). Urgent orders glow red.
- Print a kitchen ticket from any order card.
- The *History* scope searches past orders by name/phone/order number.
- **Payment:** guests pay on collection (card/cash at the counter). Online
  payment shows as *Coming Soon* until Stripe is switched on for you.

## Bookings

- Booking requests land as **Pending** — Confirm or Decline; the guest is
  emailed automatically either way.
- Add phone/walk-in bookings manually with *New booking*.
- Mark **Arrived / No-show** to keep analytics honest.
- Filter by day to print tonight's list.

## Customers

Every order/booking builds the customer database automatically (matched by
phone/email). Open a customer to see order history, spend, favourite dishes,
notes and tags. Tiers (New/Regular/VIP…) update themselves.

## Messages

Contact-form messages with unread badges, reply-by-email shortcut, archive
when handled.

## Menu & prices

- Add/edit categories and dishes; drag order is reflected on the website.
- Per dish: description, price, photo URL, dietary flags (vegetarian, vegan,
  gluten-free…), spice level, *featured* (homepage), availability toggle,
  and optional extras/choices (e.g. protein options with price differences).
- Changes are live immediately.

## Menu import

Upload a **PDF, CSV or Excel** menu (or download the CSV template, fill it
in, upload). Review the generated draft — fix names/prices inline — then
**Publish as additions** or **Replace live menu**. Every import is logged.

## Business settings

Everything public: name, tagline, About text, logo, photos, brand colours,
address/phone/email, socials, Google links. Plus:

- **Opening hours & holiday hours** — go live on the website, collection
  slots and booking times the moment you save.
- **Collection & delivery** — toggle each channel, delivery partner link,
  fees and notes.
- **Payments** — Pay on Collection on/off; Pay Online (Stripe) key storage
  ready for activation (checkout shows *Coming Soon* to guests meanwhile).
- **Special events & notices** for internal planning.

## Settings

- **Online ordering on/off** + paused message (e.g. "Kitchen closed for a
  private party tonight").
- Slot lead time / interval / days ahead, extra closed dates.
- Notification email, announcement banner.
- **Demo data** — *Reset Demo Data* restores the sample dataset for training
  (careful: it replaces the live menu with the demo menu); *Remove Demo
  Data* permanently deletes demo records.

## Analytics & reports

- **Sales** — revenue trends (day/week/month/year), peaks, channel split.
- **Food performance** — best sellers, slow movers, category mix, estimated
  margins (add costs per dish to unlock margin views).
- **Booking analytics** — covers, popular times/days, party sizes, no-shows.
- **Customer analytics** — new vs returning, tiers, top spenders, retention.
- **Marketing** — promotions/voucher tracking and review prompts.
- **SEO dashboard** — page titles/descriptions editor, sitemap/structured-
  data status, local SEO checklist.
- **Reports** — downloadable CSV/PDF (sales summary, item sales, bookings,
  customers, end-of-day) for your accountant.

Until real data builds up, analytics pages may show clearly-labelled *sample*
figures (demo mode) so you can learn the screens.

## Good habits

- Keep the Orders board open during service; enable sound/notifications.
- Toggle a dish *unavailable* instead of deleting it when you run out.
- Add holiday closures as soon as dates are known — slots update instantly.
- Change the admin password if a staff member who knew it leaves
  (ask your platform provider to rotate `ADMIN_PASSWORD`).
