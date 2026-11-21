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
      "The Thai Courtyard menu — starters, soups, curries, stir-fries, salads, noodles & chef's specials in East Molesey, Surrey KT8. Prices, protein choices, BYOB. Order for collection or dine in.",
    alternates: { canonical: "/menu" },
    openGraph: {
      title: "Thai Courtyard Menu | East Molesey • Hampton Court",
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

const MENU_FAQS = [
  { question: "Is Thai Courtyard BYOB?", answer: "Yes — we don't hold an alcohol licence, so you're welcome to bring your own beer, wine or spirits to enjoy with your meal. Corkage charges apply; ask our team for details." },
  { question: "Can I order takeaway for collection?", answer: "Yes. Order online at /order, choose your dishes and collection time (ready from ~20 minutes), then pay in the restaurant by cash or card when you collect. You can also order for Deliveroo delivery." },
  { question: "Do you have vegetarian, vegan and gluten-free options?", answer: "Many dishes can be made with tofu or vegetables and are marked V / VG / GF on the menu as a guide. Please tell us about allergies when ordering — our kitchen handles nuts, gluten, shellfish and more, so we can't guarantee any dish is completely allergen-free." },
  { question: "What is the Express Lunch Menu?", answer: "Tuesday–Saturday, 12:00–15:00 — choose a curry, stir-fry, noodle or rice dish with prawn crackers and a soft drink from £9.95 (vegetable/tofu), £10.50 (chicken/pork) or £11.50 (beef/king prawns). See in store for full details." },
  { question: "Where are you located?", answer: "105 Walton Road, East Molesey KT8 0DR — near Hampton Court Palace. Two minutes from Hampton Court Station and Bushy Park. Easy for Hampton, Thames Ditton, Esher, Walton and Surbiton." },
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
        title="Thai Courtyard Menu"
        intro="Authentic Thai dishes, freshly prepared to order in East Molesey — near Hampton Court. Many dishes can be made with your choice of protein and spice level."
        image={IMG.thaiSpread}
      >
        <p className="mx-auto mt-2 max-w-2xl text-sm text-cream/60">East Molesey • Hampton Court • Thames Ditton • Esher • Walton-on-Thames • KT8 • BYOB • Family-friendly</p>
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

      <section className="container-x pt-10" aria-label="Dietary and allergen keys">
        <DietaryLegend />
        <p className="mx-auto mt-5 flex max-w-3xl items-start justify-center gap-2 text-center text-xs leading-relaxed text-charcoal/60">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Dietary indicators (V, VG, etc.) are a guide only. Full allergen information is below.
        </p>

        <div className="mx-auto mt-10 max-w-5xl">
          <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm ring-1 ring-amber-100 sm:p-8">
            <h2 className="font-serif text-2xl font-semibold sm:text-3xl">Allergens — the 14 major allergens</h2>
            <div className="mt-3 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-sm">
              ⚠️ Due to possible cross contamination, any allergen could be present in any dish — even if not listed. Please tell us about any allergy when ordering.
            </div>
            <p className="mt-3 text-sm leading-relaxed text-charcoal/65">
              Thai cooking frequently uses fish sauce (Fish 5), soy sauce/tofu (Soya 13, Gluten 2), shrimp paste/oyster sauce
              (Crustaceans 3, Molluscs 8), peanuts (Peanuts 11), sesame oil (Sesame 12), eggs (Egg 4) and more. Badges on each
              dish show allergens present as ingredients. Cross-contact in our kitchen means traces of any allergen may be present even when not badge-marked.
            </p>
            <div className="mt-6">
              <AllergenLegend />
            </div>
            <p className="mt-4 text-xs leading-relaxed text-charcoal/55">
              Numbers shown on dish badges match the numbered list above (e.g. <span className="font-semibold">P11</span> = Peanuts, <span className="font-semibold">F5</span> = Fish). Tell us about any allergy when ordering and we&apos;ll advise on alternatives.
            </p>
          </div>
        </div>
      </section>
      <section className="container-x py-8">
  <div className="rounded-2xl border border-gold/30 bg-cream-dark p-8">
    <p className="eyebrow">Express Lunch</p>

    <h2 className="mt-2 font-serif text-4xl font-semibold">
      Express Lunch Menu — East Molesey
    </h2>

    <p className="mt-3 text-charcoal/75">
      Available Tuesday to Saturday • 12:00pm – 3:00pm  • Dine-in & collection
    </p>

    <p className="mt-4 text-charcoal/75">
      Choice of select curries, stir-fries, noodle or rice dishes with complimentary
      prawn crackers (2 pieces) and a soft drink. <em>See menu in store for more details.</em> Perfect for lunch near Hampton Court Palace.
    </p>

    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl bg-white p-4">
        <strong>Vegetable or Tofu</strong>
        <br />
        £9.95
      </div>

      <div className="rounded-xl bg-white p-4">
        <strong>Chicken or Pork</strong>
        <br />
        £10.50
      </div>

      <div className="rounded-xl bg-white p-4">
        <strong>Beef or King Prawns</strong>
        <br />
        £11.50
      </div>
    </div>
  </div>
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
                    <AllergenBadges allergens={item.allergens} className="mt-2" />
                    {!item.allergens?.length ? (
                      <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium leading-relaxed text-amber-900 ring-1 ring-amber-200">
                        ⚠️ Due to possible cross contamination, this dish may contain any of the 14 allergens. Please inform staff of any allergy before ordering.
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-charcoal/45">Allergen badges show ingredients. Due to cross contamination, traces of any allergen could still be present.</p>
                    )}
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

      <FaqSection items={MENU_FAQS} heading="Menu & ordering FAQs" />

      <section className="relative isolate overflow-hidden bg-charcoal py-16 text-center text-cream lg:py-20">
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
            Serving East Molesey, Hampton Court, Thames Ditton, Hampton, Teddington, Esher & Walton-on-Thames. 105 Walton Road, KT8 0DR — Tue–Sat 12:00–21:00.
          </p>
        </div>
      </section>
    </>
  );
}
