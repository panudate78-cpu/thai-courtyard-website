import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { CalendarDays, Clock, Mail, PoundSterling, ShoppingBag } from "lucide-react";
import { BusinessOverview } from "@/components/admin/business/BusinessOverview";
import { OrdersBoard } from "@/components/admin/OrdersBoard";
import { getDashboardStats, listBookings } from "@/lib/admin-data";
import { formatPrice } from "@/lib/format";
import {
  formatDateLong,
  londonNow,
  relativeDayLabel,
} from "@/lib/hours";
import { listOrders } from "@/lib/orders";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Dashboard" };

function Stat({
  label,
  value,
  icon: Icon,
  href,
  highlight = false,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  href?: string;
  highlight?: boolean;
}) {
  const body = (
    <div className={`adm-card h-full p-4 transition ${highlight ? "ring-2 ring-amber-400" : ""} ${href ? "hover:shadow-md" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold tracking-wide text-black/50 uppercase">{label}</p>
        <Icon className="h-4 w-4 text-gold-deep" aria-hidden="true" />
      </div>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
  return href ? (
    <Link href={href} className="block rounded-2xl">
      {body}
    </Link>
  ) : (
    body
  );
}

export default async function AdminDashboardPage() {
  const today = londonNow().date;
  const [stats, orders, bookings, settings] = await Promise.all([
    getDashboardStats(),
    listOrders({ scope: "live" }),
    listBookings(150),
    getSettings(),
  ]);
  const upcoming = bookings
    .filter((b) => b.date >= today && (b.status === "pending" || b.status === "confirmed"))
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-black/50">{formatDateLong(today)}</p>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
        </div>
        <Link
          href="/admin/settings"
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            settings.orderingEnabled ? "bg-emerald-100 text-emerald-900" : "bg-red-100 text-red-800"
          }`}
        >
          {settings.orderingEnabled ? "● Online ordering is live" : "● Online ordering is paused"}
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="New orders" value={stats.newOrders} icon={ShoppingBag} highlight={stats.newOrders > 0} href="/admin/orders" />
        <Stat label="Collections today" value={stats.todayOrders} icon={Clock} />
        <Stat label="Today's value" value={formatPrice(stats.todayValue)} icon={PoundSterling} />
        <Stat label="Pending bookings" value={stats.pendingBookings} icon={CalendarDays} href="/admin/bookings" />
        <Stat label="Unread messages" value={stats.unreadMessages} icon={Mail} href="/admin/messages" />
      </div>

      <section aria-labelledby="live-orders">
        <h2 id="live-orders" className="mb-3 text-xl font-semibold">
          Live orders
        </h2>
        <OrdersBoard initialOrders={orders} scope="live" today={today} />
      </section>

      <section aria-labelledby="upcoming-bookings" className="adm-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 id="upcoming-bookings" className="text-xl font-semibold">
            Upcoming bookings
          </h2>
          <Link href="/admin/bookings" className="text-sm font-semibold text-teak hover:underline">
            Manage bookings →
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="mt-4 text-sm text-black/50">No upcoming bookings.</p>
        ) : (
          <ul className="mt-3 divide-y divide-black/5">
            {upcoming.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span className="font-semibold">
                  {relativeDayLabel(b.date, today)} · {b.time}
                </span>
                <span>
                  {b.name} · {b.partySize} {b.partySize === 1 ? "guest" : "guests"}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    b.status === "confirmed" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {b.status === "confirmed" ? "Confirmed" : "Awaiting confirmation"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <BusinessOverview />
    </div>
  );
}
