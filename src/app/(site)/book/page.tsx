import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Phone, ShoppingBag, Users } from "lucide-react";
import { BookingForm } from "@/components/forms/BookingForm";
import { DeliveryButton, JsonLd, OpeningHours, PageHero, imgFromUrl } from "@/components/ui";
import { londonNow, serialiseHours } from "@/lib/hours";
import { getHolidayExceptions, getRestaurantConfigSafe } from "@/lib/restaurant";
import { breadcrumbJsonLd } from "@/lib/seo";
import { getSettingsSafe } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRestaurantConfigSafe();
  return {
    title: "Book a Table",
    description: `Book a table at ${config.fullName}. Send a reservation request online and we'll confirm by phone or email. Open ${config.hoursSummary}.`,
    alternates: { canonical: "/book" },
  };
}

export default async function BookPage() {
  const [settings, config, holidays] = await Promise.all([getSettingsSafe(), getRestaurantConfigSafe(), getHolidayExceptions()]);
  const today = londonNow().date;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: "Home", path: "/" },
            { name: "Book a Table", path: "/book" },
          ],
          config,
        )}
      />
      <PageHero
        eyebrow="Reservations"
        title="Book a Table"
        intro="Join us for freshly prepared food in a warm, welcoming setting. Send us your booking request and we'll confirm it as soon as possible."
        image={imgFromUrl(config.aboutImageUrl, `The dining room at ${config.name}`)}
      />
      <section className="container-x grid gap-10 py-14 lg:grid-cols-[1.3fr_1fr] lg:py-20">
        <BookingForm
          today={today}
          closedDates={settings.closedDates}
          openingHours={serialiseHours(config.openingHours)}
          holidays={holidays}
          phoneDisplay={config.phoneDisplay}
          hoursSummary={config.hoursSummary}
        />
        <aside className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-gold-deep" aria-hidden="true" />
              <h2 className="font-serif text-2xl font-semibold">Opening hours</h2>
            </div>
            <OpeningHours hours={config.openingHours} className="mt-3" />
          </div>
          {config.collection.instructions ? (
            <div className="card p-6">
              <h2 className="font-serif text-2xl font-semibold">Good to know</h2>
              <p className="mt-3 text-sm leading-relaxed text-charcoal/70">{config.collection.instructions}</p>
            </div>
          ) : null}
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-gold-deep" aria-hidden="true" />
              <h2 className="font-serif text-2xl font-semibold">Same day or large groups?</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-charcoal/70">
              For bookings today, parties of more than 8, or special celebrations, please give us a call and we&apos;ll
              do our very best to look after you.
            </p>
            <a href={config.phoneHref} className="btn btn-dark mt-5 w-full">
              <Phone aria-hidden="true" />
              Call {config.phoneDisplay}
            </a>
          </div>
          <div className="relative isolate overflow-hidden rounded-2xl bg-charcoal p-6 text-cream">
            <div className="brand-pattern absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
            <h2 className="font-serif text-2xl font-semibold">Eating at home tonight?</h2>
            <p className="mt-2 text-sm text-cream/75">
              Order online for collection{config.delivery.enabled ? ", or get delivery to your door" : ""}.
            </p>
            <div className="mt-5 grid gap-3">
              <Link href="/order" className="btn btn-gold">
                <ShoppingBag aria-hidden="true" />
                Order Collection
              </Link>
              <DeliveryButton delivery={config.delivery} />
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}
