import type { Metadata } from "next";
import { Clock, MapPin, Navigation, Phone, Star } from "lucide-react";
import { ContactForm } from "@/components/forms/ContactForm";
import { DeliverooButton, JsonLd, OpeningHours, PageHero } from "@/components/ui";
import { breadcrumbJsonLd } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact & Opening Hours",
  description:
    "Find Thai Courtyard at 105 Walton Road, East Molesey, KT8 0DR. Open Tuesday to Saturday 12:00–21:00. Call 020 8941 3595 or send us a message.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <PageHero
        eyebrow="Get in touch"
        title="Contact & Find Us"
        intro="We'd love to hear from you — whether it's a question about the menu, allergies, a large booking or feedback on your visit."
      />

      <section className="container-x grid gap-10 py-14 lg:grid-cols-[1fr_1.05fr] lg:py-20">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card p-6">
              <MapPin className="h-6 w-6 text-gold-deep" aria-hidden="true" />
              <h2 className="mt-3 font-serif text-2xl font-semibold">Address</h2>
              <address className="mt-2 text-charcoal/75 not-italic">
                Thai Courtyard
                <br />
                {SITE.address.street}
                <br />
                {SITE.address.locality}, {SITE.address.postcode}
              </address>
              <a
                href={SITE.googleDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-deep hover:underline"
              >
                <Navigation className="h-4 w-4" aria-hidden="true" />
                Get directions
              </a>
            </div>
            <div className="card p-6">
              <Phone className="h-6 w-6 text-gold-deep" aria-hidden="true" />
              <h2 className="mt-3 font-serif text-2xl font-semibold">Phone</h2>
              <a href={SITE.phoneHref} className="mt-2 block text-xl font-semibold text-teak hover:underline">
                {SITE.phoneDisplay}
              </a>
              <p className="mt-2 text-sm text-charcoal/65">Bookings, collection orders and enquiries during opening hours.</p>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-gold-deep" aria-hidden="true" />
              <h2 className="font-serif text-2xl font-semibold">Opening hours</h2>
            </div>
            <OpeningHours className="mt-3" />
          </div>

          <div className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-teak/10">
            <iframe
              src={SITE.googleMapsEmbedUrl}
              title="Google Map showing Thai Courtyard at 105 Walton Road, East Molesey"
              className="h-[340px] w-full border-0 sm:h-[400px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <a href={SITE.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
              <MapPin aria-hidden="true" />
              Open in Google Maps
            </a>
            <a href={SITE.googleReviewUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
              <Star aria-hidden="true" />
              Review us on Google
            </a>
            <DeliverooButton />
          </div>
        </div>

        <div>
          <div className="card p-6 sm:p-8 lg:sticky lg:top-28">
            <h2 className="font-serif text-3xl font-semibold">Send us a message</h2>
            <p className="mt-2 text-sm text-charcoal/65">
              We aim to reply within one working day. For same-day bookings or orders, please call us.
            </p>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
