import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bike,
  CalendarDays,
  ChefHat,
  Clock,
  HeartHandshake,
  MapPin,
  Phone,
  ShoppingBag,
  Star,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { DeliveryButton, DietaryBadges, OpeningHours, Ornament, SectionHeading, imgFromUrl, isUnoptimised } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { getMenu } from "@/lib/menu";
import { hasPriceRange, startingPrice } from "@/lib/menu-utils";
import { getRestaurantConfigSafe } from "@/lib/restaurant";
import { getSettingsSafe } from "@/lib/settings";
import type { MenuCategory } from "@/lib/types";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const VALUES = [
  {
    icon: ChefHat,
    title: "Freshly prepared",
    text: "Every dish is cooked to order in our kitchen, using quality ingredients and recipes we are proud of.",
  },
  {
    icon: HeartHandshake,
    title: "Warm hospitality",
    text: "A genuine welcome for every guest — from a relaxed weekday lunch to a special celebration.",
  },
  {
    icon: Users,
    title: "Made for everyone",
    text: "A welcoming dining room for couples, friends and families of all ages.",
  },
];

export default async function HomePage() {
  const [menu, settings, config] = await Promise.all([
    getMenu().catch((): MenuCategory[] => []),
    getSettingsSafe(),
    getRestaurantConfigSafe(),
  ]);
  const featured = menu
    .flatMap((c) => c.items)
    .filter((i) => i.featured && i.available)
    .slice(0, 6);
  const hero = imgFromUrl(config.heroImageUrl, `${config.name} — freshly prepared dishes`);
  const about = imgFromUrl(config.aboutImageUrl, `Inside ${config.name}`);
  const gallery = config.galleryImages.length
    ? config.galleryImages.map((src, i) => imgFromUrl(src, `From the kitchen at ${config.name} (${i + 1})`, 1200, 1200))
    : [hero, about];

  const ways = [
    {
      img: about,
      icon: UtensilsCrossed,
      title: "Dine with us",
      text: "Settle into our dining room for freshly prepared dishes served with warmth. Perfect for families, friends and date nights.",
      cta: (
        <Link href="/book" className="btn btn-gold w-full">
          <CalendarDays aria-hidden="true" />
          Book a Table
        </Link>
      ),
    },
    {
      img: hero,
      icon: ShoppingBag,
      title: "Order for collection",
      text: `Order online in under a minute and choose your collection time — ready from ${settings.leadTimeMinutes} minutes. Pay in the restaurant by cash or card.`,
      cta: (
        <Link href="/order" className="btn btn-gold w-full">
          <ShoppingBag aria-hidden="true" />
          Order Collection
        </Link>
      ),
    },
    ...(config.delivery.enabled
      ? [
          {
            img: gallery[0] ?? hero,
            icon: Bike,
            title: "Delivered to your door",
            text: config.delivery.notes || "Staying in tonight? Enjoy your favourites delivered to your home.",
            cta: <DeliveryButton delivery={config.delivery} className="w-full" />,
          },
        ]
      : [
          {
            img: gallery[0] ?? hero,
            icon: MapPin,
            title: "Find us",
            text: `You'll find us at ${config.addressLine}. Open ${config.hoursSummary}.`,
            cta: (
              <Link href="/contact" className="btn btn-gold w-full">
                <MapPin aria-hidden="true" />
                Contact & Directions
              </Link>
            ),
          },
        ]),
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-charcoal text-cream">
        <Image
          src={hero.src}
          alt={hero.alt}
          fill
          preload
          sizes="100vw"
          unoptimized={isUnoptimised(hero.src)}
          className="-z-20 object-cover"
        />
        <div
          className="absolute inset-0 -z-10 bg-linear-to-t from-charcoal via-charcoal/85 to-charcoal/35 lg:bg-linear-to-r lg:from-charcoal lg:via-charcoal/80 lg:to-charcoal/10"
          aria-hidden="true"
        />
        <div className="container-x flex min-h-[calc(100svh-4rem)] flex-col justify-end pt-28 pb-12 lg:min-h-[calc(100svh-5rem)] lg:justify-center lg:py-24">
          <div className="max-w-2xl animate-rise">
            {config.tagline ? <p className="eyebrow">{config.tagline}</p> : null}
            <h1 className="mt-3 font-serif text-5xl leading-[1.02] font-semibold text-cream sm:text-6xl lg:text-7xl">
              {config.heroHeadline || config.name}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-cream/85 sm:text-lg">{config.heroSubheadline || config.description}</p>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              <Link href="/order" className="btn btn-gold col-span-2 py-3.5 text-base sm:py-3 sm:text-sm">
                <ShoppingBag aria-hidden="true" />
                Order Collection
              </Link>
              <Link href="/book" className="btn btn-outline-light px-4">
                <CalendarDays aria-hidden="true" />
                Book a Table
              </Link>
              <Link href="/menu" className="btn btn-outline-light px-4">
                <UtensilsCrossed aria-hidden="true" />
                View Menu
              </Link>
              <DeliveryButton delivery={config.delivery} className="col-span-2" />
            </div>
          </div>
        </div>
      </section>

      {/* Info strip */}
      <section aria-label="Opening hours and location" className="border-y border-gold/20 bg-teak-dark text-cream">
        <div className="container-x grid gap-4 py-5 text-sm sm:grid-cols-3">
          <p className="flex items-center gap-3">
            <Clock className="h-5 w-5 shrink-0 text-gold-light" aria-hidden="true" />
            <span>
              <strong className="font-semibold">Open</strong> {config.hoursSummary}
            </span>
          </p>
          <a
            href={config.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 hover:text-gold-light"
          >
            <MapPin className="h-5 w-5 shrink-0 text-gold-light" aria-hidden="true" />
            {config.addressLine}
          </a>
          <a href={config.phoneHref} className="flex items-center gap-3 hover:text-gold-light">
            <Phone className="h-5 w-5 shrink-0 text-gold-light" aria-hidden="true" />
            {config.phoneDisplay}
          </a>
        </div>
      </section>

      {/* Welcome */}
      <section className="py-20 lg:py-28">
        <div className="container-x grid items-center gap-14 lg:grid-cols-2">
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-2xl shadow-teak/20">
              <Image
                src={(gallery[0] ?? hero).src}
                alt={(gallery[0] ?? hero).alt}
                fill
                sizes="(min-width: 1024px) 40vw, 90vw"
                unoptimized={isUnoptimised((gallery[0] ?? hero).src)}
                className="object-cover"
              />
            </div>
            <div className="absolute -right-2 -bottom-8 w-2/5 overflow-hidden rounded-3xl border-4 border-cream shadow-xl sm:-right-6">
              <div className="relative aspect-square">
                <Image
                  src={(gallery[1] ?? about).src}
                  alt={(gallery[1] ?? about).alt}
                  fill
                  sizes="(min-width: 1024px) 18vw, 40vw"
                  unoptimized={isUnoptimised((gallery[1] ?? about).src)}
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="eyebrow-dark">Welcome to {config.name}</p>
            <h2 className="mt-3 font-serif text-4xl leading-tight font-semibold sm:text-5xl">{config.tagline || `Welcome to ${config.name}`}</h2>
            <Ornament className="mt-5" />
            <p className="mt-6 text-lg leading-relaxed text-charcoal/75">{config.aboutText || config.description}</p>
            <ul className="mt-8 grid gap-5 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {VALUES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3 xl:flex-col">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold/15 text-gold-deep">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-semibold">{title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-charcoal/65">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/about" className="btn btn-dark">
                Our story <ArrowRight aria-hidden="true" />
              </Link>
              <Link href="/menu" className="btn btn-outline">
                Explore the menu
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Ways to enjoy */}
      <section className="relative isolate bg-charcoal py-20 text-cream lg:py-28">
        <div className="brand-pattern absolute inset-0 -z-10 opacity-70" aria-hidden="true" />
        <div className="container-x">
          <SectionHeading
            dark
            eyebrow="Dine in · Collect · At home"
            title="However you enjoy eating with us"
            intro="Join us in the restaurant, order online and collect, or plan your visit — the same freshly prepared dishes, whichever you choose."
          />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {ways.map(({ img, icon: Icon, title, text, cta }) => (
              <article
                key={title}
                className="flex flex-col overflow-hidden rounded-3xl bg-charcoal-soft ring-1 ring-gold/15 transition hover:ring-gold/40"
              >
                <div className="relative aspect-[4/3]">
                  <Image src={img.src} alt={img.alt} fill sizes="(min-width: 768px) 30vw, 100vw" unoptimized={isUnoptimised(img.src)} className="object-cover" />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-gold/15 text-gold-light">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-serif text-2xl font-semibold text-cream">{title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-cream/70">{text}</p>
                  <div className="mt-6">{cta}</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Signature dishes */}
      {featured.length > 0 ? (
        <section className="py-20 lg:py-28">
          <div className="container-x">
            <SectionHeading
              eyebrow="Chef's recommendations"
              title="Signature dishes"
              intro="A few of the favourites our guests come back for."
            />
            <div className="mt-14 grid items-center gap-12 lg:grid-cols-[1fr_1.15fr]">
              <div className="relative hidden aspect-[4/5] overflow-hidden rounded-[2rem] shadow-2xl shadow-teak/20 lg:block">
                <Image
                  src={(gallery[1] ?? hero).src}
                  alt={(gallery[1] ?? hero).alt}
                  fill
                  sizes="40vw"
                  unoptimized={isUnoptimised((gallery[1] ?? hero).src)}
                  className="object-cover"
                />
              </div>
              <ul className="divide-y divide-sand">
                {featured.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-5 py-5 first:pt-0">
                    <div>
                      <h3 className="font-serif text-2xl font-semibold">{item.name}</h3>
                      <DietaryBadges tags={item.dietary} className="mt-2" />
                      {item.description ? (
                        <p className="mt-2 text-sm leading-relaxed text-charcoal/70">{item.description}</p>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold text-teak">
                        {hasPriceRange(item) ? <span className="mr-1 text-xs font-normal text-charcoal/50">from</span> : null}
                        {formatPrice(startingPrice(item))}
                      </p>
                      <Link
                        href={`/order?item=${item.id}`}
                        className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-gold-deep hover:underline"
                        aria-label={`Order ${item.name} for collection`}
                      >
                        Order <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-12 flex flex-wrap justify-center gap-3">
              <Link href="/menu" className="btn btn-dark">
                View full menu
              </Link>
              <Link href="/order" className="btn btn-gold">
                <ShoppingBag aria-hidden="true" />
                Order Collection
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* Gallery */}
      <section className="bg-cream-dark py-20 lg:py-28">
        <div className="container-x">
          <SectionHeading
            eyebrow="From our kitchen"
            title={`A taste of ${config.name}`}
            intro="Fresh ingredients, generous portions and food cooked to order — every time."
          />
          <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4">
            {gallery.slice(0, 4).map((img, i) => (
              <div key={`${img.src}-${i}`} className="relative aspect-[3/4] overflow-hidden rounded-2xl">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  unoptimized={isUnoptimised(img.src)}
                  className="object-cover transition duration-700 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Google / Visit */}
      <section className="py-20 lg:py-28">
        <div className="container-x grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="relative isolate overflow-hidden rounded-[2rem] bg-charcoal p-8 text-cream sm:p-12">
            <div className="brand-pattern absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
            <p className="eyebrow">Find us on Google</p>
            <h2 className="mt-3 font-serif text-4xl leading-tight font-semibold">Loved your meal? Tell others about it</h2>
            <p className="mt-4 max-w-lg leading-relaxed text-cream/75">
              Your reviews help local diners discover us — and help our team keep getting better. Thank you for
              supporting your local restaurant.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={config.googleReviewUrl} target="_blank" rel="noopener noreferrer" className="btn btn-gold">
                <Star aria-hidden="true" />
                Leave a Google review
              </a>
              <a href={config.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-light">
                <MapPin aria-hidden="true" />
                View on Google Maps
              </a>
            </div>
          </div>
          <div className="card p-8">
            <h2 className="font-serif text-3xl font-semibold">Visit us</h2>
            <p className="mt-3 flex gap-3 text-charcoal/80">
              <MapPin className="mt-1 h-4 w-4 shrink-0 text-gold-deep" aria-hidden="true" />
              {config.addressLine}
            </p>
            <p className="mt-2 flex gap-3 text-charcoal/80">
              <Phone className="mt-1 h-4 w-4 shrink-0 text-gold-deep" aria-hidden="true" />
              <a href={config.phoneHref} className="font-semibold hover:underline">
                {config.phoneDisplay}
              </a>
            </p>
            <OpeningHours hours={config.openingHours} className="mt-4" />
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/book" className="btn btn-dark">
                <CalendarDays aria-hidden="true" />
                Book a Table
              </Link>
              <Link href="/contact" className="btn btn-outline">
                Find us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
