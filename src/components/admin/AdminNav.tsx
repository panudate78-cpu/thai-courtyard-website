"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays,
  CalendarRange,
  ExternalLink,
  FileBarChart,
  LayoutDashboard,
  LineChart,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  PieChart,
  Search,
  Settings as SettingsIcon,
  ShoppingBag,
  Soup,
  Sparkles,
  Store,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";


type Counts = { newOrders: number; pendingBookings: number; unreadMessages: number };
type NavConfig = { name: string; logoUrl: string; setupCompleted: boolean };

export function AdminNav({ counts, config, fallbackPassword = false }: { counts: Counts; config: NavConfig; fallbackPassword?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const groups = [
    {
      label: "Operations",
      links: [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard, badge: 0 },
        { href: "/admin/orders", label: "Orders", icon: ShoppingBag, badge: counts.newOrders },
        { href: "/admin/customers", label: "Customers", icon: Users, badge: 0 },
        { href: "/admin/menu", label: "Menu & prices", icon: UtensilsCrossed, badge: 0 },
        { href: "/admin/menu/import", label: "Menu import", icon: UtensilsCrossed, badge: 0 },
        { href: "/admin/bookings", label: "Bookings", icon: CalendarDays, badge: counts.pendingBookings },
        { href: "/admin/messages", label: "Messages", icon: Mail, badge: counts.unreadMessages },
        { href: "/admin/settings", label: "Settings", icon: SettingsIcon, badge: 0 },
      ],
    },
    {
      label: "Business",
      links: [
        { href: "/admin/sales", label: "Sales", icon: LineChart, badge: 0 },
        { href: "/admin/food", label: "Food performance", icon: Soup, badge: 0 },
        { href: "/admin/booking-analytics", label: "Booking analytics", icon: CalendarRange, badge: 0 },
        { href: "/admin/customer-analytics", label: "Customer analytics", icon: PieChart, badge: 0 },
        { href: "/admin/marketing", label: "Marketing", icon: Megaphone, badge: 0 },
        { href: "/admin/reports", label: "Reports", icon: FileBarChart, badge: 0 },
        { href: "/admin/restaurant", label: "Business settings", icon: Store, badge: 0 },
        { href: "/setup", label: "Setup wizard", icon: Sparkles, badge: 0 },
        { href: "/admin/seo", label: "SEO", icon: Search, badge: 0 },
      ],
    },
  ];

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.replace("/admin/login");
    router.refresh();
  }

  const nav = (
    <nav aria-label="Admin">
      {groups.map((group) => (
        <div key={group.label} className="mb-4">
          <p className="px-3 pb-1 text-[10px] font-semibold tracking-[0.22em] text-cream/40 uppercase">{group.label}</p>
          <ul className="space-y-1">
            {group.links.map(({ href, label, icon: Icon, badge }) => {
              const active = isActive(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active ? "bg-gold text-charcoal" : "text-cream/80 hover:bg-cream/10 hover:text-cream"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="flex-1">{label}</span>
                    {badge > 0 ? (
                      <span
                        className={`min-w-6 rounded-full px-1.5 py-0.5 text-center text-xs font-bold ${
                          active ? "bg-charcoal text-cream" : "bg-gold text-charcoal"
                        }`}
                      >
                        {badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const footer = (
    <div className="space-y-1 border-t border-cream/10 pt-4">
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cream/70 hover:bg-cream/10 hover:text-cream"
      >
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
        View website
      </a>
      <button
        type="button"
        onClick={logout}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-cream/70 hover:bg-cream/10 hover:text-cream"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        Log out
      </button>
    </div>
  );

  return (
    <>
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between bg-charcoal px-4 text-cream lg:hidden print:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <Image src={config.logoUrl} alt="" width={34} height={34} unoptimized className="h-8 w-8 rounded-full object-cover" />
          <span className="font-serif text-lg font-semibold text-gold-light">{config.name} Admin</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="admin-mobile-nav"
          aria-label={open ? "Close navigation" : "Open navigation"}
          className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-cream/10"
        >
          {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          {!open && counts.newOrders > 0 ? (
            <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-gold" aria-hidden="true" />
          ) : null}
        </button>
      </div>
      {open ? (
        <div id="admin-mobile-nav" className="fixed inset-x-0 top-14 z-40 max-h-[calc(100svh-3.5rem)] space-y-4 overflow-y-auto bg-charcoal p-4 shadow-2xl lg:hidden">
          {nav}
          {footer}
        </div>
      ) : null}

      <aside className="hidden bg-charcoal text-cream lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:p-5 print:hidden">
        <Link href="/admin" className="flex items-center gap-3 px-2">
          <Image src={config.logoUrl} alt="" width={46} height={46} unoptimized className="h-11 w-11 rounded-full object-cover" />
          <span className="leading-tight">
            <span className="block font-serif text-xl font-semibold text-gold-light">{config.name}</span>
            <span className="text-[10px] tracking-[0.3em] text-cream/50 uppercase">Admin</span>
          </span>
        </Link>
        <div className="mt-8 flex-1 overflow-y-auto">{nav}</div>
        {!config.setupCompleted ? (
          <Link href="/setup" className="mb-3 block rounded-xl bg-gold px-3 py-2.5 text-sm font-semibold text-charcoal">Finish setup wizard →</Link>
        ) : null}
        {fallbackPassword ? (
          <p className="mb-3 rounded-xl bg-red-500/15 px-3 py-2 text-xs text-red-200">Using the demo admin password. Set ADMIN_PASSWORD before going live.</p>
        ) : null}
        {footer}
      </aside>
    </>
  );
}
