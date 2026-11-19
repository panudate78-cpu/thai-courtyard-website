import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SITE } from "@/lib/site";
import "./globals.css";

const title = "Thai Courtyard | Authentic Thai Restaurant in East Molesey";
const description = SITE.description;

const ogImage = {
  url: "/images/hero-spread.jpg",
  width: 1800,
  height: 1013,
  alt: "A table spread of authentic Thai dishes at Thai Courtyard, East Molesey — curries, salads and stir-fries",
};

// Also exposed as /opengraph-image via the file route – this URL is the fallback
const ogGenerated = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Thai Courtyard — Authentic Thai Cuisine in East Molesey, near Hampton Court",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: title, template: "%s | Thai Courtyard East Molesey" },
  description,
  applicationName: SITE.name,
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  keywords: [
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
  ],
  authors: [{ name: "Thai Courtyard", url: SITE.url }],
  creator: "Thai Courtyard",
  publisher: "Thai Courtyard",
  alternates: {
    canonical: "/",
    languages: { "en-GB": "/" },
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: SITE.fullName,
    title,
    description,
    url: SITE.url,
    images: [ogGenerated, ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
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
    "geo.placename": "East Molesey",
    "geo.position": `${SITE.geo.lat};${SITE.geo.lng}`,
    ICBM: `${SITE.geo.lat}, ${SITE.geo.lng}`,
  },
};

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
