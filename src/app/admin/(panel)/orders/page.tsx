import type { Metadata } from "next";
import { OrdersBoard } from "@/components/admin/OrdersBoard";
import { londonNow } from "@/lib/hours";
import { listOrders } from "@/lib/orders";

export const metadata: Metadata = { title: "Orders" };

export default async function AdminOrdersPage() {
  const orders = await listOrders({ scope: "all" });
  const today = londonNow().date;
  const monthStart = `${today.slice(0, 7)}-01`;
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Orders</h1>
          <p className="text-sm text-black/55">
            Collection orders (latest 250). New orders appear automatically — enable sound to hear an alert.
          </p>
        </div>
        <a href={`/admin/accounting?start=${monthStart}&end=${today}`} className="adm-btn-primary">
          Accounting CSVs →
        </a>
      </header>
      <OrdersBoard initialOrders={orders} scope="all" today={today} />
      <div className="adm-card p-4">
        <h2 className="text-sm font-semibold">Export for your accountant</h2>
        <p className="mt-1 text-xs leading-5 text-black/60">
          Sales-only CSVs — one row per non-cancelled order, Net + 20% VAT split. QuickBooks / Xero / Sage / FreeAgent / Generic.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          {["quickbooks", "xero", "sage", "freeagent"].map((p) => (
            <a key={p} href={`/api/admin/accounting/export?provider=${p}&start=${monthStart}&end=${today}`} className="adm-btn justify-center capitalize">
              {p} CSV
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
