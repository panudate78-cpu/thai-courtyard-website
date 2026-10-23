import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, CalendarDays, Clock, Mail, PoundSterling, ShoppingBag } from "lucide-react";
import { BusinessOverview } from "@/components/admin/business/BusinessOverview";
import { OrdersBoard } from "@/components/admin/OrdersBoard";
import { getDashboardStats, listBookings } from "@/lib/admin-data";
import { formatPrice } from "@/lib/format";
import { formatDateLong, londonNow, relativeDayLabel } from "@/lib/hours";
import { listOrders } from "@/lib/orders";
import { getRestaurantConfigSafe } from "@/lib/restaurant";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Dashboard" };

const ANALYTICS_LINKS: { href: string; label: string; description: string }[] = [
  { href: "/admin/sales", label: "Sales", description: "Revenue, daily, monthly & yearly trends" },
  { href: "/admin/food", label: "Food performance", description: "Best-selling dishes, categories & margins" },
  { href: "/admin/booking-analytics", label: "Booking analytics", description: "Covers, popular times & party sizes" },
  { href: "/admin/customer-analytics", label: "Customer analytics", description: "New vs returning, tiers & top spenders" },
  { href: "/admin/marketing", label: "Marketing", description: "Vouchers, promotions & reviews" },
  { href: "/admin/reports", label: "Reports", description: "Downloadable CSV & PDF documents" },
];

function OpStat({
  label,
  value,
  note,
  icon: Icon,
  href,
  alert = false,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: LucideIcon;
  href?: string;
  alert?: boolean;
}) {
  const body = (
    <div
      className={`adm-card h-full border-l-4 p-4 transition hover:shadow-md ${
        alert ? "border-l-gold" : "border-l-teak/15"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold tracking-wide text-black/50 uppercase">{label}</p>
        <span className="relative">
          <Icon className="h-4 w-4 text-gold-deep" aria-hidden="true" />
          {alert ? (
            <span className="absolute -top-1 -right-1.5 h-2 w-2 rounded-full bg-chili" aria-hidden="true" />
          ) : null}
        </span>
      </div>
      <p className="mt-1.5 text-3xl font-bold tracking-tight text-charcoal">{value}</p>
      <p className={`mt-1 text-xs ${alert ? "font-semibold text-chili" : "text-black/45"}`}>{note}</p>
    </div>
  );
  return href ? (
    <Link
      href={href}
      className="block rounded-2xl focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
    >
      {body}
    </Link>
  ) : (
    body
  );
}

export default async function AdminDashboardPage() {
  const today = londonNow().date;
  const [stats, orders, bookings, settings, config] = await Promise.all([
    getDashboardStats(),
    listOrders({ scope: "live" }),
    listBookings(150),
    getSettings(),
    getRestaurantConfigSafe(),
  ]);
  const upcoming = bookings
    .filter((b) => b.date >= today && (b.status === "pending" || b.status === "confirmed"))
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    .slice(0, 6);

  return (
    <div className="space-y-8">
      {!config.setupCompleted ? (
        <section className="brand-pattern rounded-3xl bg-charcoal p-5 text-cream sm:p-6">
          <p className="text-xs font-bold tracking-widest text-gold uppercase">Welcome — your restaurant is almost live</p>
          <h2 className="mt-1 font-serif text-2xl font-semibold">Finish the Setup Wizard to launch</h2>
          <p className="mt-1 max-w-2xl text-sm text-cream/70">
            Add your logo, business details, opening hours and menu. Until then, the website shows the demo restaurant and the numbers below include demo data — everything is safe to explore.
          </p>
          <Link href="/setup" className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-charcoal">
            Start setup <ArrowRight aria-hidden="true" />
          </Link>
        </section>
      ) : null}
      {/* ── Compact header ─────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow-dark">Operations today</p>
          <h1 className="mt-1 font-serif text-2xl font-semibold text-charcoal sm:text-3xl">Dashboard</h1>
          <p className="mt-0.5 text-sm text-black/50">{formatDateLong(today)}</p>
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

      {/* ── Operational summary — always first, no scrolling needed ────── */}
      <section aria-label="Operational summary">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <OpStat
            label="New orders"
            value={stats.newOrders}
            note={stats.newOrders > 0 ? "Action needed" : "All caught up"}
            icon={ShoppingBag}
            alert={stats.newOrders > 0}
            href="/admin/orders"
          />
          <OpStat
            label="Pending bookings"
            value={stats.pendingBookings}
            note={stats.pendingBookings > 0 ? "Awaiting confirmation" : "Nothing waiting"}
            icon={CalendarDays}
            alert={stats.pendingBookings > 0}
            href="/admin/bookings"
          />
          <OpStat
            label="Unread messages"
            value={stats.unreadMessages}
            note={stats.unreadMessages > 0 ? "Open inbox" : "All read"}
            icon={Mail}
            alert={stats.unreadMessages > 0}
            href="/admin/messages"
          />
          <OpStat
            label="Collections today"
            value={stats.todayOrders}
            note="Pickups scheduled today"
            icon={Clock}
            href="/admin/orders"
          />
          <OpStat
            label="Today's value"
            value={formatPrice(stats.todayValue)}
            note="Excludes cancelled"
            icon={PoundSterling}
            href="/admin/sales"
          />
        </div>
      </section>

      {/* ── Operations ─────────────────────────────────────────────────── */}
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

      {/* ── Business dashboard — analytics live below operations ───────── */}
      <section aria-labelledby="business-dashboard" className="space-y-4 border-t border-teak/15 pt-8">
        <div>
          <p className="eyebrow-dark">Business dashboard</p>
          <h2 id="business-dashboard" className="mt-1 font-serif text-2xl font-semibold text-charcoal sm:text-3xl">
            Performance &amp; analytics
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-black/55">
            Sales, customer metrics, yearly revenue and best-selling dishes — the full picture sits below the day-to-day
            work. Deeper breakdowns are in the Business area of the side menu.
          </p>
        </div>

        <BusinessOverview />

        <nav aria-label="Business analytics pages">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {ANALYTICS_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="adm-card group h-full p-4 transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
              >
                <p className="flex items-center justify-between gap-2 text-sm font-semibold text-charcoal">
                  {link.label}
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-gold-deep transition group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </p>
                <p className="mt-1 text-xs leading-5 text-black/50">{link.description}</p>
              </Link>
            ))}
          </div>
        </nav>
      </section>
    </div>
  );
}
