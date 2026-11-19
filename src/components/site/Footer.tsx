import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, Navigation, Phone, Star } from "lucide-react";
import { LaunchpadCredit } from "@/components/LaunchpadCredit";
import { DeliverooButton, OpeningHours } from "@/components/ui";
import { IMG } from "@/lib/image-manifest";
import { NAV_LINKS, SITE } from "@/lib/site";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative isolate bg-charcoal text-cream/80">
      <div className="thai-pattern absolute inset-0 -z-10 opacity-50" aria-hidden="true" />
      <div className="container-x grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div>
          <Image src={IMG.logo.src} alt="Thai Courtyard — Authentic Thai restaurant East Molesey, Surrey" width={128} height={122} className="h-28 w-auto" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed">
            Authentic Thai cuisine in the heart of East Molesey — warm, cosy & family-friendly. Dine-in, takeaway collection & Deliveroo delivery. BYOB welcome.
          </p>
          <p className="mt-2 max-w-xs text-xs leading-relaxed text-cream/55">
            Thai restaurant near Hampton Court Palace • 105 Walton Road, KT8 0DR • Tue–Sat 12:00–21:00
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={SITE.googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gold-light hover:underline"
            >
              <Star className="h-4 w-4" aria-hidden="true" />
              Review us on Google
            </a>
            <a href={SITE.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-cream/60 hover:text-gold-light">
              View on Maps
            </a>
          </div>
        </div>

        <div>
          <h2 className="font-serif text-xl font-semibold text-cream">Visit us</h2>
          <address className="mt-4 space-y-3 text-sm not-italic">
            <p className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-light" aria-hidden="true" />
              <span>
                {SITE.address.street}
                <br />
                {SITE.address.locality}, {SITE.address.region}
                <br />
                {SITE.address.postcode}
              </span>
            </p>
            <p className="flex gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold-light" aria-hidden="true" />
              <a href={SITE.phoneHref} className="hover:text-gold-light font-semibold">
                {SITE.phoneDisplay}
              </a>
            </p>
            <p className="flex gap-3">
              <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-gold-light" aria-hidden="true" />
              <a href={SITE.googleDirectionsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-gold-light">
                Get directions — near Hampton Court
              </a>
            </p>
            <p className="flex gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold-light" aria-hidden="true" />
              <span>Tue–Sat 12:00–21:00<br /><span className="text-cream/55">Closed Sun & Mon</span></span>
            </p>
          </address>
        </div>

        <div>
          <h2 className="font-serif text-xl font-semibold text-cream">Opening hours</h2>
          <OpeningHours dark className="mt-3" />
          <p className="mt-3 text-xs text-cream/50">Express Lunch Tue–Sat 12–15 from £9.95</p>
        </div>

        <div>
          <h2 className="font-serif text-xl font-semibold text-cream">Explore</h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm lg:grid-cols-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-gold-light">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <DeliverooButton className="mt-6 w-full px-4 lg:w-auto" />
          <div className="mt-6 rounded-xl bg-cream/5 p-3 text-xs leading-relaxed text-cream/60 ring-1 ring-cream/10">
            <strong className="text-cream">Areas we serve:</strong><br />
            Thai takeaway & dine-in for East Molesey, Hampton Court, Thames Ditton, Hampton, Teddington, Esher, Walton, Hersham & Surbiton.
          </div>
        </div>
      </div>
      {/* SEO-rich bottom strip */}
      <div className="border-y border-cream/5 bg-charcoal-soft/50">
        <div className="container-x py-6 text-xs leading-relaxed text-cream/60">
          <p>
            <strong className="font-semibold text-cream/80">Thai Courtyard</strong> — Authentic Thai restaurant on Walton Road, East Molesey, Surrey KT8 0DR. Family-run, freshly cooked Thai food: green curry, red curry, Pad Thai, Tom Yum, stir-fries, salads & chef&apos;s specials. Dine in, order collection online (pay on collection) or order delivery via Deliveroo. BYOB welcome — bring your own alcohol (corkage applies). Open Tuesday–Saturday 12:00–21:00. Serving East Molesey, West Molesey, Hampton Court Palace, Thames Ditton, Hampton, Teddington, Esher, Walton-on-Thames, Hersham, Surbiton & Kingston. Call <a href={SITE.phoneHref} className="text-gold-light hover:underline">{SITE.phoneDisplay}</a> •{" "}
            <a href="/menu" className="hover:text-gold-light">View Thai menu</a> • <a href="/order" className="hover:text-gold-light">Order takeaway</a> • <a href="/book" className="hover:text-gold-light">Book a table</a>
          </p>
        </div>
      </div>
      <div className="border-t border-cream/10">
        <div className="container-x flex flex-col gap-3 py-6 text-xs text-cream/55 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <p>© {year} Thai Courtyard, East Molesey, Surrey KT8 0DR. All rights reserved. Thai restaurant near Hampton Court Palace.</p>
            <LaunchpadCredit
              className="text-cream/50"
              linkClassName="text-cream/70 decoration-cream/25 hover:text-gold-light hover:decoration-gold-light/70"
            />
          </div>
          <p className="flex gap-5">
            <Link href="/contact" className="hover:text-gold-light">
              Allergies &amp; enquiries
            </Link>
            <Link href="/admin" className="hover:text-gold-light" rel="nofollow">
              Staff login
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
