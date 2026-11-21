import type { Metadata } from "next";
import Link from "next/link";
import { getCustomerDashboard } from "@/lib/business/analytics";
import { ColumnChart, LineChart, RankBars } from "@/components/admin/business/charts";
import { DataTable, MetricGrid, OriginBanner, PageIntro, Panel } from "@/components/admin/business/widgets";

export const metadata: Metadata = { title: "Customer analytics" };
export const dynamic = "force-dynamic";

export default async function CustomerAnalyticsPage() {
  const customers = await getCustomerDashboard();
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Business"
        title="Customer analytics"
        description="Who is new, who comes back, and who spends the most. The customer directory itself is unchanged."
        actions={
          <Link href="/admin/customers" className="adm-btn">
            Open customer list
          </Link>
        }
      />
      <OriginBanner origin={customers.origin} warning={customers.warning} note={customers.methodNote} />
      <MetricGrid metrics={customers.metrics} />
      <Panel title="Customer retention" description="Tiers match the customer list: VIP at 10 orders, Gold at 5, Regular at 3. Returning on the cards above means 2 or more orders.">
        <RankBars rows={customers.tiers} />
      </Panel>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Customer growth" description="New customers by month, using the first known order date.">
          <ColumnChart points={customers.growth} label="New customers by month" format={(value) => String(Math.round(value))} />
        </Panel>
        <Panel title="Cumulative customers" description="Running total of customers with a known first order.">
          <LineChart points={customers.cumulative} label="Cumulative customers" />
        </Panel>
      </div>
      <Panel title="Visit trends" description="Monthly activity. Live order history is the preferred source; imported directories can only show a last-order month.">
        <ColumnChart points={customers.visits} label="Visit trend" format={(value) => String(Math.round(value))} />
      </Panel>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Highest spending customers">
          <DataTable
            columns={["Customer", "Phone", "Orders", "Spend", "Last order"]}
            rows={customers.spenders.map((row) => [row.name, row.phone, row.orders, row.spend, row.last])}
          />
        </Panel>
        <Panel title="Most frequent customers">
          <DataTable
            columns={["Customer", "Phone", "Orders", "Spend", "Last order"]}
            rows={customers.frequent.map((row) => [row.name, row.phone, row.orders, row.spend, row.last])}
          />
        </Panel>
      </div>
    </div>
  );
}
