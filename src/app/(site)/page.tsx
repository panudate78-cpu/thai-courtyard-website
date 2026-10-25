import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
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
import { DeliverooButton, DietaryBadges, OpeningHours, Ornament, SectionHeading } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { IMG, type SiteImage } from "@/lib/image-manifest";
import { getMenu } from "@/lib/menu";
import { hasPriceRange, startingPrice } from "@/lib/menu-utils";
import { getSettingsSafe } from "@/lib/settings";
import { SITE } from "@/lib/site";
import type { MenuCategory } from "@/lib/types";
import { getActiveOffers } from "@/lib/offers";

export const metadata: Metadata = { alternates: { canonical: "/" } };
export const dynamic = "force-dynamic";

const GALLERY: { img: SiteImage; className: string }[] = [
  { img: IMG.noodles, className: "row-span-2" },
  { img: IMG.satay, className: "md:col-span-2" },
  { img: IMG.seabass, className: "row-span-2" },
  { img: IMG.redCurry, className: "" },
  { img: IMG.dumplings, className: "" },
  { img: IMG.lemongrass, className: "md:col-span-2" },
  { img: IMG.beefSalad, className: "" },
  { img: IMG.salad, className: "" },
];

const VALUES = [
  {
    icon: ChefHat,
    title: "Freshly prepared",
    text: "Every dish is cooked to order, balancing the classic Thai flavours of hot, sour, salty and sweet.",
  },
  {
    icon: HeartHandshake,
    title: "Genuine Thai hospitality",
    text: "A warm welcome for every guest — from a relaxed weekday lunch to a special celebration.",
  },
  {
    icon: Users,
    title: "Cosy & family-friendly",
    text: "A welcoming dining room for couples, friends and families of all ages.",
  },
];

