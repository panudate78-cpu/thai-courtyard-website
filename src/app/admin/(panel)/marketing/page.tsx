import type { Metadata } from "next";
import { PageIntro } from "@/components/admin/business/widgets";
import { OffersManager } from "@/components/admin/OffersManager";
import { getOffers } from "@/lib/offers";

export const metadata: Metadata = { title: "Marketing · Offers & Promotions" };
export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const offers = await getOffers();
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Business"
        title="Marketing"
        description="Manage time-limited offers shown on the website. Offers activate and expire automatically according to their dates."
      />
      <OffersManager initialOffers={offers} />
    </div>
  );
}
