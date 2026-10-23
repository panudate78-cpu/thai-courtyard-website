import Link from "next/link";
import { FacebookIcon, InstagramIcon } from "@/components/ui";
import { Mail, MapPin, Navigation, Phone, Star } from "lucide-react";
import { BrandLogo, DeliveryButton, OpeningHours } from "@/components/ui";
import type { RestaurantConfig } from "@/lib/restaurant";
import { NAV_LINKS } from "@/lib/site";

export function Footer({ config }: { config: RestaurantConfig }) {
  const year = new Date().getFullYear();
  const socials = [
    { href: config.social.facebook, label: "Facebook", icon: FacebookIcon },
    { href: config.social.instagram, label: "Instagram", icon: InstagramIcon },
  ].filter((s) => s.href);
  return (
    <footer className="relative isolate bg-charcoal text-cream/80">
      <div className="brand-pattern absolute inset-0 -z-10 opacity-50" aria-hidden="true" />
      <div className="container-x grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div>
          <BrandLogo logoUrl={config.logoUrl} name={config.name} width={112} height={112} className="h-24 w-24 rounded-full object-cover" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed">{config.description}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a
              href={config.googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gold-light hover:underline"
            >
              <Star className="h-4 w-4" aria-hidden="true" />
              Review us on Google
            </a>
            {socials.map(({ href, label, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-9 w-9 place-items-center rounded-full bg-cream/10 text-cream hover:bg-gold hover:text-charcoal"
                aria-label={`${config.name} on ${label}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </a>
            ))}
            {config.social.tripadvisor ? (
              <a href={config.social.tripadvisor} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-gold-light hover:underline">
                TripAdvisor
              </a>
            ) : null}
          </div>
        </div>

        <div>
          <h2 className="font-serif text-xl font-semibold text-cream">Visit us</h2>
          <address className="mt-4 space-y-3 text-sm not-italic">
            <p className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-light" aria-hidden="true" />
              <span>
                {config.address.street}
                <br />
                {config.address.locality}
                {config.address.region ? (
                  <>
                    <br />
                    {config.address.region}
                  </>
                ) : null}
                <br />
                {config.address.postcode}
              </span>
            </p>
            <p className="flex gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold-light" aria-hidden="true" />
              <a href={config.phoneHref} className="hover:text-gold-light">
                {config.phoneDisplay}
              </a>
            </p>
            {config.email ? (
              <p className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold-light" aria-hidden="true" />
                <a href={`mailto:${config.email}`} className="hover:text-gold-light">
                  {config.email}
                </a>
              </p>
            ) : null}
            <p className="flex gap-3">
              <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-gold-light" aria-hidden="true" />
              <a href={config.googleDirectionsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-gold-light">
                Get directions
              </a>
            </p>
          </address>
        </div>

        <div>
          <h2 className="font-serif text-xl font-semibold text-cream">Opening hours</h2>
          <OpeningHours hours={config.openingHours} dark className="mt-3" />
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
          <DeliveryButton delivery={config.delivery} className="mt-6 w-full px-4 lg:w-auto" />
        </div>
      </div>
      <div className="border-t border-cream/10">
        <div className="container-x flex flex-col gap-3 py-6 text-xs text-cream/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {config.fullName}. All rights reserved.
          </p>
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
