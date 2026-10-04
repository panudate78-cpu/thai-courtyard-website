import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { getAdminCounts } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  const counts = await getAdminCounts();
  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
      <AdminNav counts={counts} />
      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
    </div>
  );
}
