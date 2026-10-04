import Image from "next/image";
import Link from "next/link";
import { MapPin, Navigation, Phone, Star } from "lucide-react";
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
          <Image src={IMG.logo.src} alt="Thai Courtyard — Simply Delicious" width={128} height={122} className="h-28 w-auto" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed">
            A warm, cosy and family-friendly Thai restaurant on Walton Road. {SITE.newManagement}.
          </p>
          <a
            href={SITE.googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gold-light hover:underline"
          >
            <Star className="h-4 w-4" aria-hidden="true" />
            Review us on Google
          </a>
        </div>

        <div>
          <h2 className="font-serif text-xl font-semibold text-cream">Visit us</h2>
          <address className="mt-4 space-y-3 text-sm not-italic">
            <p className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-light" aria-hidden="true" />
              <span>
                {SITE.address.street}
                <br />
                {SITE.address.locality}
                <br />
                {SITE.address.postcode}
              </span>
            </p>
            <p className="flex gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold-light" aria-hidden="true" />
              <a href={SITE.phoneHref} className="hover:text-gold-light">
                {SITE.phoneDisplay}
              </a>
            </p>
            <p className="flex gap-3">
              <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-gold-light" aria-hidden="true" />
              <a href={SITE.googleDirectionsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-gold-light">
                Get directions
              </a>
            </p>
          </address>
        </div>

        <div>
          <h2 className="font-serif text-xl font-semibold text-cream">Opening hours</h2>
          <OpeningHours dark className="mt-3" />
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
        </div>
      </div>
      <div className="border-t border-cream/10">
        <div className="container-x flex flex-col gap-3 py-6 text-xs text-cream/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Thai Courtyard, East Molesey. All rights reserved.</p>
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