export default async function HomePage() {
  const [menu, settings, offers] = await Promise.all([
    getMenu().catch((): MenuCategory[] => []),
    getSettingsSafe(),
    getActiveOffers().catch(() => []),
  ]);
  const featured = menu
    .flatMap((c) => c.items)
    .filter((i) => i.featured && i.available)
    .slice(0, 6);

  const ways = [
    {
      img: IMG.thaiSpread,
      icon: UtensilsCrossed,
      title: "Dine with us",
      text: "Settle into our cosy dining room for authentic Thai dishes served with warmth. Perfect for families, friends and date nights.",
      cta: (
        <Link href="/book" className="btn btn-gold w-full">
          <CalendarDays aria-hidden="true" />
          Book a Table
        </Link>
      ),
    },
    {
      img: IMG.padThai,
      icon: ShoppingBag,
      title: "Order for collection",
      text: `Order online in under a minute and choose your collection time — ready from ${settings.leadTimeMinutes} minutes. Pay in restaurant by cash or card.`,
      cta: (
        <Link href="/order" className="btn btn-gold w-full">
          <ShoppingBag aria-hidden="true" />
          Order Collection
        </Link>
      ),
    },
    {
      img: IMG.crispy,
      icon: MapPin,
      title: "Delivered to your door",
      text: "Staying in tonight? Enjoy your Thai Courtyard favourites delivered to your home through Deliveroo.",
      cta: <DeliverooButton className="w-full" label="Order Delivery on Deliveroo" />,
    },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-charcoal text-cream">
        <Image
          src={IMG.heroSpread.src}
          alt={IMG.heroSpread.alt}
          fill
          preload
          sizes="100vw"
          placeholder="blur"
          blurDataURL={IMG.heroSpread.blurDataURL}
          className="-z-20 object-cover"
        />
        <div
          className="absolute inset-0 -z-10 bg-linear-to-t from-charcoal via-charcoal/85 to-charcoal/35 lg:bg-linear-to-r lg:from-charcoal lg:via-charcoal/80 lg:to-charcoal/10"
          aria-hidden="true"
        />
        <div className="container-x flex min-h-[calc(100svh-4rem)] flex-col justify-end pt-28 pb-12 lg:min-h-[calc(100svh-5rem)] lg:justify-center lg:py-24">
          <div className="max-w-2xl animate-rise">
            <p className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-charcoal/60 px-4 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-gold-light uppercase">
              <Star className="h-3.5 w-3.5" aria-hidden="true" />
              {SITE.newManagement}
            </p>
            <p className="eyebrow mt-6">{SITE.tagline}</p>
            <h1 className="mt-3 font-serif text-5xl leading-[1.02] font-semibold text-cream sm:text-6xl lg:text-7xl">
              Authentic Thai Cuisine
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-cream/85 sm:text-lg">
              Enjoy freshly prepared Thai favourites for dine-in or collection. Bringing warmth, flavour and genuine Thai hospitality to every visit.
            </p>
            <p className="mt-4 max-w-xl rounded-xl border border-gold/30 bg-charcoal/50 px-4 py-3 text-sm text-cream/90">
            🍷 Bring Your Own Alcohol: Thai Courtyard does not currently hold an alcohol licence. Guests are welcome to bring their own alcoholic beverages. Corkage charges apply. Please ask a member of staff for details.
            </p>
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
              <DeliverooButton className="col-span-2" label="Order Delivery on Deliveroo" />
            </div>
          </div>
        </div>
      </section>

      {offers.length > 0 ? (
        <section aria-label="Current offers" className="bg-cream-dark py-10 sm:py-14">
          <div className="container-x">
            <p className="eyebrow-dark">Offers &amp; promotions</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {offers.map((offer) => (
                <article key={offer.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-teak/10">
                  {offer.imageData ? (
                    // Uploaded promotion images are stored with the offer record.
                    <Image src={offer.imageData} alt="" width={960} height={480} unoptimized className="h-48 w-full object-cover" />
                  ) : null}
                  <div className="p-5">
                    <h2 className="font-serif text-2xl font-semibold">{offer.title}</h2>
                    {offer.description ? <p className="mt-2 text-sm leading-6 text-black/65">{offer.description}</p> : null}
                    <a
                      href={offer.ctaLink}
                      className="btn btn-gold mt-5"
                      target={offer.ctaLink.startsWith("http") ? "_blank" : undefined}
                      rel={offer.ctaLink.startsWith("http") ? "noopener noreferrer" : undefined}
                    >
                      {offer.ctaText}
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Info strip */}
      <section aria-label="Opening hours and location" className="border-y border-gold/20 bg-teak-dark text-cream">
        <div className="container-x grid gap-4 py-5 text-sm sm:grid-cols-3">
          <p className="flex items-center gap-3">
            <Clock className="h-5 w-5 shrink-0 text-gold-light" aria-hidden="true" />
            <span>
              <strong className="font-semibold">Open</strong> {SITE.hoursSummary}
            </span>
          </p>
          <a
            href={SITE.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 hover:text-gold-light"
          >
            <MapPin className="h-5 w-5 shrink-0 text-gold-light" aria-hidden="true" />
            {SITE.addressLine}
          </a>
          <a href={SITE.phoneHref} className="flex items-center gap-3 hover:text-gold-light">
            <Phone className="h-5 w-5 shrink-0 text-gold-light" aria-hidden="true" />
            {SITE.phoneDisplay}
          </a>
        </div>
      </section>

      {/* New management / welcome */}
      <section className="py-20 lg:py-28">
        <div className="container-x grid items-center gap-14 lg:grid-cols-2">
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-2xl shadow-teak/20">
              <Image
                src={IMG.padThai.src}
                alt={IMG.padThai.alt}
                fill
                sizes="(min-width: 1024px) 40vw, 90vw"
                placeholder="blur"
                blurDataURL={IMG.padThai.blurDataURL}
                className="object-cover"
              />
            </div>
            <div className="absolute -right-2 -bottom-8 w-2/5 overflow-hidden rounded-3xl border-4 border-cream shadow-xl sm:-right-6">
              <div className="relative aspect-square">
                <Image
                  src={IMG.greenCurry.src}
                  alt={IMG.greenCurry.alt}
                  fill
                  sizes="(min-width: 1024px) 18vw, 40vw"
                  placeholder="blur"
                  blurDataURL={IMG.greenCurry.blurDataURL}
                  className="object-cover"
                />
              </div>
            </div>
            
          </div>

          <div>
            <p className="eyebrow-dark">Welcome to Thai Courtyard</p>
            <h2 className="mt-3 font-serif text-4xl leading-tight font-semibold sm:text-5xl">
              
            </h2>
            <Ornament className="mt-5" />
            <p className="mt-6 text-lg leading-relaxed text-charcoal/75">
              Thai Courtyard is a warm, cosy and family-friendly Thai restaurant on Walton Road, in the heart of East
              Molesey. Authentic cooking, freshly prepared dishes and genuine Thai hospitality.
            </p>
            <p className="mt-4 leading-relaxed text-charcoal/70">
              From fragrant curries and sizzling wok-fried dishes to zesty salads and our chef&apos;s signature plates,
              every dish celebrates the flavours of Thailand — lemongrass, galangal, holy basil, lime and chilli. Join us
              for a relaxed meal, book a table for a celebration, or pick up your favourites to enjoy at home.
            </p>
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
        <div className="thai-pattern absolute inset-0 -z-10 opacity-70" aria-hidden="true" />
        <div className="container-x">
          <SectionHeading
            dark
            eyebrow="Dine in · Collect · Delivery"
            title="However you enjoy Thai food"
            intro="Join us in the restaurant, order online and collect, or have dinner delivered — the same freshly prepared dishes, whichever you choose."
          />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {ways.map(({ img, icon: Icon, title, text, cta }) => (
              <article
                key={title}
                className="flex flex-col overflow-hidden rounded-3xl bg-charcoal-soft ring-1 ring-gold/15 transition hover:ring-gold/40"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(min-width: 768px) 30vw, 100vw"
                    placeholder="blur"
                    blurDataURL={img.blurDataURL}
                    className="object-cover"
                  />
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
              intro="A few of the authentic favourites our guests come back for."
            />
            <div className="mt-14 grid items-center gap-12 lg:grid-cols-[1fr_1.15fr]">
              <div className="relative hidden aspect-[4/5] overflow-hidden rounded-[2rem] shadow-2xl shadow-teak/20 lg:block">
                <Image
                  src={IMG.duck.src}
                  alt={IMG.duck.alt}
                  fill
                  sizes="40vw"
                  placeholder="blur"
                  blurDataURL={IMG.duck.blurDataURL}
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
            title="A taste of Thai Courtyard"
            intro="Vibrant colours, fresh herbs and bold, balanced flavours — cooked to order, every time."
          />
          <div className="mt-12 grid grid-flow-dense auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[210px] md:grid-cols-4 lg:auto-rows-[240px]">
            {GALLERY.map(({ img, className }) => (
              <div key={img.src} className={`relative overflow-hidden rounded-2xl ${className}`}>
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  placeholder="blur"
                  blurDataURL={img.blurDataURL}
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
            <div className="thai-pattern absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
            <p className="eyebrow">Find us on Google</p>
            <h2 className="mt-3 font-serif text-4xl leading-tight font-semibold">Loved your meal? Tell others about it</h2>
            <p className="mt-4 max-w-lg leading-relaxed text-cream/75">
              Your reviews help local diners discover authentic Thai food in East Molesey — and help our new team keep
              getting better. Thank you for supporting your local Thai restaurant.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={SITE.googleReviewUrl} target="_blank" rel="noopener noreferrer" className="btn btn-gold">
                <Star aria-hidden="true" />
                Leave a Google review
              </a>
              <a href={SITE.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-light">
                <MapPin aria-hidden="true" />
                View on Google Maps
              </a>
            </div>
          </div>
          <div className="card p-8">
            <h2 className="font-serif text-3xl font-semibold">Visit us</h2>
            <p className="mt-3 flex gap-3 text-charcoal/80">
              <MapPin className="mt-1 h-4 w-4 shrink-0 text-gold-deep" aria-hidden="true" />
              {SITE.addressLine}
            </p>
            <p className="mt-2 flex gap-3 text-charcoal/80">
              <Phone className="mt-1 h-4 w-4 shrink-0 text-gold-deep" aria-hidden="true" />
              <a href={SITE.phoneHref} className="font-semibold hover:underline">
                {SITE.phoneDisplay}
              </a>
            </p>
            <OpeningHours className="mt-5" />
            <Link href="/contact" className="btn btn-outline mt-6 w-full">
              Contact &amp; directions
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
