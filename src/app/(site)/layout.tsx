import type { ReactNode } from "react";
import Link from "next/link";
import { Footer } from "@/components/site/Footer";
import { Header, MobileActionBar } from "@/components/site/Header";
import { JsonLd } from "@/components/ui";
import { getRestaurantConfigSafe } from "@/lib/restaurant";
import { restaurantJsonLd } from "@/lib/seo";
import { getSettingsSafe } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [settings, config] = await Promise.all([getSettingsSafe(), getRestaurantConfigSafe()]);
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-gold focus:px-5 focus:py-3 focus:font-semibold focus:text-charcoal"
      >
        Skip to main content
      </a>
      <JsonLd data={restaurantJsonLd(config)} />
      {!config.setupCompleted ? (
        <div className="bg-gold px-4 py-2 text-center text-sm font-semibold text-charcoal" role="status">
          Demo mode — this is sample content.{" "}
          <Link href="/setup" className="underline">
            Run the setup wizard
          </Link>{" "}
          to launch your restaurant.
        </div>
      ) : null}
      {settings.announcement ? (
        <div className="bg-teak px-4 py-2 text-center text-sm font-medium text-cream" role="status">
          {settings.announcement}
        </div>
      ) : null}
      <Header config={config} />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <Footer config={config} />
      <MobileActionBar config={config} />
    </>
  );
}
