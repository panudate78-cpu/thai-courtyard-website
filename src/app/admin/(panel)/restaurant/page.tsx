import type { Metadata } from "next";
import { BusinessProfileForm } from "@/components/admin/business/BusinessProfileForm";
import { RestaurantForm } from "@/components/admin/business/RestaurantForm";
import { PageIntro } from "@/components/admin/business/widgets";
import { getBusinessSettings } from "@/lib/business/settings-store";
import { getRestaurantConfigSafe, getRestaurantProfile } from "@/lib/restaurant";

export const metadata: Metadata = { title: "Business settings" };
export const dynamic = "force-dynamic";

export default async function RestaurantSettingsPage() {
  const [settings, profile, config] = await Promise.all([
    getBusinessSettings(),
    getRestaurantProfile(),
    getRestaurantConfigSafe(),
  ]);
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Business"
        title="Business settings"
        description={`Everything that makes this platform yours — name, logo, colours, contact details, opening hours, collection/delivery and payments. Guests currently see: ${config.name}, ${config.hoursSummary}. Changes go live as soon as you save.`}
      />
      <BusinessProfileForm initial={profile} />
      <RestaurantForm initial={settings} />
    </div>
  );
}
