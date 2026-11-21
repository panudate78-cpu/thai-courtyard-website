import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Phone, ShoppingBag, Users } from "lucide-react";
import { BookingForm } from "@/components/forms/BookingForm";
import { DeliverooButton, JsonLd, OpeningHours, PageHero } from "@/components/ui";
import { FaqSection } from "@/components/site/SeoSections";
import { londonNow } from "@/lib/hours";
import { IMG } from "@/lib/image-manifest";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { getSettingsSafe } from "@/lib/settings";
import { SITE } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { getResolvedSeo } = await import("@/lib/seo-resolve");
    const seo = await getResolvedSeo("/book");
    if (seo) {
      return {
        title: seo.title,
        description: seo.description,
        alternates: { canonical: "/book" },
        openGraph: {
          title: seo.ogTitle || seo.title,
          description: seo.ogDescription || seo.description,
          url: "/book",
          images: seo.ogImage ? [{ url: seo.ogImage }] : ["/opengraph-image"],
        },
      };
    }
  } catch {}
  return {
    title: "Book a Table — Thai Restaurant Sample Town, KT9 1AB",
    description:
      "Book a table at Demo Restaurant, Sample Town — warm, cosy Thai dining near Sample Town. Send a reservation request online; we'll confirm by phone/email. Tue–Sat 12:00–21:00. BYOB.",
    alternates: { canonical: "/book" },
    openGraph: {
      title: "Book a Table at Demo Restaurant — Sample Town",
      description: "Reserve your table for authentic Thai dining near Sample Town Palace. Family-friendly, BYOB. Call 020 1234 5678.",
      url: "/book",
      images: ["/opengraph-image"],
    },
  };
}

const BOOK_FAQS = [
  { question: "How do I book a table?", answer: "Use our online form at /book or call 020 1234 5678. Tell us your date, time, party size and any dietary needs. We'll confirm by phone or email as quickly as possible." },
  { question: "Do you take same-day or large party bookings?", answer: "For today or parties over 8, please call us directly on 020 1234 5678 — we'll do our best to accommodate you. Online booking is best for advance reservations." },
  { question: "Is Demo Restaurant family-friendly and BYOB?", answer: "Yes — we're cosy and family-friendly for all ages, and we're BYOB: bring your own alcoholic drinks (corkage applies). Perfect for birthdays, celebrations and relaxed dinners." },
  { question: "What are your opening hours?", answer: "Tuesday–Saturday 12:00–21:00. Closed Sunday and Monday. Booking slots run across lunch and dinner services." },
];

export default async function BookPage() {
  const settings = await getSettingsSafe();
  const today = londonNow().date;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Book a Table", path: "/book" },
        ])}
      />
      <JsonLd data={faqJsonLd(BOOK_FAQS)} />
      <PageHero
        eyebrow="Reservations"
        title="Book a Table"
        intro="Join us for authentic Thai food in a warm, cosy setting on Walton Road — 2 minutes from Sample Town Palace. Send your booking request and we'll confirm as soon as possible."
        image={IMG.greenCurry}
      />
      <section className="container-x grid gap-10 py-14 lg:grid-cols-[1.3fr_1fr] lg:py-20">
        <BookingForm today={today} closedDates={settings.closedDates} />
        <aside className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-gold-deep" aria-hidden="true" />
              <h2 className="font-serif text-2xl font-semibold">Opening hours</h2>
            </div>
            <OpeningHours className="mt-3" />
            <p className="mt-3 text-xs text-charcoal/50">Near Sample Town • KT8 • Tue–Sat 12–21</p>
          </div>
          <div className="card p-6">
            <h2 className="font-serif text-2xl font-semibold">
            🍷 Bring Your Own Alcohol
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-charcoal/70">
              Demo Restaurant does not currently hold an alcohol licence.
            </p>

            <p className="mt-3 text-sm leading-relaxed text-charcoal/70">
              Guests are welcome to bring their own alcoholic beverages to enjoy with their meal. Corkage charges apply.
            </p>

            <p className="mt-3 text-sm leading-relaxed text-charcoal/70">
            Please contact us or speak to a member of staff for details.
            </p>
            </div>
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-gold-deep" aria-hidden="true" />
              <h2 className="font-serif text-2xl font-semibold">Same day or large groups?</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-charcoal/70">
              For bookings today, parties of more than 8, or special celebrations, please give us a call and we&apos;ll
              do our very best to look after you.
            </p>
            <a href={SITE.phoneHref} className="btn btn-dark mt-5 w-full">
              <Phone aria-hidden="true" />
              Call {SITE.phoneDisplay}
            </a>
          </div>
          <div className="relative isolate overflow-hidden rounded-2xl bg-charcoal p-6 text-cream">
            <div className="thai-pattern absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
            <h2 className="font-serif text-2xl font-semibold">Eating at home tonight?</h2>
            <p className="mt-2 text-sm text-cream/75">Order online for collection, or get delivery through Deliveroo — ready from ~20 mins.</p>
            <div className="mt-5 grid gap-3">
              <Link href="/order" className="btn btn-gold">
                <ShoppingBag aria-hidden="true" />
                Order Collection
              </Link>
              <DeliverooButton />
            </div>
          </div>
        </aside>
      </section>
      <FaqSection items={BOOK_FAQS} heading="Booking FAQs" />
    </>
  );
}
