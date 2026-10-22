import type { Metadata } from "next";
import { RestaurantForm } from "@/components/admin/business/RestaurantForm";
import { PageIntro } from "@/components/admin/business/widgets";
import { getBusinessSettings } from "@/lib/business/settings-store";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Restaurant" };
export const dynamic = "force-dynamic";

export default async function RestaurantSettingsPage() {
  const settings = await getBusinessSettings();
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Business"
        title="Restaurant"
        description={`Opening hours, holidays, events, contact details and notices for the team. Online ordering rules stay on Settings. Guests currently see ${SITE.hoursSummary}.`}
      />
      <RestaurantForm initial={settings} />
    </div>
  );
}
