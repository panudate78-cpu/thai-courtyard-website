# Thai Courtyard — SEO & “More Customers” Playbook
### For when business is slow — 7-day action plan + evergreen engine

You asked for **FULL SEO and a way to direct more customers now**. Code does half; this doc tells you what to do offline and how to use the new features. No jargon, just steps. Do Days 1–3 first.

---

## 1) Fix your Google (2 hours, huge ROI)

Your Google Business Profile (GBP) decides if you appear in the “Thai near me” map pack. That pack gets 70% of taps.

**Checklist — do in order:**
1. Claim & verify at https://business.google.com — search “Thai Courtyard 105 Walton Road KT8 0DR”. Use address exactly as on site/Footer.
2. **NAP consistency** (Name, Address, Phone): Must be *Thai Courtyard, 105 Walton Road, East Molesey, Surrey KT8 0DR, 020 8941 3595* everywhere — GBP, website footer, Deliveroo, Yell, TripAdvisor. We already fixed the site.
3. **Hours**: Tue–Sat 12:00–21:00, Closed Sun/Mon. Add special hours for bank holidays in GBP *and* Admin → Restaurant (so site matches).
4. **Categories**: Primary = *Thai restaurant*, secondary = *Restaurant, Takeaway, Asian restaurant*.
5. **Attributes**: Toggle ON — Dine-in, Takeaway, Family-friendly, Identifies as family-owned (if true). Add “BYOB — bring your own alcohol, corkage applies” to description/business description.
6. **Photos** (most important): Upload 10+ with geotag: hero spread, Pad Thai, green curry, satay, dumplings, dining room, staff, Walton Road shopfront. Name files `thai-courtyard-east-molesey-pad-thai.jpg` (helps image search). Add 1 new photo every 2 weeks.
7. **Menu**: Link to `https://www.thaicourtyardmolesey.co.uk/menu` (not PDF). In GBP menu, copy dishes + prices exactly as on site — Google cross-checks.
8. **Posts — weekly**: Use GBP Posts (Create Post → Offer/Event). Example: “Express Lunch £9.95 — Tue–Sat 12–15, prawn crackers + soft drink. Dine-in or collection — 105 Walton Road, 2 mins from Hampton Court.” Link CTA → `/order` or `/menu`. Post every 7 days; it keeps you fresh.
9. **Products**: Add 3 products: “Green Curry”, “Pad Thai”, “Mixed Starters” with photo + price → shows under GBP.

**After each dine-in or collection:**
> “Loved it? A quick Google review at **thaicourtyardmolesey.co.uk/review** takes 30 seconds and helps our family-run restaurant while it’s quieter — thank you!”

Print a QR that points to `/review` (or your `googleReviewUrl`) — put on receipts, till, table tents. The `/review` page we built is designed to convert: star button + WhatsApp share + FAQ.

**Reply to every review within 24h** with location keywords naturally: “Thanks Sarah! So glad you enjoyed the Panang curry — hope to see you again on Walton Road / after your next Hampton Court visit.” Never copy-paste; Google rewards uniqueness.

Goal: 5 new reviews in next 14 days → you’ll jump in local pack for “Thai East Molesey”.

---

## 2) Use your new site features (5 mins each)

### A — Offers (your “direct customers” lever)
Admin → Marketing → Create offer. Ideas for slow periods:

- **Quiet Wednesdays – 10% off collection** (Title, Description: “Midweek treat — 10% off all collection orders Weds 12–21, pay on collection. Use code MIDWEEK.”, CTA Link `/order`, Starts Monday, Ends Wednesday, Enabled). Auto-shows on homepage.
- **Express Lunch push** — “Express Lunch from £9.95 — add a soft drink + prawn crackers. Tue–Sat 12–15.”
- **Family Feast** — “Family set for 4: mixed starters + 2 curries + Pad Thai + rice — £42 (collection). Call to customise.”

Tip: Keep 1 offer live at any time (not 0, not 5). Share its link on WhatsApp/Nextdoor with UTM: `/order?utm_source=offer&utm_medium=whatsapp&utm_campaign=quiet-weds`.

Site now emits `Offer` JSON-LD so Google may show it as a promotion.

### B — SEO overrides (target search terms)
Admin → Business → SEO. You can now change any page’s title/description + social image and it goes **live instantly** (we fixed it).

Example: If business is slow for takeaway, change `/order` override description to: “Order Thai takeaway for collection in East Molesey & Hampton Court — ready in ~20 mins, pay on collection. Curries, Pad Thai, stir-fries. 105 Walton Road KT8 — Tue–Sat 12–21.”

