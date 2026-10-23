import type { Metadata } from "next";
import { getFoodDashboard } from "@/lib/business/analytics";
import { ColumnChart, Donut, RankBars } from "@/components/admin/business/charts";
import { OriginBanner, PageIntro, Panel } from "@/components/admin/business/widgets";

export const metadata: Metadata = { title: "Food performance" };
export const dynamic = "force-dynamic";

export default async function FoodPage() {
  const food = await getFoodDashboard();
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Business"
        title="Food performance"
        description={`${food.windowLabel}. Lunch is a collection before 16:00. Dinner is 16:00 onwards.`}
      />
      <OriginBanner
        origin={food.origin}
        warning={food.warning}
        note={
          food.origin === "live"
            ? "Dish rankings use live order lines. Profit still uses estimated category margins until cost prices exist."
            : "No order lines yet. Rankings use an illustrative mix of the current menu and are labelled sample."
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Best selling dishes" description="Ranked by quantity.">
          <RankBars rows={food.best} />
        </Panel>
        <Panel title="Worst selling dishes" description="Lowest quantity, with unsold menu items filling the list when live sales are thin.">
          <RankBars rows={food.worst} />
        </Panel>
      </div>

      <Panel title="Most profitable dishes" description={food.marginNote} action={<span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-900 uppercase">Estimated</span>}>
        <RankBars rows={food.profitable} />
      </Panel>

      <Panel title="Category performance" description="Share of dish revenue.">
        <RankBars rows={food.categories} />
      </Panel>

      <Panel title="Lunch and dinner" description="Collection time split. Dine-in covers are not in the order ledger, so this is collection service only.">
        <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
          <Donut
            label="Lunch and dinner revenue"
            segments={[
              { name: "Lunch", value: food.lunch.revenuePence, color: "#c9a14a" },
              { name: "Dinner", value: food.dinner.revenuePence, color: "#6b4226" },
            ]}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <ServiceCard name="Lunch" revenue={food.lunch.revenue} orders={food.lunch.orders} top={food.lunch.top} />
            <ServiceCard name="Dinner" revenue={food.dinner.revenue} orders={food.dinner.orders} top={food.dinner.top} />
          </div>
        </div>
        <div className="mt-4">
          <ColumnChart
            label="Lunch versus dinner revenue"
            format={(value) => `£${Math.round(value / 100)}`}
            points={[
              { label: "Lunch", value: food.lunch.revenuePence, title: food.lunch.revenue },
              { label: "Dinner", value: food.dinner.revenuePence, title: food.dinner.revenue },
            ]}
          />
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Popular add-ons" description={food.addonNote}>
          <RankBars rows={food.addons} />
        </Panel>
        <Panel title="Popular drinks" description={food.drinkNote}>
          <RankBars rows={food.drinks} />
        </Panel>
      </div>
    </div>
  );
}

function ServiceCard({ name, revenue, orders, top }: { name: string; revenue: string; orders: string; top: string }) {
  return (
    <div className="rounded-2xl bg-cream p-4">
      <p className="text-xs font-semibold tracking-wide text-black/45 uppercase">{name}</p>
      <p className="mt-1 text-2xl font-semibold">{revenue}</p>
      <p className="mt-1 text-sm text-black/60">{orders} orders</p>
      <p className="mt-2 text-sm">Top dish · {top}</p>
    </div>
  );
}
