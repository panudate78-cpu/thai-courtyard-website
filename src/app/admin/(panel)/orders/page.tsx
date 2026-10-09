import type { Metadata } from "next";
import { OrdersBoard } from "@/components/admin/OrdersBoard";
import { londonNow } from "@/lib/hours";
import { listOrders } from "@/lib/orders";

export const metadata: Metadata = { title: "Orders" };

export default async function AdminOrdersPage() {
  const orders = await listOrders({ scope: "all" });
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Orders</h1>
        <p className="text-sm text-black/55">
          Collection orders (latest 250). New orders appear automatically — enable sound to hear an alert.
        </p>
      </header>
      <OrdersBoard initialOrders={orders} scope="all" today={londonNow().date} />
    </div>
  );
}
