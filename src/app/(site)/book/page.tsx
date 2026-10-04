import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Phone, ShoppingBag, Users } from "lucide-react";
import { BookingForm } from "@/components/forms/BookingForm";
import { DeliverooButton, JsonLd, OpeningHours, PageHero } from "@/components/ui";
import { londonNow } from "@/lib/hours";
import { IMG } from "@/lib/image-manifest";
import { breadcrumbJsonLd } from "@/lib/seo";
import { getSettingsSafe } from "@/lib/settings";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Book a Table",
  description:
    "Book a table at Thai Courtyard, East Molesey. Send a reservation request online and we'll confirm by phone or email. Open Tuesday to Saturday, 12:00–21:00.",
  alternates: { canonical: "/book" },
};

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
      <PageHero
        eyebrow="Reservations"
        title="Book a Table"
        intro="Join us for authentic Thai food in a warm, cosy setting. Send us your booking request and we'll confirm it as soon as possible."
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
          </div>
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-gold-deep" aria-hidden="true" />
              <h2 className="font-serif text-2xl font-semibold">Same day or large groups?</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-charcoal/70">
              For bookings today, parties of more than 12, or special celebrations, please give us a call and we&apos;ll
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
            <p className="mt-2 text-sm text-cream/75">Order online for collection, or get delivery through Deliveroo.</p>
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
    </>
  );
}
