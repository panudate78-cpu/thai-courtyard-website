import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { CalendarDays, Info, ShoppingBag } from "lucide-react";
import { AllergenBadges, AllergenLegend, DeliverooButton, DietaryBadges, DietaryLegend, JsonLd, Ornament, PageHero } from "@/components/ui";
import { FaqSection } from "@/components/site/SeoSections";
import { formatPrice } from "@/lib/format";
import { IMG, type SiteImage } from "@/lib/image-manifest";
import { getMenu } from "@/lib/menu";
import { hasPriceRange, startingPrice } from "@/lib/menu-utils";
import { breadcrumbJsonLd, faqJsonLd, menuJsonLd } from "@/lib/seo";
import type { MenuGroup } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { getResolvedSeo } = await import("@/lib/seo-resolve");
    const seo = await getResolvedSeo("/menu");
    if (seo) {
      return {
        title: seo.title,
        description: seo.description,
        alternates: { canonical: "/menu" },
        openGraph: {
          title: seo.ogTitle || seo.title,
          description: seo.ogDescription || seo.description,
          url: "/menu",
          images: seo.ogImage ? [{ url: seo.ogImage }] : ["/opengraph-image", "/images/thai-spread.jpg"],
        },
        twitter: {
          card: "summary_large_image",
          title: seo.ogTitle || seo.title,
          description: seo.ogDescription || seo.description,
          images: seo.ogImage ? [seo.ogImage] : ["/opengraph-image"],
        },
      };
    }
  } catch {}
  return {
    title: "Menu",
    description:
      "The Demo Restaurant menu — starters, soups, curries, stir-fries, salads, noodles & chef's specials in Sample Town, Surrey KT8. Prices, protein choices, BYOB. Order for collection or dine in.",
    alternates: { canonical: "/menu" },
    openGraph: {
      title: "Demo Restaurant Menu | Sample Town • Sample Town",
      description: "Freshly cooked Thai favourites: red, green & Phanaeng curries, Pad Thai, stir-fries, Thai salads. Dine in or order for collection.",
      url: "/menu",
      images: ["/opengraph-image", "/images/thai-spread.jpg"],
    },
  };
}

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
    <div className="mx-auto mt-5 max-w-3xl rounded-xl border border-gold/30 bg-white/80 p-3 text-xs shadow-sm sm:p-4 sm:text-sm">
      {groups.map((g) => (
        <div key={g.id} className="py-1 sm:flex sm:gap-3">
          <p className="shrink-0 font-semibold text-charcoal sm:w-40">
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

const MENU_FAQS = [
  { question: "Is Demo Restaurant BYOB?", answer: "Yes — we don't hold an alcohol licence, so you're welcome to bring your own beer, wine or spirits to enjoy with your meal. Corkage charges apply; ask our team for details." },
  { question: "Can I order takeaway for collection?", answer: "Yes. Order online at /order, choose your dishes and collection time (ready from ~20 minutes), then pay in the restaurant by cash or card when you collect. You can also order for Deliveroo delivery." },
  { question: "Do you have vegetarian, vegan and gluten-free options?", answer: "Many dishes can be made with tofu or vegetables and are marked V / VG / GF on the menu as a guide. Please tell us about allergies when ordering — our kitchen handles nuts, gluten, shellfish and more, so we can't guarantee any dish is completely allergen-free." },
  { question: "What is the Express Lunch Menu?", answer: "Tuesday–Saturday, 12:00–15:00 — choose a curry, stir-fry, noodle or rice dish with prawn crackers and a soft drink from £9.95 (vegetable/tofu), £10.50 (chicken/pork) or £11.50 (beef/king prawns). See in store for full details." },
  { question: "Where are you located?", answer: "123 High Street, Sample Town KT9 1AB — near Sample Town Palace. Two minutes from Sample Town Station and Bushy Park. Easy for Hampton, Thames Ditton, Esher, Walton and Surbiton." },
];

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
      <JsonLd data={faqJsonLd(MENU_FAQS)} />
      <PageHero
        eyebrow="Our menu"
        title="Demo Restaurant Menu"
        intro="Authentic Thai dishes, freshly prepared to order in Sample Town — near Sample Town. Many dishes can be made with your choice of protein and spice level."
        image={IMG.thaiSpread}
      >
        <p className="mx-auto mt-2 max-w-2xl text-sm text-cream/60">Sample Town • Sample Town • Thames Ditton • Esher • Walton-on-Thames • KT8 • BYOB • Family-friendly</p>
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
        <div className="container-x flex flex-wrap gap-2 py-3">
          {menu.map((c) => (
            <a key={c.id} href={`#section-${c.id}`} className="chip">
              {c.name}
            </a>
          ))}
        </div>
      </nav>

      <section className="container-x pt-6 sm:pt-7" aria-label="Dietary key">
        <DietaryLegend />
        <p className="mx-auto mt-3 flex max-w-3xl items-start justify-center gap-1.5 text-center text-xs leading-relaxed text-charcoal/60">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Dietary indicators (V, VG, etc.) are a guide only. Allergen badges are shown on each dish where relevant —{" "}
          <a href="#allergens" className="font-semibold text-teak underline decoration-teak/30 underline-offset-4 hover:text-charcoal">
            full allergen list at the bottom ↓
          </a>
        </p>
      </section>
      <section className="container-x py-6 sm:py-7">
  <div className="rounded-2xl border border-gold/30 bg-cream-dark p-5 sm:p-6">
    <p className="eyebrow text-xs">Express Lunch</p>
    <h2 className="mt-1 font-serif text-2xl font-semibold sm:text-3xl">Express Lunch — Sample Town</h2>
    <p className="mt-1.5 text-xs text-charcoal/70 sm:text-sm">Tue–Sat • 12:00–15:00 • Dine-in & collection</p>
    <p className="mt-3 text-sm leading-relaxed text-charcoal/70">
      Choice of select curries, stir-fries, noodle or rice dishes with prawn crackers (2 pcs) and a soft drink. <em>See menu in store for more details.</em>
    </p>
    <div className="mt-4 grid gap-2 sm:grid-cols-3 sm:gap-3">
      <div className="rounded-xl bg-white p-3 text-sm sm:p-4"><strong>Vegetable or Tofu</strong><br />£9.95</div>
      <div className="rounded-xl bg-white p-3 text-sm sm:p-4"><strong>Chicken or Pork</strong><br />£10.50</div>
      <div className="rounded-xl bg-white p-3 text-sm sm:p-4"><strong>Beef or King Prawns</strong><br />£11.50</div>
    </div>
  </div>
</section>
      {menu.map((category, index) => (
        <Fragment key={category.id}>
          <section id={`section-${category.id}`} aria-labelledby={`heading-${category.id}`} className="scroll-mt-28 py-8 sm:py-10 lg:py-12">
            <div className="container-x">
              <div className="text-center">
                <h2 id={`heading-${category.id}`} className="font-serif text-2xl font-semibold sm:text-3xl lg:text-4xl">
                  {category.name}
                </h2>
                <Ornament className="mx-auto mt-3 h-3 w-28 sm:mt-4 sm:h-4 sm:w-40" />
                {category.description ? (
                  <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-charcoal/70">{category.description}</p>
                ) : null}
              </div>
              <ChoicesPanel groups={category.groups} />
              <ul className="mt-6 grid gap-x-8 gap-y-5 sm:mt-8 sm:gap-x-10 sm:gap-y-6 md:grid-cols-2 lg:gap-x-14">
                {category.items.map((item) => (
                  <li key={item.id} className={item.available ? "" : "opacity-60"}>
                    <div className="flex items-baseline gap-2 sm:gap-3">
                      <h3 className="font-serif text-base font-semibold text-charcoal sm:text-lg lg:text-xl">{item.name}</h3>
                      <span className="min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-teak/30" aria-hidden="true" />
                      <p className="shrink-0 text-sm font-semibold text-teak sm:text-[15px]">
                        {hasPriceRange(item) ? <span className="mr-1 text-xs font-normal text-charcoal/50">from</span> : null}
                        {formatPrice(startingPrice(item))}
                      </p>
                    </div>
                    <DietaryBadges tags={item.dietary} className="mt-1.5" />
                    <AllergenBadges allergens={item.allergens} className="mt-1.5" />
                    {item.description ? (
                      <p className="mt-1.5 text-xs leading-relaxed text-charcoal/70 sm:text-sm">{item.description}</p>
                    ) : null}
                    {item.ownGroups.map((g) => (
                      <p key={g.id} className="mt-1 text-xs leading-relaxed text-charcoal/60">
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

      <section id="allergens" aria-labelledby="allergens-heading" className="container-x scroll-mt-28 pt-6 sm:pt-8">
        <div className="mx-auto max-w-5xl rounded-2xl border border-amber-200 bg-white p-4 shadow-sm ring-1 ring-amber-100 sm:p-5">
          <h2 id="allergens-heading" className="font-serif text-lg font-semibold sm:text-xl">Allergens — the 14 major allergens</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-charcoal/60 sm:text-sm">
            Badges on each dish show allergens definitely present as ingredients. Please inform our team of any allergy before ordering — we&apos;ll advise on suitable options.
          </p>
          <div className="mt-3 sm:mt-4">
            <AllergenLegend compact />
          </div>
        </div>
      </section>

      <FaqSection items={MENU_FAQS} heading="Menu & ordering FAQs" />

      <section className="relative isolate overflow-hidden bg-charcoal py-12 text-center text-cream sm:py-14 lg:py-16">
        <div className="thai-pattern absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
        <div className="container-x">
          <p className="eyebrow">Hungry already?</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">Order for collection in under a minute</h2>
          <p className="mx-auto mt-4 max-w-xl text-cream/75">
            Choose your dishes and collection time online — pay in restaurant when you collect. Prefer delivery? Find us on
            Deliveroo. BYOB welcome for dine-in.
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
          <p className="mx-auto mt-6 max-w-xl text-xs leading-relaxed text-cream/50">
            Serving Sample Town, Sample Town, Thames Ditton, Hampton, Teddington, Esher & Walton-on-Thames. 123 High Street, KT9 1AB — Tue–Sat 12:00–21:00.
          </p>
        </div>
      </section>
    </>
  );
}
