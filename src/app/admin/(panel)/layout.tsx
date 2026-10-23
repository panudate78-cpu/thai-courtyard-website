import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { getAdminCounts } from "@/lib/admin-data";
import { isUsingFallbackPassword, requireAdmin } from "@/lib/auth";
import { getRestaurantConfigSafe } from "@/lib/restaurant";

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  const [counts, config] = await Promise.all([getAdminCounts(), getRestaurantConfigSafe()]);
  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
      <AdminNav counts={counts} config={{ name: config.name, logoUrl: config.logoUrl, setupCompleted: config.setupCompleted }} fallbackPassword={isUsingFallbackPassword()} />
      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
    </div>
  );
}
