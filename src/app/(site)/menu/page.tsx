import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { CalendarDays, Info, ShoppingBag } from "lucide-react";
import { DeliveryButton, DietaryBadges, DietaryLegend, JsonLd, Ornament, PageHero, imgFromUrl, isUnoptimised } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { getMenu } from "@/lib/menu";
import { hasPriceRange, startingPrice } from "@/lib/menu-utils";
import { getRestaurantConfigSafe } from "@/lib/restaurant";
import { breadcrumbJsonLd, menuJsonLd } from "@/lib/seo";
import type { MenuGroup } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRestaurantConfigSafe();
  return {
    title: "Menu",
    description: `The ${config.name} menu — freshly prepared dishes with prices and dietary information. Order online for collection or book a table.`,
    alternates: { canonical: "/menu" },
  };
}

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

export default async function MenuPage() {
  const [menu, config] = await Promise.all([getMenu(), getRestaurantConfigSafe()]);
  const gallery = config.galleryImages.map((src, i) => imgFromUrl(src, `From the kitchen at ${config.name} (${i + 1})`, 1200, 900));

  return (
    <>
      <JsonLd data={menuJsonLd(menu, config)} />
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: "Home", path: "/" },
            { name: "Menu", path: "/menu" },
          ],
          config,
        )}
      />
      <PageHero
        eyebrow="Our menu"
        title={`${config.name} Menu`}
        intro="Freshly prepared dishes, cooked to order. Many dishes can be customised — just tell us what you need."
        image={imgFromUrl(config.heroImageUrl, `${config.name} dishes`)}
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

      <nav aria-label="Menu sections" className="sticky top-16 z-20 border-b border-sand bg-cream/95 backdrop-blur lg:top-20">
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
          Dietary indicators are provided as a guide only. Our kitchen handles nuts, gluten, shellfish and other
          allergens, so we cannot guarantee that any dish is completely allergen free. Please inform us of any
          allergies or dietary requirements before ordering and a member of our team will be happy to advise.
        </p>
      </section>

      {menu.length === 0 ? (
        <section className="container-x py-20 text-center">
          <h2 className="font-serif text-3xl font-semibold">Our menu is coming soon</h2>
          <p className="mt-3 text-charcoal/70">
            We&apos;re putting the finishing touches to our menu. Please call us on {config.phoneDisplay} in the meantime.
          </p>
        </section>
      ) : null}

      {menu.map((category, index) => (
        <Fragment key={category.id}>
          <section id={`section-${category.id}`} aria-labelledby={`heading-${category.id}`} className="scroll-mt-36 py-12 lg:py-16">
            <div className="container-x">
              <div className="text-center">
                <h2 id={`heading-${category.id}`} className="font-serif text-4xl font-semibold sm:text-5xl">
                  {category.name}
                </h2>
                <Ornament className="mx-auto mt-4" />
                {category.description ? <p className="mx-auto mt-4 max-w-2xl text-charcoal/70">{category.description}</p> : null}
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
                    {item.description ? <p className="mt-2 text-sm leading-relaxed text-charcoal/70">{item.description}</p> : null}
                    {item.ownGroups.map((g) => (
                      <p key={g.id} className="mt-1.5 text-xs leading-relaxed text-charcoal/60">
                        <span className="font-semibold text-charcoal/75">{g.name}:</span> {choiceList(g)}
                      </p>
                    ))}
                    {!item.available ? <p className="mt-1 text-xs font-semibold text-chili">Currently unavailable</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          </section>
          {index % 2 === 1 && index < menu.length - 1 && gallery.length >= 3 ? (
            <div className="container-x py-4">
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {gallery.slice(0, 3).map((img, i) => (
                  <div key={`${img.src}-${i}`} className="relative aspect-[3/4] overflow-hidden rounded-2xl sm:aspect-[4/3]">
                    <Image src={img.src} alt={img.alt} fill sizes="(min-width: 1280px) 400px, 33vw" unoptimized={isUnoptimised(img.src)} className="object-cover transition duration-700 hover:scale-105" />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </Fragment>
      ))}

      <section className="relative isolate overflow-hidden bg-charcoal py-16 text-center text-cream lg:py-20">
        <div className="brand-pattern absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
        <div className="container-x">
          <p className="eyebrow">Hungry already?</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">Order for collection in under a minute</h2>
          <p className="mx-auto mt-4 max-w-xl text-cream/75">
            Choose your dishes and collection time online — pay in the restaurant when you collect.
            {config.delivery.enabled ? " Prefer delivery? Use the delivery link below." : ""}
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
            <DeliveryButton delivery={config.delivery} />
          </div>
        </div>
      </section>
    </>
  );
}
