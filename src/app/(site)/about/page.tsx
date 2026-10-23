import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, ChefHat, HeartHandshake, Leaf, ShoppingBag, Users } from "lucide-react";
import { JsonLd, Ornament, PageHero, SectionHeading, imgFromUrl, isUnoptimised } from "@/components/ui";
import { getRestaurantConfigSafe } from "@/lib/restaurant";
import { breadcrumbJsonLd } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRestaurantConfigSafe();
  return {
    title: "About Us",
    description: `The story of ${config.fullName} — ${config.description}`,
    alternates: { canonical: "/about" },
  };
}

const VALUES = [
  {
    icon: ChefHat,
    title: "Freshly prepared",
    text: "Dishes are cooked to order in our kitchen, so everything arrives fresh, hot and full of flavour.",
  },
  {
    icon: Leaf,
    title: "Quality ingredients",
    text: "We choose ingredients with care and let them shine — simple food, done properly.",
  },
  {
    icon: HeartHandshake,
    title: "Warm hospitality",
    text: "We believe great food tastes even better when it is served with a genuine smile and attentive, friendly service.",
  },
  {
    icon: Users,
    title: "Made for everyone",
    text: "A cosy, family-friendly restaurant where couples, friends, families and little ones are all made to feel at home.",
  },
];

export default async function AboutPage() {
  const config = await getRestaurantConfigSafe();
  const hero = imgFromUrl(config.heroImageUrl, `Inside ${config.name}`);
  const about = imgFromUrl(config.aboutImageUrl, `The dining room at ${config.name}`);
  const gallery = config.galleryImages.map((src, i) => imgFromUrl(src, `From the kitchen at ${config.name} (${i + 1})`, 1200, 1200));
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
          ],
          config,
        )}
      />
      <PageHero eyebrow="Our story" title={`About ${config.name}`} intro={config.description} image={hero} />

      <section className="py-20 lg:py-28">
        <div className="container-x grid items-center gap-14 lg:grid-cols-2">
          <div>
            <h2 className="mt-3 font-serif text-4xl leading-tight font-semibold sm:text-5xl">
              Warm hospitality{config.address.locality ? `, right here in ${config.address.locality}` : ""}
            </h2>
            <Ornament className="mt-5" />
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-charcoal/75">
              {config.aboutText.split(/\n+/).filter(Boolean).map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/book" className="btn btn-dark">
                <CalendarDays aria-hidden="true" />
                Book a Table
              </Link>
              <Link href="/order" className="btn btn-gold">
                <ShoppingBag aria-hidden="true" />
                Order Collection
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative col-span-2 aspect-[16/10] overflow-hidden rounded-[2rem] shadow-xl shadow-teak/15">
              <Image src={hero.src} alt={hero.alt} fill sizes="(min-width: 1024px) 45vw, 100vw" unoptimized={isUnoptimised(hero.src)} className="object-cover" />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-3xl">
              <Image src={(gallery[0] ?? about).src} alt={(gallery[0] ?? about).alt} fill sizes="(min-width: 1024px) 22vw, 50vw" unoptimized={isUnoptimised((gallery[0] ?? about).src)} className="object-cover" />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-3xl">
              <Image src={(gallery[1] ?? about).src} alt={(gallery[1] ?? about).alt} fill sizes="(min-width: 1024px) 22vw, 50vw" unoptimized={isUnoptimised((gallery[1] ?? about).src)} className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="relative isolate bg-charcoal py-20 text-cream lg:py-28">
        <div className="brand-pattern absolute inset-0 -z-10 opacity-70" aria-hidden="true" />
        <div className="container-x">
          <SectionHeading
            dark
            eyebrow="What we stand for"
            title={`The ${config.name} way`}
            intro="Four simple things guide everything we do, from the kitchen to your table."
          />
          <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-3xl bg-charcoal-soft p-7 ring-1 ring-gold/15">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-gold/15 text-gold-light">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-serif text-2xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cream/70">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="container-x">
          {gallery.length ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {gallery.slice(0, 4).map((img, i) => (
                <div key={`${img.src}-${i}`} className="relative aspect-[3/4] overflow-hidden rounded-2xl">
                  <Image src={img.src} alt={img.alt} fill sizes="(min-width: 768px) 25vw, 50vw" unoptimized={isUnoptimised(img.src)} className="object-cover" />
                </div>
              ))}
            </div>
          ) : null}
          <div className="mx-auto mt-14 max-w-2xl text-center">
            <h2 className="font-serif text-4xl font-semibold sm:text-5xl">We can&apos;t wait to welcome you</h2>
            <p className="mt-4 text-charcoal/70">
              Open {config.hoursSummary} at {config.addressLine}. Call us on{" "}
              <a href={config.phoneHref} className="font-semibold text-teak hover:underline">
                {config.phoneDisplay}
              </a>
              .
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/menu" className="btn btn-dark">
                View the menu
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
