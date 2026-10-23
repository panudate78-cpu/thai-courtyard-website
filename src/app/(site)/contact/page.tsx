import type { Metadata } from "next";
import { Clock, Mail, MapPin, Navigation, Phone, Star } from "lucide-react";
import { ContactForm } from "@/components/forms/ContactForm";
import { DeliveryButton, JsonLd, OpeningHours, PageHero, FacebookIcon, InstagramIcon } from "@/components/ui";
import { getRestaurantConfigSafe } from "@/lib/restaurant";
import { breadcrumbJsonLd } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRestaurantConfigSafe();
  return {
    title: "Contact & Opening Hours",
    description: `Find ${config.name} at ${config.addressLine}. Open ${config.hoursSummary}. Call ${config.phoneDisplay} or send us a message.`,
    alternates: { canonical: "/contact" },
  };
}

export default async function ContactPage() {
  const config = await getRestaurantConfigSafe();
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: "Home", path: "/" },
            { name: "Contact", path: "/contact" },
          ],
          config,
        )}
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
                {config.name}
                <br />
                {config.address.street}
                <br />
                {config.address.locality}
                {config.address.region ? <>, {config.address.region}</> : null}, {config.address.postcode}
              </address>
              <a
                href={config.googleDirectionsUrl}
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
              <a href={config.phoneHref} className="mt-2 block text-xl font-semibold text-teak hover:underline">
                {config.phoneDisplay}
              </a>
              {config.email ? (
                <a href={`mailto:${config.email}`} className="mt-2 flex items-center gap-2 text-sm font-semibold text-teak hover:underline">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  {config.email}
                </a>
              ) : null}
              <p className="mt-2 text-sm text-charcoal/65">Bookings, collection orders and enquiries during opening hours.</p>
              {(config.social.facebook || config.social.instagram) && (
                <p className="mt-3 flex gap-2">
                  {config.social.facebook ? (
                    <a href={config.social.facebook} target="_blank" rel="noopener noreferrer" className="grid h-9 w-9 place-items-center rounded-full bg-cream-dark hover:bg-gold" aria-label="Facebook">
                      <FacebookIcon className="h-4 w-4" aria-hidden="true" />
                    </a>
                  ) : null}
                  {config.social.instagram ? (
                    <a href={config.social.instagram} target="_blank" rel="noopener noreferrer" className="grid h-9 w-9 place-items-center rounded-full bg-cream-dark hover:bg-gold" aria-label="Instagram">
                      <InstagramIcon className="h-4 w-4" aria-hidden="true" />
                    </a>
                  ) : null}
                </p>
              )}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-gold-deep" aria-hidden="true" />
              <h2 className="font-serif text-2xl font-semibold">Opening hours</h2>
            </div>
            <OpeningHours hours={config.openingHours} className="mt-3" />
          </div>

          <div className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-teak/10">
            <iframe
              src={config.googleMapsEmbedUrl}
              title={`Google Map showing ${config.name} at ${config.addressLine}`}
              className="h-[340px] w-full border-0 sm:h-[400px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <a href={config.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
              <MapPin aria-hidden="true" />
              Open in Google Maps
            </a>
            <a href={config.googleReviewUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
              <Star aria-hidden="true" />
              Review us on Google
            </a>
            <DeliveryButton delivery={config.delivery} />
          </div>
        </div>

        <div>
          <div className="card p-6 sm:p-8 lg:sticky lg:top-28">
            <h2 className="font-serif text-3xl font-semibold">Send us a message</h2>
            <p className="mt-2 text-sm text-charcoal/65">
              We aim to reply within one working day. For same-day bookings or orders, please call us on {config.phoneDisplay}.
            </p>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
