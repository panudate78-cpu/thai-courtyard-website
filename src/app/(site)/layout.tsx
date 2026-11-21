import type { ReactNode } from "react";
import { Footer } from "@/components/site/Footer";
import { Header, MobileActionBar } from "@/components/site/Header";
import { VisitTracker } from "@/components/site/VisitTracker";
import { JsonLd } from "@/components/ui";
import { organizationJsonLd, restaurantJsonLd, websiteJsonLd } from "@/lib/seo";
import { getRestaurantConfig } from "@/lib/restaurant";
import { getSettingsSafe } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const settings = await getSettingsSafe();
  const restaurantConfig = await getRestaurantConfig().catch(() => null);
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-gold focus:px-5 focus:py-3 focus:font-semibold focus:text-charcoal"
      >
        Skip to main content
      </a>
      <JsonLd data={restaurantJsonLd(restaurantConfig)} />
      <JsonLd data={websiteJsonLd(restaurantConfig)} />
      <JsonLd data={organizationJsonLd(restaurantConfig)} />
      {settings.announcement || restaurantConfig?.announcement ? (
        <div className="bg-teak px-4 py-2 text-center text-sm font-medium text-cream" role="status">
          {settings.announcement || restaurantConfig?.announcement}
        </div>
      ) : null}
      <Header cfg={restaurantConfig} />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <Footer cfg={restaurantConfig} />
      <MobileActionBar cfg={restaurantConfig} />
      {/* Anonymous, admin-excluded page views for the admin site-visit counter. Renders nothing. */}
      <VisitTracker />
    </>
  );
}
