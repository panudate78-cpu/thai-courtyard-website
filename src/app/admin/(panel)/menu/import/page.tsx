import type { Metadata } from "next";
import Link from "next/link";
import { MenuImporter } from "@/components/admin/MenuImporter";
import { PageIntro } from "@/components/admin/business/widgets";

export const metadata: Metadata = { title: "Menu import" };
export const dynamic = "force-dynamic";

export default function MenuImportPage() {
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Menu"
        title="Menu import"
        description="Turn a PDF, CSV or Excel menu into your live website menu. Prefer typing dishes one by one? Use Menu & prices instead."
        actions={
          <Link href="/admin/menu" className="adm-btn">
            ← Menu &amp; prices
          </Link>
        }
      />
      <MenuImporter />
    </div>
  );
}
