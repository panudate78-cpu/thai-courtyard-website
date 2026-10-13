import { getCustomerByPhone } from "@/lib/orders";

export default async function CustomerProfilePage({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  const { phone } = await params;

  const customer = await getCustomerByPhone(
    decodeURIComponent(phone)
  );

  if (!customer) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold text-amber-400">
          Customer Not Found
        </h1>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
  {customer.name}
</h1>

      <div className="rounded-xl border border-amber-500/20 bg-[#1a1714] p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-amber-100/70">Phone</p>
            <p className="text-amber-100">{customer.phone}</p>
          </div>

          <div>
            <p className="text-amber-100/70">Email</p>
            <p className="text-amber-100">
              {customer.email || "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-amber-100/70">Orders</p>
            <p className="text-amber-100">{customer.orders}</p>
          </div>

          <div>
            <p className="text-amber-100/70">Lifetime Spend</p>
            <p className="text-amber-100">
              £{(customer.spend / 100).toFixed(2)}
            </p>
          </div>

          <div>
            <p className="text-amber-100/70">Last Order</p>
            <p className="text-amber-100">
              {new Date(customer.lastOrder).toLocaleDateString("en-GB")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}