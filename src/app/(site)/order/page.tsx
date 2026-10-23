import type { Metadata } from "next";
import { Banknote, Clock, MapPin } from "lucide-react";
import { OrderApp } from "@/components/order/OrderApp";
import { DeliveryButton, JsonLd } from "@/components/ui";
import { getCollectionDays } from "@/lib/hours";
import { getMenu } from "@/lib/menu";
import { getHolidayExceptions, getRestaurantConfigSafe } from "@/lib/restaurant";
import { breadcrumbJsonLd } from "@/lib/seo";
import { getSettings, toSlotConfig } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRestaurantConfigSafe();
  return {
    title: "Order Online for Collection",
    description: `Order online for collection from ${config.fullName}. Choose your dishes and collection time, then pay in the restaurant by cash or card.`,
    alternates: { canonical: "/order" },
  };
}

export default async function OrderPage({ searchParams }: { searchParams: Promise<{ item?: string | string[] }> }) {
  const params = await searchParams;
  const [menu, settings, config, holidays] = await Promise.all([
    getMenu(),
    getSettings(),
    getRestaurantConfigSafe(),
    getHolidayExceptions(),
  ]);
  const slotConfig = toSlotConfig(settings, { openingHours: config.openingHours, holidays });
  const itemParam = Array.isArray(params.item) ? params.item[0] : params.item;
  const initialItemId = itemParam && /^\d+$/.test(itemParam) ? Number(itemParam) : null;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: "Home", path: "/" },
            { name: "Order Collection", path: "/order" },
          ],
          config,
        )}
      />
      <section className="relative isolate overflow-hidden bg-charcoal text-cream">
        <div className="brand-pattern absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
        <div className="container-x py-9 sm:py-12">
          <p className="eyebrow">Online collection ordering</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold sm:text-5xl">Order for Collection</h1>
          <p className="mt-3 max-w-2xl text-cream/80">
            Choose your dishes, pick a collection time, and we&apos;ll have everything freshly prepared for you.
          </p>
          <ul className="mt-5 flex flex-wrap gap-2 text-xs font-medium sm:text-sm">
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
              {config.addressLine}
            </li>
          </ul>
          {config.delivery.enabled ? (
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
              <DeliveryButton delivery={config.delivery} className="px-5 py-2.5" />
              <span className="text-sm text-cream/60">Prefer delivery? Order through our delivery partner.</span>
            </div>
          ) : null}
        </div>
      </section>
      <OrderApp
        categories={menu}
        initialDays={getCollectionDays(slotConfig)}
        slotConfig={slotConfig}
        orderingEnabled={settings.orderingEnabled && config.collection.enabled}
        pausedMessage={settings.pausedMessage}
        initialItemId={initialItemId}
        config={config}
      />
    </>
  );
}
