import Link from "next/link";
import type { ReactNode } from "react";
import { formatGrowth } from "@/lib/business/dates";
import type { Metric, Origin } from "@/lib/business/types";

export function PageIntro({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl">
        <p className="eyebrow-dark">{eyebrow}</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-charcoal sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 text-sm leading-6 text-black/60">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-end gap-3">{actions}</div> : null}
    </header>
  );
}

export function OriginBanner({
  origin,
  warning,
  note,
}: {
  origin: Origin;
  warning?: string;
  note: string;
}) {
  return (
    <div className={`rounded-2xl px-4 py-3 text-sm ring-1 ${warning ? "bg-amber-50 text-amber-950 ring-amber-200" : "bg-emerald-50 text-emerald-950 ring-emerald-200"}`}>
      <p className="font-semibold">{warning ? "Live data unavailable" : "Live restaurant data"}</p>
      <p className="mt-1 leading-6">{note}</p>
      {warning ? <p className="mt-1 font-medium">{warning}</p> : null}
    </div>
  );
}

export function OriginPill({ origin }: { origin: Origin }) {
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${origin === "live" ? "bg-emerald-50 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>
      Live
    </span>
  );
}

export function MetricGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      {metrics.map((item) => (
        <MetricCard key={item.label} metric={item} />
      ))}
    </div>
  );
}

export function MetricCard({ metric }: { metric: Metric }) {
  const long = metric.value.length > 18;
  const body = (
    <div className="adm-card flex h-full flex-col border-l-4 border-l-gold p-4 transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold tracking-wide text-black/50 uppercase">{metric.label}</p>
        <OriginPill origin={metric.origin} />
      </div>
      <p className={`mt-2 font-semibold tracking-tight text-charcoal ${long ? "text-lg leading-snug" : "text-2xl sm:text-3xl"}`}>{metric.value}</p>
      {metric.hint ? <p className="mt-1 text-xs leading-5 text-black/50">{metric.hint}</p> : null}
      {metric.delta ? <Growth delta={metric.delta} /> : <span className="mt-auto" />}
    </div>
  );
  if (!metric.href) return body;
  return (
    <Link href={metric.href} className="block rounded-2xl">
      {body}
    </Link>
  );
}

export function Growth({ delta }: { delta: { percent: number | null; label: string } }) {
  if (delta.percent === null) return <p className="mt-2 text-xs text-black/45">{delta.label}: no baseline</p>;
  if (delta.percent === 0) return <p className="mt-2 text-xs text-black/50">No change {delta.label}</p>;
  const up = delta.percent >= 0;
  return (
    <p className={`mt-2 text-xs font-semibold ${up ? "text-emerald-700" : "text-chili"}`}>
      {up ? "Up" : "Down"} {formatGrowth(delta.percent).replace("+", "").replace("-", "")} <span className="font-medium text-black/50">{delta.label}</span>
    </p>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="adm-card p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description ? <p className="mt-1 max-w-3xl text-sm leading-6 text-black/55">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function DataTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  if (!rows.length) return <p className="text-sm text-black/50">No rows in this period.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead>
          <tr className="border-b border-black/10 text-[11px] tracking-wide text-black/45 uppercase">
            {columns.map((column) => (
              <th key={column} className="px-2 py-2 font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-black/5">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-2 py-2 whitespace-nowrap">
                  {cell || "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ExportLinks({ hrefBase }: { hrefBase: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <a className="adm-btn" href={`${hrefBase}${hrefBase.includes("?") ? "&" : "?"}format=csv`}>
        Download CSV
      </a>
      <a className="adm-btn" href={`${hrefBase}${hrefBase.includes("?") ? "&" : "?"}format=pdf`}>
        Download PDF
      </a>
    </div>
  );
}
