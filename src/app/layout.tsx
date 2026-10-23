import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { brandCss, getRestaurantConfigSafe } from "@/lib/restaurant";
import "./globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const sans = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const config = await getRestaurantConfigSafe();
  const title = `${config.name} | ${config.cuisine || "Restaurant"}${config.address.locality ? ` in ${config.address.locality}` : ""}`;
  return {
    metadataBase: new URL(config.url),
    title: { default: title, template: `%s | ${config.fullName}` },
    description: config.description,
    applicationName: config.name,
    keywords: [
      `restaurant ${config.address.locality}`,
      `${config.name}`,
      `takeaway ${config.address.locality}`,
      `collection ${config.address.postcode}`,
      config.cuisine,
    ].filter(Boolean),
    openGraph: {
      type: "website",
      locale: "en_GB",
      siteName: config.fullName,
      title,
      description: config.description,
      url: config.url,
      images: config.heroImageUrl.startsWith("data:") ? undefined : [{ url: config.heroImageUrl }],
    },
    twitter: { card: "summary_large_image", title, description: config.description },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
    formatDetection: { telephone: true, address: true, email: false },
    category: "restaurant",
    ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
  };
}

export const viewport: Viewport = {
  themeColor: "#1d1b1a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const config = await getRestaurantConfigSafe();
  return (
    <html lang={config.locale} className={`${serif.variable} ${sans.variable}`}>
      <head>
        {/* Brand colours are configured in Admin → Restaurant (no rebuild needed). */}
        <style dangerouslySetInnerHTML={{ __html: brandCss(config) }} />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
