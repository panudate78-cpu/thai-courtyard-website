"use client";

import { Eye, Pause } from "lucide-react";
import { useCallback, useState } from "react";
import { POLL_INTERVALS, SERVICE_WINDOW } from "@/lib/refresh-schedule";
import { usePolling, useServiceWindow } from "@/lib/use-polling";
import type { VisitStats } from "@/lib/visits";
const formatNumber = new Intl.NumberFormat("en-GB");

function compact(value: number) {
  return value >= 10_000 ? new Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 1 }).format(value) : formatNumber.format(value);
}

/**
 * Compact "Site visits" panel for the admin sidebar footer.
 *
 * Shows today's public page views, the last seven days and all-time totals.
 * Refreshes from /api/admin/visits once a minute — but only during trading hours
 * (Tue – Sat, 12:00 – 21:00) and while the tab is visible, so counter polls
 * never keep the database awake overnight. Outside those hours the panel shows
 * the figures rendered with the page.
 * Admin page views are never recorded by the tracker.
 */
export function VisitCounter({ initial }: { initial: VisitStats | null }) {
  const [stats, setStats] = useState<VisitStats | null>(initial);
  const serviceWindow = useServiceWindow();

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/visits", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { stats?: VisitStats | null };
      if (data.stats) setStats(data.stats);
    } catch {
      // Keep the last known figures; the next poll will try again.
    }
  }, []);

  usePolling(refresh, { intervalMs: POLL_INTERVALS.visitsMs });

  if (!stats) {
    return (
      <div className="rounded-xl bg-cream/5 px-3 py-2.5 ring-1 ring-cream/10">
        <p className="text-[10px] font-semibold tracking-[0.22em] text-cream/40 uppercase">Site visits</p>
        <p className="mt-1 text-[11px] text-cream/45">Counter unavailable</p>
      </div>
    );
  }

  const max = Math.max(1, ...stats.days.map((day) => day.views));
  const updated = new Date(stats.updatedAt).toLocaleTimeString("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
  });
  const trend = stats.today - stats.yesterday;
  const trendLabel =
    stats.yesterday === 0
      ? null
      : trend === 0
      ? "Same as yesterday"
      : `${trend > 0 ? "▲" : "▼"} ${compact(Math.abs(trend))} vs yesterday`;

  return (
    <section
      aria-label="Site visits"
      title={`Updated ${updated} · excludes admin page views · auto-updates ${SERVICE_WINDOW.label.toLowerCase()} only`}
      className="rounded-xl bg-cream/5 px-3 py-2.5 ring-1 ring-cream/10"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.22em] text-cream/40 uppercase">
          <Eye className="h-3 w-3" aria-hidden="true" />
          Site visits
        </p>
        {serviceWindow.open === true ? (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.12em] text-emerald-300 uppercase"
            title={`Updates automatically every ${POLL_INTERVALS.visitsMs / 60_000} minute while this tab is visible`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
            Live
          </span>
        ) : serviceWindow.open === false ? (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-cream/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.12em] text-cream/50 uppercase"
            title={`Auto-updates pause outside ${SERVICE_WINDOW.label} to save database compute`}
          >
            <Pause className="h-2.5 w-2.5" aria-hidden="true" />
            Paused
          </span>
        ) : null}
      </div>

      <p className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5">
        <span className="text-2xl leading-none font-semibold text-cream">{formatNumber.format(stats.today)}</span>
        <span className="text-[11px] text-cream/50">{stats.today === 1 ? "view today" : "views today"}</span>
      </p>
      {trendLabel ? <p className="mt-0.5 text-[10px] text-cream/40">{trendLabel}</p> : null}

      <div
        className="mt-2 flex h-8 items-end gap-1"
        role="img"
        aria-label={`Daily page views, last seven days: ${stats.days
          .map((day) => `${day.label} ${day.views}`)
          .join(", ")}`}
      >
        {stats.days.map((day, index) => {
          const isToday = index === stats.days.length - 1;
          const height = day.views === 0 ? 8 : Math.max(12, Math.round((day.views / max) * 100));
          return (
            <span
              key={day.date}
              className={`min-w-0 flex-1 rounded-t-sm ${isToday ? "bg-gold" : "bg-gold/35"}`}
              style={{ height: `${height}%` }}
              title={`${day.label}: ${formatNumber.format(day.views)} ${day.views === 1 ? "view" : "views"}`}
            />
          );
        })}
      </div>

      <dl className="mt-2 grid grid-cols-2 gap-x-2 text-[11px]">
        <div className="flex items-baseline justify-between gap-1">
          <dt className="text-cream/40">7 days</dt>
          <dd className="font-semibold text-cream/90">{compact(stats.last7)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-1">
          <dt className="text-cream/40">All time</dt>
          <dd className="font-semibold text-cream/90">{compact(stats.total)}</dd>
        </div>
      </dl>

      <p className="mt-1.5 text-[10px] leading-relaxed text-cream/40">
        {stats.total === 0
          ? "No public visits recorded yet · admin views excluded"
          : `${formatNumber.format(stats.uniqueToday)} ${stats.uniqueToday === 1 ? "visitor" : "visitors"} today · admin views excluded`}
      </p>
    </section>
  );
}
