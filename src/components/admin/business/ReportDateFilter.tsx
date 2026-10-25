"use client";

import { useRouter } from "next/navigation";
import type { ReportRange } from "@/lib/business/reports-live";

const OPTIONS: { id: ReportRange; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 Days" },
  { id: "30d", label: "Last 30 Days" },
  { id: "12m", label: "Last 12 Months" },
  { id: "custom", label: "Custom Range" },
];

export function ReportDateFilter({ range, start, end }: { range: ReportRange; start: string; end: string }) {
  const router = useRouter();
  function choose(next: ReportRange) {
    const params = new URLSearchParams({ range: next });
    if (next === "custom") {
      params.set("start", start);
      params.set("end", end);
    }
    router.push(`/admin/reports?${params.toString()}`);
  }
  function apply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const params = new URLSearchParams({ range: "custom", start: String(data.get("start")), end: String(data.get("end")) });
    router.push(`/admin/reports?${params.toString()}`);
  }
  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex flex-wrap gap-2" aria-label="Report date range">
        {OPTIONS.map((option) => (
          <button key={option.id} type="button" onClick={() => choose(option.id)} aria-pressed={range === option.id}
            className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${range === option.id ? "border-charcoal bg-charcoal text-white" : "border-black/10 bg-white hover:bg-black/[0.04]"}`}>
            {option.label}
          </button>
        ))}
      </div>
      {range === "custom" ? (
        <form key={`${start}-${end}`} onSubmit={apply} className="flex flex-wrap items-end gap-2">
          <label><span className="adm-label">From</span><input className="adm-input" type="date" name="start" defaultValue={start} required /></label>
          <label><span className="adm-label">To</span><input className="adm-input" type="date" name="end" defaultValue={end} required /></label>
          <button className="adm-btn-primary" type="submit">Apply range</button>
        </form>
      ) : null}
    </div>
  );
}
