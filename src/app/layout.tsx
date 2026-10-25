import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SITE } from "@/lib/site";
import "./globals.css";

const title = "Thai Courtyard | Authentic Thai Restaurant in East Molesey";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: title, template: "%s | Thai Courtyard East Molesey" },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "Thai restaurant East Molesey",
    "Thai food Molesey",
    "Thai takeaway East Molesey",
    "Thai collection KT8",
    "Thai restaurant near Hampton Court",
    "Walton Road restaurant",
    "Thai Courtyard",
  ],
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: SITE.fullName,
    title,
    description: SITE.description,
    url: SITE.url,
  },
  twitter: { card: "summary_large_image", title, description: SITE.description },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  formatDetection: { telephone: true, address: true, email: false },
  category: "restaurant",
  ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
};

export const viewport: Viewport = {
  themeColor: "#1d1b1a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
