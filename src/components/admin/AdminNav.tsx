"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays,
  ExternalLink,
  LayoutDashboard,
  Users,
  LogOut,
  Mail,
  Menu,
  Settings as SettingsIcon,
  ShoppingBag,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { IMG } from "@/lib/image-manifest";

type Counts = { newOrders: number; pendingBookings: number; unreadMessages: number };

export function AdminNav({ counts }: { counts: Counts }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, badge: 0 },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag, badge: counts.newOrders },

  { href: "/admin/customers", label: "Customers", icon: Users, badge: 0 },

  { href: "/admin/menu", label: "Menu & prices", icon: UtensilsCrossed, badge: 0 },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarDays, badge: counts.pendingBookings },
  { href: "/admin/messages", label: "Messages", icon: Mail, badge: counts.unreadMessages },
  { href: "/admin/settings", label: "Settings", icon: SettingsIcon, badge: 0 },
];

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.replace("/admin/login");
    router.refresh();
  }

  const nav = (
    <nav aria-label="Admin">
      <ul className="space-y-1">
        {links.map(({ href, label, icon: Icon, badge }) => {
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
                <Icon className="h-4 w-4" aria-hidden="true" />
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
          <Image src={IMG.logo.src} alt="" width={34} height={32} className="h-8 w-auto" />
          <span className="font-serif text-lg font-semibold text-gold-light">Thai Courtyard Admin</span>
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
        <div id="admin-mobile-nav" className="fixed inset-x-0 top-14 z-40 space-y-4 bg-charcoal p-4 shadow-2xl lg:hidden">
          {nav}
          {footer}
        </div>
      ) : null}

      <aside className="hidden bg-charcoal text-cream lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:p-5 print:hidden">
        <Link href="/admin" className="flex items-center gap-3 px-2">
          <Image src={IMG.logo.src} alt="" width={46} height={44} className="h-11 w-auto" />
          <span className="leading-tight">
            <span className="block font-serif text-xl font-semibold text-gold-light">Thai Courtyard</span>
            <span className="text-[10px] tracking-[0.3em] text-cream/50 uppercase">Admin</span>
          </span>
        </Link>
        <div className="mt-8 flex-1 overflow-y-auto">{nav}</div>
        {footer}
      </aside>
    </>
  );
}
