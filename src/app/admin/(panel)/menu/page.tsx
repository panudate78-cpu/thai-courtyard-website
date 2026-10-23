import type { Metadata } from "next";
import Link from "next/link";
import { FileUp } from "lucide-react";
import { MenuManager } from "@/components/admin/MenuManager";
import { getMenu } from "@/lib/menu";

export const metadata: Metadata = { title: "Menu" };

export default async function AdminMenuPage() {
  const menu = await getMenu({ includeHidden: true });
  return (
    <div className="space-y-5">
      <div className="adm-card flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm text-black/65">
          <span className="font-semibold text-charcoal">Starting from a document?</span> Upload your PDF, CSV or Excel menu and publish it in minutes.
        </p>
        <Link href="/admin/menu/import" className="adm-btn-primary">
          <FileUp aria-hidden="true" /> Import menu
        </Link>
      </div>
      <MenuManager categories={menu} />
    </div>
  );
}
