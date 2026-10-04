import type { ReactNode } from "react";
import { Footer } from "@/components/site/Footer";
import { Header, MobileActionBar } from "@/components/site/Header";
import { JsonLd } from "@/components/ui";
import { restaurantJsonLd } from "@/lib/seo";
import { getSettingsSafe } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const settings = await getSettingsSafe();
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-gold focus:px-5 focus:py-3 focus:font-semibold focus:text-charcoal"
      >
        Skip to main content
      </a>
      <JsonLd data={restaurantJsonLd()} />
      {settings.announcement ? (
        <div className="bg-teak px-4 py-2 text-center text-sm font-medium text-cream" role="status">
          {settings.announcement}
        </div>
      ) : null}
      <Header />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <Footer />
      <MobileActionBar />
    </>
  );
}
