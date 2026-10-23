import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Restaurant Admin" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-svh bg-[#f5f1ea] text-charcoal">{children}</div>;
}
