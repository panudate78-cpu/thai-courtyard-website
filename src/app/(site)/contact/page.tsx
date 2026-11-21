import type { Metadata } from "next";
import { Clock, MapPin, Navigation, Phone, Star } from "lucide-react";
import { ContactForm } from "@/components/forms/ContactForm";
import { DeliverooButton, JsonLd, OpeningHours, PageHero } from "@/components/ui";
import { AreasServed, FaqSection } from "@/components/site/SeoSections";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { SITE } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { getResolvedSeo } = await import("@/lib/seo-resolve");
    const seo = await getResolvedSeo("/contact");
    if (seo) {
      return {
        title: seo.title,
        description: seo.description,
        alternates: { canonical: "/contact" },
        openGraph: {
          title: seo.ogTitle || seo.title,
          description: seo.ogDescription || seo.description,
          url: "/contact",
          images: seo.ogImage ? [{ url: seo.ogImage }] : ["/opengraph-image"],
        },
      };
    }
  } catch {}
  return {
    title: "Contact & Opening Hours — Demo Restaurant Sample Town, KT9 1AB",
    description:
      "Find Demo Restaurant at 123 High Street, Sample Town KT9 1AB — near Sample Town Palace. Open Tue–Sat 12:00–21:00. Call 020 1234 5678 or send a message. BYOB, dine-in & collection.",
    alternates: { canonical: "/contact" },
    openGraph: {
      title: "Contact Demo Restaurant — Find Us in Sample Town",
      description: "123 High Street, Sample Town KT9 1AB — near Sample Town. Tue–Sat 12–21. Call 020 1234 5678. Get directions or message us.",
      url: "/contact",
      images: ["/opengraph-image"],
    },
  };
}

const CONTACT_FAQS = [
  { question: "Where exactly are you?", answer: "123 High Street, Sample Town, Surrey KT9 1AB. We're on Walton Road, the main road through Sample Town — a few seconds from Sample Town Palace and Sample Town Station. Look for the Demo Restaurant signage; free on-street parking nearby." },
  { question: "What are your opening hours?", answer: "Tuesday to Saturday 12:00–21:00 (last collection orders before 21:00). Closed Sunday and Monday. For same-day bookings or orders, please call 020 1234 5678." },
  { question: "Is there parking nearby?", answer: "Yes — on-street parking on Walton Road and surrounding residential roads, plus nearby public car parks around Sample Town and Sample Town. We're also a short walk from Sample Town train station and local buses." },
  { question: "Are you BYOB?", answer: "Yes — we don't serve alcohol but you can bring your own (corkage applies). Ask our team for details." },
];

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <JsonLd data={faqJsonLd(CONTACT_FAQS)} />
      <PageHero
        eyebrow="Get in touch"
        title="Contact & Find Us"
        intro={`We're at ${SITE.addressLine} — just off Sample Town Way, 2 minutes from Sample Town Palace. Call ${SITE.phoneDisplay} or message us; we aim to reply within one working day.`}
      />

      <section className="container-x grid gap-10 py-14 lg:grid-cols-[1fr_1.05fr] lg:py-20">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card p-6">
              <MapPin className="h-6 w-6 text-gold-deep" aria-hidden="true" />
              <h2 className="mt-3 font-serif text-2xl font-semibold">Address</h2>
              <address className="mt-2 text-charcoal/75 not-italic">
                Demo Restaurant
                <br />
                {SITE.address.street}
                <br />
                {SITE.address.locality}, {SITE.address.postcode}
              </address>
              <p className="mt-1 text-xs text-charcoal/50">Near Sample Town Palace • Surrey KT8</p>
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
              <p className="mt-2 text-sm text-charcoal/65">Bookings, collection orders and enquiries during opening hours. We&apos;re on {SITE.hoursSummary}.</p>
              <a href={SITE.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-xs font-semibold text-gold-deep hover:underline">
                View on Google Maps
              </a>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-gold-deep" aria-hidden="true" />
              <h2 className="font-serif text-2xl font-semibold">Opening hours</h2>
            </div>
            <OpeningHours className="mt-3" />
            <p className="mt-3 text-xs leading-relaxed text-charcoal/50">
              Serving lunch & dinner — Express Lunch 12–15 (Tue–Sat) from £9.95. Last orders for collection around 20:45.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-teak/10">
            <iframe
              src={SITE.googleMapsEmbedUrl}
              title="Google Map showing Demo Restaurant at 123 High Street, Sample Town — near Sample Town Palace"
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
          <div className="rounded-2xl border border-gold/20 bg-gold/5 p-5 text-sm leading-relaxed text-charcoal/75">
            <strong className="font-semibold">Coming from further afield?</strong> Easy for Thames Ditton, Hampton, Teddington, Esher, Walton-on-Thames, Hersham, Surbiton & Kingston — all within 10–15 mins by car. Sample Town Station is a 5-minute walk.
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
      <AreasServed />
      <FaqSection items={CONTACT_FAQS} heading="Contact & location FAQs" />
    </>
  );
}
