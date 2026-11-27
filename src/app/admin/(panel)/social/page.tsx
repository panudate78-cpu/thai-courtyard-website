import type { Metadata } from "next";
import { PageIntro } from "@/components/admin/business/widgets";
import { SocialStudio } from "@/components/admin/SocialStudio";
import { getMenu } from "@/lib/menu";
import { getOffers } from "@/lib/offers";

export const metadata: Metadata = { title: "Social Studio · Instagram & Facebook" };
export const dynamic = "force-dynamic";

export default async function SocialPage() {
  const [menu, offers] = await Promise.all([getMenu({ includeHidden: false }).catch(() => []), getOffers().catch(() => [])]);

  const dishes = menu
    .flatMap((c) =>
      c.items.map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        pricePence: i.pricePence,
        categoryName: c.name,
      }))
    )
    .slice(0, 300); // safety cap

  const activeOffers = offers
    .filter((o) => o.status === "Active")
    .map((o) => ({
      id: o.id,
      title: o.title,
      description: o.description,
      ctaText: o.ctaText,
      ctaLink: o.ctaLink,
      status: o.status,
    }));

  // Fall back to all offers if none active, so generator still has something to pick
  const offersForStudio = activeOffers.length ? activeOffers : offers.map((o) => ({
    id: o.id,
    title: o.title,
    description: o.description,
    ctaText: o.ctaText,
    ctaLink: o.ctaLink,
    status: o.status,
  }));

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Business"
        title="Social Studio"
        description="Generate ready-to-paste Instagram & Facebook captions from your live menu and offers. Text-only — add your photo in Instagram/Facebook and post. No AI key needed."
      />
      <SocialStudio dishes={dishes} offers={offersForStudio} />
    </div>
  );
}
