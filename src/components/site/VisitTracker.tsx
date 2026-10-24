"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

function honoursDoNotTrack() {
  const win = window as typeof window & { doNotTrack?: string | null };
  return navigator.doNotTrack === "1" || win.doNotTrack === "1";
}

/**
 * Sends one anonymous page view per public page navigation to /api/track.
 *
 * Runs only inside the public site layout, so the admin panel is never counted.
 * The server applies the same rules again, skips bots, and stores no cookies or
 * IP addresses. Nothing renders, and every failure is silent.
 */
export function VisitTracker() {
  const pathname = usePathname();
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    if (lastSent.current === pathname) return;
    if (honoursDoNotTrack()) return;
    lastSent.current = pathname;

    const referrer =
      document.referrer && !document.referrer.startsWith(window.location.origin) ? document.referrer : "";

    try {
      void fetch("/api/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path: pathname, referrer }),
        cache: "no-store",
        keepalive: true,
        credentials: "omit",
      }).catch(() => undefined);
    } catch {
      // Analytics must never surface to the visitor.
    }
  }, [pathname]);

  return null;
}
