import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SITE } from "@/lib/site";
import { getRestaurantConfig } from "@/lib/restaurant";
import "./globals.css";

async function getSiteForMetadata() {
  try {
    return await getRestaurantConfig();
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const cfg = await getSiteForMetadata();
  const url = cfg?.siteUrl || SITE.url;
  const name = cfg?.restaurantName || SITE.name;
  const fullName = cfg?.fullName || SITE.fullName;
  const description = cfg?.description || SITE.description;
  const titleDefault = cfg ? `${name} | ${cfg.tagline || `Authentic ${cfg.servesCuisine[0] || "Restaurant"} in ${cfg.addressLocality}`}` : "Demo Restaurant | Fresh seasonal dining in Sample Town";
  const locality = cfg?.addressLocality || "East Molesey";
  const area = cfg?.areaServed?.[0] || SITE.areaServed[0];
  const cuisine = cfg?.servesCuisine?.[0] || "Thai";
  const keywords = cfg
    ? [
        `${cuisine} restaurant ${locality}`,
        `${cuisine} takeaway ${locality}`,
        `${cuisine} restaurant ${area}`,
        `${cuisine} food ${locality}`,
        `${name}`,
        `${name} ${locality}`,
        `Best ${cuisine} restaurant ${cfg.addressRegion || "Surrey"}`,
      ]
    : [
        "Thai restaurant East Molesey",
        "Thai restaurant Hampton Court",
        "Thai takeaway East Molesey",
        "Thai takeaway KT8",
        "Thai food Molesey",
        "Thai collection KT8",
        "Thai restaurant near Hampton Court Palace",
        "Thai delivery East Molesey",
        "Best Thai restaurant Surrey",
        "Authentic Thai food East Molesey",
        "Walton Road restaurant",
        "Thai Courtyard",
        "Thai Courtyard East Molesey",
        "Family friendly Thai restaurant Surrey",
        "BYOB Thai restaurant East Molesey",
        "East Molesey restaurants",
      ];

  const ogImage = {
    url: cfg?.heroImageUrl || "/images/hero-spread.jpg",
    width: 1800,
    height: 1013,
    alt: `A table spread at ${name}, ${locality} — ${cuisine} dishes`,
  };
  const ogGenerated = {
    url: cfg?.ogImageUrl || "/opengraph-image",
    width: 1200,
    height: 630,
    alt: cfg ? `${name} — ${cfg.tagline}` : "Thai Courtyard — Authentic Thai Cuisine in East Molesey, near Hampton Court",
  };

  return {
    metadataBase: new URL(url),
    title: { default: titleDefault, template: `%s | ${fullName}` },
    description,
    applicationName: name,
    generator: "Next.js",
    referrer: "origin-when-cross-origin",
    keywords,
    authors: [{ name, url }],
    creator: name,
    publisher: name,
    alternates: {
      canonical: "/",
      languages: { "en-GB": "/" },
    },
    openGraph: {
      type: "website",
      locale: "en_GB",
      siteName: fullName,
      title: titleDefault,
      description,
      url,
      images: [ogGenerated, ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: titleDefault,
      description,
      images: [ogGenerated.url],
      creator: "@thaicourtyard",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-video-preview": -1,
        "max-snippet": -1,
      },
    },
    formatDetection: { telephone: true, address: true, email: false },
    category: "restaurant",
    classification: "Restaurant",
    verification: {
      ...(process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : {}),
      ...(process.env.BING_SITE_VERIFICATION ? { other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION } } : {}),
    },
    other: {
      "geo.region": "GB-SRY",
      "geo.placename": locality,
      "geo.position": `${cfg?.geoLat ?? SITE.geo.lat};${cfg?.geoLng ?? SITE.geo.lng}`,
      ICBM: `${cfg?.geoLat ?? SITE.geo.lat}, ${cfg?.geoLng ?? SITE.geo.lng}`,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#1d1b1a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark light",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        {/* Preconnect for performance – helps LCP */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://www.google.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
