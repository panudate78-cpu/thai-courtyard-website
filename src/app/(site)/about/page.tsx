import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, ChefHat, HeartHandshake, Leaf, ShoppingBag, Users } from "lucide-react";
import { JsonLd, Ornament, PageHero, SectionHeading } from "@/components/ui";
import { IMG } from "@/lib/image-manifest";
import { breadcrumbJsonLd } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "The story of Thai Courtyard, East Molesey — a cosy Thai restaurant under new management since April 2026, offering authentic cuisine, warm hospitality and freshly prepared dishes.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  {
    icon: ChefHat,
    title: "Freshly prepared",
    text: "Dishes are cooked to order in our kitchen, so every curry, stir-fry and salad arrives fragrant, vibrant and full of flavour.",
  },
  {
    icon: Leaf,
    title: "Authentic flavours",
    text: "Lemongrass, galangal, kaffir lime, holy basil and chilli — the true tastes of Thailand, balanced the traditional way.",
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

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />
      <PageHero
        eyebrow="Our story"
        title="About Thai Courtyard"
        intro="A cosy Thai restaurant under new management since April 2026, offering authentic cuisine, warm hospitality and freshly prepared dishes."
        image={IMG.thaiSpread}
      />

      <section className="py-20 lg:py-28">
        <div className="container-x grid items-center gap-14 lg:grid-cols-2">
          <div>
            <p className="eyebrow-dark">{SITE.newManagement}</p>
            <h2 className="mt-3 font-serif text-4xl leading-tight font-semibold sm:text-5xl">
              Traditional Thai hospitality, right here in East Molesey
            </h2>
            <Ornament className="mt-5" />
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-charcoal/75">
              <p>
                Thai Courtyard is a cosy Thai restaurant under new management since April 2026, offering authentic
                cuisine, warm hospitality and freshly prepared dishes.
              </p>
              <p>
                Tucked away on Walton Road, a short stroll from Hampton Court, our restaurant brings together traditional
                Thai hospitality and the relaxed comfort of modern British dining. It&apos;s the kind of place where
                neighbours become regulars, and every guest is welcomed like family.
              </p>
              <p>
                Our new team took over with a simple promise: honour the classic recipes our guests love, cook every dish
                fresh, and make each visit feel special — whether you are joining us for a quiet weekday lunch, a family
                celebration or picking up dinner on your way home.
              </p>
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
              <Image
                src={IMG.heroSpread.src}
                alt={IMG.heroSpread.alt}
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                placeholder="blur"
                blurDataURL={IMG.heroSpread.blurDataURL}
                className="object-cover"
              />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-3xl">
              <Image
                src={IMG.seabass.src}
                alt={IMG.seabass.alt}
                fill
                sizes="(min-width: 1024px) 22vw, 50vw"
                placeholder="blur"
                blurDataURL={IMG.seabass.blurDataURL}
                className="object-cover"
              />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-3xl">
              <Image
                src={IMG.duck.src}
                alt={IMG.duck.alt}
                fill
                sizes="(min-width: 1024px) 22vw, 50vw"
                placeholder="blur"
                blurDataURL={IMG.duck.blurDataURL}
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative isolate bg-charcoal py-20 text-cream lg:py-28">
        <div className="thai-pattern absolute inset-0 -z-10 opacity-70" aria-hidden="true" />
        <div className="container-x">
          <SectionHeading
            dark
            eyebrow="What we stand for"
            title="The Thai Courtyard way"
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
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[IMG.noodles, IMG.redCurry, IMG.satay, IMG.padThai].map((img) => (
              <div key={img.src} className="relative aspect-[3/4] overflow-hidden rounded-2xl">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  placeholder="blur"
                  blurDataURL={img.blurDataURL}
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          <div className="mx-auto mt-14 max-w-2xl text-center">
            <h2 className="font-serif text-4xl font-semibold sm:text-5xl">We can&apos;t wait to welcome you</h2>
            <p className="mt-4 text-charcoal/70">
              Open {SITE.hoursSummary} at {SITE.addressLine}. Call us on{" "}
              <a href={SITE.phoneHref} className="font-semibold text-teak hover:underline">
                {SITE.phoneDisplay}
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
