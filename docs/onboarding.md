# Client Onboarding Guide

A repeatable process for launching a new restaurant on the platform —
target: under one hour of platform work once assets are in hand.

## 1. Collect from the client (asset checklist)

Send the client this list up front:

- [ ] Logo (vector or large PNG; square/transparent ideal)
- [ ] Business details: trading name, address, phone, email
- [ ] Opening hours incl. kitchen closing notes
- [ ] Menu as PDF/CSV/Excel (or a link to their current menu)
- [ ] 3–6 photos (interior, hero dish spread, signature dishes)
- [ ] Social links (Facebook/Instagram/TripAdvisor, Google profile link)
- [ ] Delivery partner URL if they use one
- [ ] Domain name + registrar login (or permission to register one)
- [ ] Preferred admin email for order notifications

## 2. Provision (≈10 min)

1. Create the client's repo from this platform (`restaurant-management-platform`).
2. Create a Neon project per client (region near them).
3. Create the Vercel project, connect Neon, set env vars:
   `DATABASE_URL`, `ADMIN_PASSWORD` (generate strong), `NEXT_PUBLIC_SITE_URL`
   (temp `*.vercel.app` URL until domain is ready), email keys.
4. Deploy; confirm the demo site loads.

## 3. Configure (≈20 min)

1. Run `/setup` with the collected assets (see [Setup Guide](setup.md)).
2. Import the menu file; review the draft carefully (prices!); publish.
3. Spot-check dietary flags (vegetarian/spicy) in Menu & prices.
4. Add holiday closures the client already knows (Christmas etc.) under
   Business settings → Holiday hours.
5. Set the announcement banner if they have a launch offer.

## 4. Test like a customer (≈10 min)

- [ ] Place a real collection order → appears in admin, status flow works,
      notification email received, confirmation page correct
- [ ] Make a table booking → admin confirm → customer email received
- [ ] Send a contact message → appears in Messages
- [ ] Check every public page on mobile + desktop; click tel/map links
- [ ] `/sitemap.xml`, `/robots.txt` correct; page titles show the client name
- [ ] Delete the test order/booking afterwards (or leave labelled)

## 5. Go live (≈15 min)

1. Attach the domain + HTTPS ([Domain Setup](domain-setup.md)).
2. Set final `NEXT_PUBLIC_SITE_URL`, redeploy, re-check canonicals.
3. Remove demo data (Admin → Settings).
4. Submit sitemap to Google Search Console; update Google Business Profile
   website + hours to match.
5. If replacing an old site: add redirects for important old URLs in
   `next.config.ts`.

## 6. Handover pack

Give the client:

- Admin URL + password (via password manager/one-time link)
- The [Admin Guide](admin-guide.md) (print/PDF)
- 15-minute training call: accepting orders, confirming bookings, editing a
  price, pausing ordering, where reports live
- Support contact + what to do if "the website is down" (check power/
  internet/token expiries before escalating)

## 7. Aftercare (suggested)

- Weekly: review Sales/Food dashboards with the client for the first month
- Monthly: dependency updates, Neon backup check, Search Console review
- Quarterly: menu/photos refresh, seasonal campaigns (Marketing page ideas)
