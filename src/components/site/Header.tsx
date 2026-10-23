"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bike, CalendarDays, Menu, Phone, ShoppingBag, X } from "lucide-react";
import { BrandLogo } from "@/components/ui";
import type { RestaurantConfig } from "@/lib/restaurant";
import { NAV_LINKS } from "@/lib/site";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function Brand({ config, onClick }: { config: RestaurantConfig; onClick?: () => void }) {
  return (
    <Link href="/" className="flex items-center gap-3 rounded-lg" aria-label={`${config.name} — home`} onClick={onClick}>
      <BrandLogo logoUrl={config.logoUrl} name={config.name} width={50} height={50} className="h-10 w-10 shrink-0 rounded-full object-cover lg:h-12 lg:w-12" />
      <span className="leading-none">
        <span className="block font-serif text-[1.4rem] font-semibold tracking-wide text-gold-light lg:text-[1.6rem]">
          {config.name}
        </span>
        {config.address.locality ? (
          <span className="mt-1 block text-[10px] font-medium tracking-[0.32em] text-cream/60 uppercase">{config.address.locality}</span>
        ) : null}
      </span>
    </Link>
  );
}

export function Header({ config }: { config: RestaurantConfig }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gold/15 bg-charcoal text-cream shadow-[0_10px_30px_-15px_rgba(0,0,0,0.6)]">
        <div className="container-x flex h-16 items-center justify-between gap-4 lg:h-20">
          <Brand config={config} />
          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const active = isActive(pathname, link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={`relative rounded-full px-3.5 py-2 text-sm font-medium transition ${
                        active ? "text-gold-light" : "text-cream/80 hover:text-cream"
                      }`}
                    >
                      {link.label}
                      {active ? (
                        <span className="absolute inset-x-3.5 -bottom-0.5 h-px bg-gold-light/70" aria-hidden="true" />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            <a
              href={config.phoneHref}
              className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-cream/85 transition hover:text-gold-light xl:inline-flex"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              {config.phoneDisplay}
            </a>
            <Link href="/order" className="btn btn-gold hidden px-5 py-2.5 sm:inline-flex">
              <ShoppingBag aria-hidden="true" />
              Order Collection
            </Link>
            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-full text-cream transition hover:bg-cream/10 lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {open ? (
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="brand-pattern fixed inset-0 z-50 flex animate-fade-in flex-col overflow-y-auto bg-charcoal text-cream lg:hidden"
        >
          <div className="container-x flex h-16 shrink-0 items-center justify-between border-b border-gold/15">
            <Brand config={config} onClick={() => setOpen(false)} />
            <button
              type="button"
              autoFocus
              onClick={() => setOpen(false)}
              className="grid h-11 w-11 place-items-center rounded-full transition hover:bg-cream/10"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Mobile" className="container-x pt-4">
            <ul className="divide-y divide-cream/10">
              {NAV_LINKS.map((link) => {
                const active = isActive(pathname, link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`block py-4 font-serif text-3xl font-semibold ${active ? "text-gold-light" : "text-cream"}`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="container-x mt-6 grid gap-3 pb-10">
            <a href={config.phoneHref} className="btn btn-outline-light">
              <Phone aria-hidden="true" />
              Call {config.phoneDisplay}
            </a>
            {config.delivery.enabled ? (
              <a href={config.delivery.url} target="_blank" rel="noopener noreferrer" className="btn btn-delivery">
                <Bike aria-hidden="true" />
                {config.delivery.label}
              </a>
            ) : null}
            <p className="mt-4 text-center text-sm leading-relaxed text-cream/60">
              {config.hoursShort}
              <br />
              {config.addressLine}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function MobileActionBar({ config }: { config: Pick<RestaurantConfig, "phoneHref"> }) {
  const pathname = usePathname();
  // The ordering page has its own fixed basket bar; just reserve space so the footer isn't covered.
  if (pathname.startsWith("/order")) return <div className="h-24 bg-charcoal lg:hidden" aria-hidden="true" />;
  return (
    <>
      <div className="h-16 bg-charcoal lg:hidden" aria-hidden="true" />
      <nav
        aria-label="Quick actions"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-gold/20 bg-charcoal/95 pb-[env(safe-area-inset-bottom)] text-cream backdrop-blur lg:hidden"
      >
        <div className="grid h-16 grid-cols-3">
          <a href={config.phoneHref} className="flex flex-col items-center justify-center gap-1 text-xs font-semibold">
            <Phone className="h-5 w-5 text-gold-light" aria-hidden="true" />
            Call us
          </a>
          <Link href="/book" className="flex flex-col items-center justify-center gap-1 text-xs font-semibold">
            <CalendarDays className="h-5 w-5 text-gold-light" aria-hidden="true" />
            Book a table
          </Link>
          <Link
            href="/order"
            className="flex flex-col items-center justify-center gap-1 bg-gold text-xs font-bold text-charcoal"
          >
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            Order collection
          </Link>
        </div>
      </nav>
    </>
  );
}
