import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { CalendarDays, Info, ShoppingBag } from "lucide-react";
import { DeliverooButton, DietaryBadges, DietaryLegend, JsonLd, Ornament, PageHero } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { IMG, type SiteImage } from "@/lib/image-manifest";
import { getMenu } from "@/lib/menu";
import { hasPriceRange, startingPrice } from "@/lib/menu-utils";
import { breadcrumbJsonLd, menuJsonLd } from "@/lib/seo";
import type { MenuGroup } from "@/lib/types";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "The Thai Courtyard menu: starters, Tom Yum and Tom Kha soups, red, green and Phanaeng curries, stir-fries, Thai salads, Pad Thai, noodles and chef's specials — with prices, protein choices and dietary information.",
  alternates: { canonical: "/menu" },
};

const PHOTO_BANDS: SiteImage[][] = [
  [IMG.satay, IMG.greenCurry, IMG.dumplings],
  [IMG.noodles, IMG.redCurry, IMG.garlicPepper],
  [IMG.squid, IMG.beefSalad, IMG.wings],
  [IMG.lemongrass, IMG.stirFry, IMG.rolls],
];

function choiceList(group: MenuGroup) {
  return group.choices
    .filter((c) => c.available)
    .map((c) => (c.pricePence > 0 ? `${c.name} +${formatPrice(c.pricePence)}` : c.name))
    .join(" · ");
}

function ChoicesPanel({ groups }: { groups: MenuGroup[] }) {
  if (!groups.length) return null;
  return (
    <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-gold/35 bg-white/80 p-5 text-sm shadow-sm">
      {groups.map((g) => (
        <div key={g.id} className="py-1.5 sm:flex sm:gap-4">
          <p className="shrink-0 font-semibold text-charcoal sm:w-44">
            {g.name}
            {!g.required ? <span className="font-normal text-charcoal/50"> (optional)</span> : null}
          </p>
          <p className="text-charcoal/70">{choiceList(g)}</p>
        </div>
      ))}
    </div>
  );
}

function PhotoBand({ images }: { images: SiteImage[] }) {
  return (
    <div className="container-x py-4">
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {images.map((img) => (
          <div key={img.src} className="relative aspect-[3/4] overflow-hidden rounded-2xl sm:aspect-[4/3]">
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="(min-width: 1280px) 400px, 33vw"
              placeholder="blur"
              blurDataURL={img.blurDataURL}
              className="object-cover transition duration-700 hover:scale-105"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function MenuPage() {
  const menu = await getMenu();

  return (
    <>
      <JsonLd data={menuJsonLd(menu)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Menu", path: "/menu" },
        ])}
      />
      <PageHero
        eyebrow="Our menu"
        title="The Thai Courtyard Menu"
        intro="Authentic Thai dishes, freshly prepared to order. Many dishes can be made with your choice of protein and spice level."
        image={IMG.thaiSpread}
      >
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/order" className="btn btn-gold">
            <ShoppingBag aria-hidden="true" />
            Order Collection
          </Link>
          <Link href="/book" className="btn btn-outline-light">
            <CalendarDays aria-hidden="true" />
            Book a Table
          </Link>
        </div>
      </PageHero>

      <nav
        aria-label="Menu sections"
        className="sticky top-16 z-20 border-b border-sand bg-cream/95 backdrop-blur lg:top-20"
      >
        <div className="container-x no-scrollbar flex gap-2 overflow-x-auto py-3">
          {menu.map((c) => (
            <a key={c.id} href={`#section-${c.id}`} className="chip">
              {c.name}
            </a>
          ))}
        </div>
      </nav>

      <section className="container-x pt-10" aria-label="Dietary key">
        <DietaryLegend />
        <p className="mx-auto mt-5 flex max-w-3xl items-start justify-center gap-2 text-center text-xs leading-relaxed text-charcoal/60">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Dietary indicators are a guide only. Some dishes contain fish sauce or oyster sauce, and our kitchen handles
          nuts, gluten, shellfish and other allergens. Please tell us about any allergies when ordering.
        </p>
      </section>

      {menu.map((category, index) => (
        <Fragment key={category.id}>
          <section id={`section-${category.id}`} aria-labelledby={`heading-${category.id}`} className="scroll-mt-36 py-12 lg:py-16">
            <div className="container-x">
              <div className="text-center">
                <h2 id={`heading-${category.id}`} className="font-serif text-4xl font-semibold sm:text-5xl">
                  {category.name}
                </h2>
                <Ornament className="mx-auto mt-4" />
                {category.description ? (
                  <p className="mx-auto mt-4 max-w-2xl text-charcoal/70">{category.description}</p>
                ) : null}
              </div>
              <ChoicesPanel groups={category.groups} />
              <ul className="mt-10 grid gap-x-14 gap-y-7 md:grid-cols-2">
                {category.items.map((item) => (
                  <li key={item.id} className={item.available ? "" : "opacity-60"}>
                    <div className="flex items-baseline gap-3">
                      <h3 className="font-serif text-xl font-semibold text-charcoal sm:text-2xl">{item.name}</h3>
                      <span className="min-w-6 flex-1 translate-y-[-4px] border-b border-dotted border-teak/35" aria-hidden="true" />
                      <p className="shrink-0 font-semibold text-teak">
                        {hasPriceRange(item) ? <span className="mr-1 text-xs font-normal text-charcoal/50">from</span> : null}
                        {formatPrice(startingPrice(item))}
                      </p>
                    </div>
                    <DietaryBadges tags={item.dietary} className="mt-2" />
                    {item.description ? (
                      <p className="mt-2 text-sm leading-relaxed text-charcoal/70">{item.description}</p>
                    ) : null}
                    {item.ownGroups.map((g) => (
                      <p key={g.id} className="mt-1.5 text-xs leading-relaxed text-charcoal/60">
                        <span className="font-semibold text-charcoal/75">{g.name}:</span> {choiceList(g)}
                      </p>
                    ))}
                    {!item.available ? (
                      <p className="mt-1 text-xs font-semibold text-chili">Currently unavailable</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </section>
          {index % 2 === 1 && index < menu.length - 1 ? (
            <PhotoBand images={PHOTO_BANDS[Math.floor(index / 2) % PHOTO_BANDS.length]} />
          ) : null}
        </Fragment>
      ))}

      <section className="relative isolate overflow-hidden bg-charcoal py-16 text-center text-cream lg:py-20">
        <div className="thai-pattern absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
        <div className="container-x">
          <p className="eyebrow">Hungry already?</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">Order for collection in under a minute</h2>
          <p className="mx-auto mt-4 max-w-xl text-cream/75">
            Choose your dishes and collection time online — pay in restaurant when you collect. Prefer delivery? Find us on
            Deliveroo.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/order" className="btn btn-gold">
              <ShoppingBag aria-hidden="true" />
              Order Collection
            </Link>
            <Link href="/book" className="btn btn-outline-light">
              <CalendarDays aria-hidden="true" />
              Book a Table
            </Link>
            <DeliverooButton />
          </div>
        </div>
      </section>
    </>
  );
}