Keep titles <60 chars, descriptions 140–160 chars, include “East Molesey / Hampton Court / KT8” naturally.

### C — VIP list (your re-engagement engine)
Homepage bottom now has “Get VIP offers”. Every signup goes to Admin → Customers (marketingConsent=yes). When you hit 50:

- Send broadcast via your email provider (or even BCC from your business email): Subject “Thank you, East Molesey — 10% off your next Thai collection” + code `VIP10` (honour at till, no code dev needed yet). Link: `https://www.thaicourtyardmolesey.co.uk/order?utm_source=email&utm_campaign=vip`.
- Next month: “New dish: Mango sticky rice — this week only”.

Add signup QR to menus: “Join VIP — occasional offers, unsubscribe anytime.”

---

## 3) Social & community (30 mins/week)

- **Nextdoor & local Facebook groups** (East Molesey, Hampton Court, Thames Ditton): Post once/week with a food photo from `/images/*` + caption with keywords: “Fresh green curry & Pad Thai at Thai Courtyard, 105 Walton Road — 2 mins from Hampton Court Palace. Dine-in (BYOB) or order collection in ~20 mins: thaicourtyardmolesey.co.uk/order — Tue–Sat 12–21. #EastMolesey #HamptonCourt”. Always link.
- **Instagram/Facebook**: Reels of wok-tossing, curry simmering. Tag location “Thai Courtyard, East Molesey” + “Hampton Court Palace”. Bio link → `/order?utm_source=instagram`.
- **Deliveroo**: Sync menu/photos with site; keep prices within 10% (Google penalises huge gaps).

---

## 4) Partnerships — near Hampton Court Palace (30 mins one-off)
You’re 2 mins from one of UK’s busiest visitor spots.

- Email **Hampton Court Palace** gift shop / tours — ask to be “Recommended local Thai — 5 min walk, BYOB welcome” flyer in visitor centre. Offer “Palace ticket 10% off collection” (they love value-add).
- Contact 3 local hotels/B&Bs within 1 mile — drop 20 menus with “10% off first collection — show this card” + QR to `/menu`.
- **Bushy Park runners/cyclists**: Post “Refuel after Bushy Park — Express Lunch £9.95 12–15” on parkrun Facebook page (with admin permission).

---

## 5) Track what works (no extra tools needed)

- **Admin → Settings → Site visits**: See daily views (we added `VisitTracker`).
- **Add UTM to every share** so you know: `?utm_source=nextdoor&utm_medium=share&utm_campaign=lunch` or `?utm_source=google_review_qr`. Then check which page’s visits spike.
- **GBP Insights**: weekly check Searches vs Calls vs Directions.
- **Orders vs bookings**: Compare Admin → Orders (collection) vs Bookings (dine-in) — if bookings lag, push “Book a table” CTA; if collections lag, push Express Lunch offer.

Aim: 10% more weekly visitors → 5–10% more orders. Reviews + VIP compound monthly.

---

## 6) What NOT to do
- Don’t pay for cheap backlinks or “SEO guarantees”. One GBP post + 1 review = more value.
- Don’t stuff hidden text; our on-page copy is already keyword-optimised naturally.
- Don’t run TikTok ads yet — organic Google + Nextdoor beats paid for a 40-cover KT8 restaurant.

---

## 7) Weekly rhythm (while slow)
- **Monday**: Create/refresh one offer (e.g., “Midweek 10% off”).
- **Tue/Wed**: Ask every table + 5 collections for reviews (QR at till).
- **Thursday**: Post GBP Post + one community photo.
- **Sunday (closed)**: 15-min reply to all Google reviews + check site visits.

After 4 weeks, you should see: higher Google impressions (Search Console), +5–15 reviews, VIP list 50–150, steadier Wed/Thu covers.

---

### Where to get help in the site
- **Sitemap**: `/sitemap.xml` — submit in Google Search Console → Sitemaps.
- **Robots**: `/robots.txt` — already allows Google, blocks junk.
- **Test rich results**: https://search.google.com/test/rich-results → paste any page URL, check `Restaurant`, `Menu`, `FAQPage`, `BreadcrumbList`.
- **OG preview**: https://www.opengraph.xyz/ → paste site URL, confirm card shows gold “Authentic Thai in East Molesey” image.

Questions? The SEO panel (Admin → SEO) and this playbook are your controls. The site now does the heavy lifting — your job is reviews + one weekly post + one monthly offer. That’s the direct line to more customers.
