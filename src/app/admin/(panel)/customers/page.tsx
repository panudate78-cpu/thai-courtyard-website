import Link from "next/link";
import {
  getCustomers,
  getMonthToDateRevenue,
} from "@/lib/orders";

function getCustomerTier(orderCount: number) {
  if (orderCount >= 25) return "👑 VIP";
  if (orderCount >= 10) return "⭐ Gold";
  if (orderCount >= 3) return "🟢 Regular";
  return "Customer";
}

function displayPhone(phone: string | null) {
  if (!phone) return "-";

  const cleaned = phone.replace(/\s+/g, "");

  if (cleaned.startsWith("+44")) {
    return "0" + cleaned.slice(3);
  }

  if (cleaned.startsWith("44")) {
    return "0" + cleaned.slice(2);
  }

  return cleaned;
}

export default async function CustomersPage() {
  const customers = (await getCustomers()).sort(
    
  (a, b) => (b.orders ?? 0) - (a.orders ?? 0)
);

  const monthToDateRevenue =
    await getMonthToDateRevenue();

  const returningCustomers = customers.filter(
  (customer) => (customer.orders ?? 0) > 1
).length;

  const lifetimeRevenue = customers.reduce(
  (total, customer) => total + Number(customer.spend ?? 0),
  0
);
const topCustomer = [...customers].sort(
  (a, b) => Number(b.spend ?? 0) - Number(a.spend ?? 0)
)[0];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-amber-400">
        
      </h1>

      <div className="rounded-xl border border-amber-500/30 bg-[#1a1714] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-amber-200">
              Customer Management
            </h2>
            <p className="mt-1 text-amber-100/80">
              View customer history, spending and loyalty information.
            </p>
          </div>

          <div className="rounded-lg bg-amber-500/20 px-4 py-2">
            <span className="text-amber-300 text-sm">
              Phase B 🚀
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-amber-500/20 bg-[#1a1714] p-5">
          <p className="text-sm text-amber-100/70">Customers</p>
          <p className="mt-2 text-4xl font-bold text-amber-300">
  {customers.length}
</p>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-[#1a1714] p-5">
          <p className="text-sm text-amber-100/70">Returning</p>
          <p className="mt-2 text-4xl font-bold text-amber-300">
  {returningCustomers}
</p>
``
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-[#1a1714] p-5">
          <p className="text-sm text-amber-100/70">Revenue (MTD)</p>
          <p className="mt-2 text-4xl font-bold text-amber-300">
  £{monthToDateRevenue.toFixed(2)}

</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-[#1a1714] p-5">
  <p className="text-sm text-amber-100/70">
    Top Customer
  </p>

  <p className="mt-2 text-xl font-bold text-amber-300">
    {topCustomer?.name ?? "-"}
  </p>
</div>
<div className="rounded-xl border border-amber-500/20 bg-[#1a1714] p-5">
  

 
</div>
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-[#1a1714] p-5">
  <h2 className="mb-4 text-lg font-semibold text-amber-200">
    Customer List ({customers.length})
  </h2>

  <div className="overflow-x-auto">
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-amber-500/20 text-amber-200">
          <th className="pb-2">Customer</th>
          <th className="pb-2">Phone</th>
          <th className="pb-2">Orders</th>
          <th className="pb-2">Spend</th>
          <th className="pb-2">Last Order</th>
          <th className="pb-2">Tier</th>
        </tr>
      </thead>

      <tbody>
        {customers.map((customer) => (
          <tr
            key={customer.phone ?? customer.id}
            className="border-b border-amber-500/10"
          >
       
            
           <td className="py-3">
  <Link
    href={`/admin/customers/${encodeURIComponent(customer.phone ?? "")}`}
    className="text-amber-100 hover:text-amber-300"
  >
    {customer.name}
  </Link>
</td>

            <td className="py-3 text-amber-100">
            {displayPhone(customer.phone)}
            </td>

            <td className="py-3 text-amber-100">
              {customer.orders}
            </td>

            <td className="py-3 text-amber-100">
              £{Number(customer.spend ?? 0).toFixed(2)}
            </td>
            
            <td className="py-3 text-amber-100">
  {customer.lastOrderDate?.includes("/")
  ? customer.lastOrderDate
  : new Date(customer.lastOrderDate ?? "").toLocaleDateString("en-GB")}
</td>
<td className="py-3 text-amber-100">
  {getCustomerTier(customer.orders ?? 0)}
</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
    </div>
  );
}   