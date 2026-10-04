import type { Metadata } from "next";
import { MenuManager } from "@/components/admin/MenuManager";
import { getMenu } from "@/lib/menu";

export const metadata: Metadata = { title: "Menu" };

export default async function AdminMenuPage() {
  const menu = await getMenu({ includeHidden: true });
  return <MenuManager categories={menu} />;
}
