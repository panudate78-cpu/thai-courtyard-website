"use client";

import { useRouter } from "next/navigation";
import { MONTHS } from "@/lib/business/dates";

export function PeriodSelect({
  month,
  year,
  path,
  currentYear,
}: {
  month: number;
  year: number;
  path: string;
  currentYear: number;
}) {
  const router = useRouter();
  const years = Array.from({ length: 6 }, (_, index) => currentYear - index);
  if (!years.includes(year)) years.push(year);

  function go(nextMonth: number, nextYear: number) {
    const params = new URLSearchParams({ month: String(nextMonth), year: String(nextYear) });
    router.push(`${path}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <label className="text-xs font-semibold tracking-wide text-black/50 uppercase">
        Month
        <select
          className="adm-input mt-1 min-w-36"
          value={month}
          onChange={(event) => go(Number(event.target.value), year)}
        >
          {MONTHS.map((name, index) => (
            <option key={name} value={index + 1}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-semibold tracking-wide text-black/50 uppercase">
        Year
        <select className="adm-input mt-1 min-w-28" value={year} onChange={(event) => go(month, Number(event.target.value))}>
          {years
            .sort((a, b) => b - a)
            .map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
        </select>
      </label>
    </div>
  );
}
