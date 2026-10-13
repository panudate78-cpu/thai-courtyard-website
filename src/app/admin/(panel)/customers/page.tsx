     import Link from "next/link";
import { getCustomerStats } from "@/lib/orders";
function getCustomerTier(orderCount: number) {
  if (orderCount >= 50) return "👑 VIP";
  if (orderCount >= 20) return "⭐ Gold";
  if (orderCount >= 5) return "🟢 Regular";
  return "Customer";
}

export default async function CustomersPage() {
  const customers = await getCustomerStats();



  const returningCustomers = customers.filter(
    (customer) => customer.orders > 1
  ).length;

  const lifetimeRevenue = customers.reduce(
    (total, customer) => total + customer.spend,
    0
  );

  const topCustomer = customers[0];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-amber-400">
        Customers
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

      <div className="grid gap-4 md:grid-cols-5">
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
          <p className="text-sm text-amber-100/70">Lifetime Revenue</p>
          <p className="mt-2 text-4xl font-bold text-amber-300">
  £{(lifetimeRevenue / 100).toFixed(2)}
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
  <p className="text-sm text-amber-100/70">
    Historic Customers
  </p>

 
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
            key={customer.phone}
            className="border-b border-amber-500/10"
          >
       
            
           <td className="py-3">
  <Link
    href={`/admin/customers/${encodeURIComponent(customer.phone)}`}
    className="text-amber-100 hover:text-amber-300"
  >
    {customer.name}
  </Link>
</td>

            <td className="py-3 text-amber-100">
              {customer.phone}
            </td>

            <td className="py-3 text-amber-100">
              {customer.orders}
            </td>

            <td className="py-3 text-amber-100">
              £{(customer.spend / 100).toFixed(2)}
            </td>
            
            <td className="py-3 text-amber-100">
  {customer.lastOrder}
</td>
<td className="py-3 text-amber-100">
  {getCustomerTier(customer.orders)}
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