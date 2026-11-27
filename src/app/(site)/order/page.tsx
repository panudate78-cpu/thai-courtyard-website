import type { Metadata } from "next";
import { Banknote, Clock, MapPin } from "lucide-react";
import { OrderApp } from "@/components/order/OrderApp";
import { DeliverooButton, JsonLd } from "@/components/ui";
import { FaqSection } from "@/components/site/SeoSections";
import { getCollectionDays } from "@/lib/hours";
import { getMenu } from "@/lib/menu";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { getSettings, toSlotConfig } from "@/lib/settings";
import { SITE } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { getResolvedSeo } = await import("@/lib/seo-resolve");
    const seo = await getResolvedSeo("/order");
    if (seo) {
      return {
        title: seo.title,
        description: seo.description,
        alternates: { canonical: "/order" },
        openGraph: {
          title: seo.ogTitle || seo.title,
          description: seo.ogDescription || seo.description,
          url: "/order",
          images: seo.ogImage ? [{ url: seo.ogImage }] : ["/opengraph-image"],
        },
      };
    }
  } catch {}
  return {
    title: "Order Thai Takeaway for Collection — East Molesey KT8 | Thai Courtyard",
    description:
      "Order authentic Thai takeaway online for collection from Thai Courtyard, East Molesey. Choose dishes & collection time, pay on collection (cash/card). Near Hampton Court. Tue–Sat 12:00–21:00.",
    alternates: { canonical: "/order" },
    openGraph: {
      title: "Order Thai Takeaway — Collection in East Molesey",
      description: "Fresh Thai curries, Pad Thai, stir-fries & more — order online, collect in ~20 mins, pay on collection. 105 Walton Road, KT8.",
      url: "/order",
      images: ["/opengraph-image"],
    },
  };
}

const ORDER_FAQS = [
  { question: "How does collection ordering work?", answer: "Browse the menu, add dishes to your basket, choose a collection date and time, and place your order. We'll have it freshly cooked for that time. Pay in the restaurant when you collect — cash or card. You'll get a confirmation and order number on screen." },
  { question: "How quickly can I collect?", answer: "Orders are normally ready from ~20 minutes (see the lead time at the top of the order page). During busy periods it may be slightly longer — your chosen slot is confirmed at checkout." },
  { question: "Do you offer delivery?", answer: "Yes — for home delivery, order via Deliveroo. Our collection service is for picking up from the restaurant at 105 Walton Road, KT8 0DR." },
  { question: "What if I have allergies or dietary needs?", answer: "Add a note at checkout and tell our team when you collect. Menu badges (V, VG, GF etc.) are a guide only; we handle allergens in the kitchen and can't guarantee any dish is completely allergen-free, but we'll always advise." },
  { question: "Where do I collect from?", answer: "Thai Courtyard, 105 Walton Road, East Molesey KT8 0DR — near Hampton Court Palace. Free on-street parking nearby; Hampton Court Station is a 5-minute walk." },
];

export default async function OrderPage({ searchParams }: { searchParams: Promise<{ item?: string | string[] }> }) {
  const params = await searchParams;
  const [menu, settings] = await Promise.all([getMenu(), getSettings()]);
  const slotConfig = toSlotConfig(settings);
  const itemParam = Array.isArray(params.item) ? params.item[0] : params.item;
  const initialItemId = itemParam && /^\d+$/.test(itemParam) ? Number(itemParam) : null;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Order Collection", path: "/order" },
        ])}
      />
      <JsonLd data={faqJsonLd(ORDER_FAQS)} />
      <section className="relative isolate overflow-hidden bg-charcoal text-cream">
        <div className="thai-pattern absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
        <div className="container-x py-7 text-center sm:py-9 sm:text-left lg:py-10">
          <p className="eyebrow">Online collection ordering — East Molesey, near Hampton Court</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight sm:text-4xl">Order Thai Takeaway for Collection</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-cream/80 sm:mx-0 sm:text-[15px]">
            Order authentic Thai food online — curries, stir-fries, Pad Thai, salads & chef&apos;s specials — pick a collection time, and we&apos;ll have it freshly prepared for you at 105 Walton Road, KT8 0DR.
          </p>
          <ul className="mt-4 flex flex-wrap justify-center gap-2 text-xs font-medium sm:justify-start sm:text-sm">
            <li className="inline-flex items-center gap-2 rounded-full bg-cream/10 px-3 py-1.5 ring-1 ring-cream/15">
              <Clock className="h-4 w-4 text-gold-light" aria-hidden="true" />
              Ready from {settings.leadTimeMinutes} minutes
            </li>
            <li className="inline-flex items-center gap-2 rounded-full bg-cream/10 px-3 py-1.5 ring-1 ring-cream/15">
              <Banknote className="h-4 w-4 text-gold-light" aria-hidden="true" />
              Pay on collection · cash &amp; card
            </li>
            <li className="inline-flex items-center gap-2 rounded-full bg-cream/10 px-3 py-1.5 ring-1 ring-cream/15">
              <MapPin className="h-4 w-4 text-gold-light" aria-hidden="true" />
              {SITE.addressLine} • Tue–Sat 12–21
            </li>
          </ul>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:justify-start">
            <DeliverooButton className="px-5 py-2.5" />
            <span className="text-sm text-cream/60">Prefer delivery? We&apos;re on Deliveroo — delivery area and fee set by Deliveroo; enter your postcode to check.</span>
          </div>
        </div>
      </section>
      <OrderApp
        categories={menu}
        initialDays={getCollectionDays(slotConfig)}
        slotConfig={slotConfig}
        orderingEnabled={settings.orderingEnabled}
        pausedMessage={settings.pausedMessage}
        initialItemId={initialItemId}
      />
      <FaqSection items={ORDER_FAQS} heading="Ordering FAQs — collection takeaway" />
      <section className="py-10">
        <div className="container-x text-center text-xs leading-relaxed text-charcoal/50">
          Serving East Molesey, West Molesey, Hampton Court, Thames Ditton, Hampton, Teddington, Esher, Walton & Hersham. 105 Walton Road, East Molesey KT8 0DR • <a href={SITE.phoneHref} className="font-semibold text-teak hover:underline">{SITE.phoneDisplay}</a> • Near Hampton Court Palace & Bushy Park.
        </div>
      </section>
    </>
  );
}
