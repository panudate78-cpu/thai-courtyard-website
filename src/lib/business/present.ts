import { formatPrice } from "@/lib/format";
import { formatDateShort, weekdayOf } from "@/lib/hours";
import {
  SHORT_MONTHS,
  WEEKDAYS,
  dashboardWindows,
  datesInRange,
  formatGrowth,
  formatMonthLabel,
  growthPercent,
  isoDate,
  monthBounds,
  monthComparison,
  weekLabel,
  weekStartMonday,
} from "./dates";
import type { DaySales, Delta, GroupPoint, Metric, Point, Rank } from "./types";

export function money(pence: number) {
  return formatPrice(Math.round(pence));
}

export function compactMoney(pence: number) {
  const pounds = pence / 100;
  if (Math.abs(pounds) >= 1000) return `£${(pounds / 1000).toFixed(pounds >= 10000 ? 0 : 1)}k`;
  return `£${Math.round(pounds)}`;
}

export function delta(current: number, previous: number, label: string): Delta {
  return { percent: growthPercent(current, previous), label };
}

export function metric(partial: Metric): Metric {
  return partial;
}

export function fillDays(start: string, end: string, rows: DaySales[]): DaySales[] {
  const map = new Map(rows.map((row) => [row.date, row]));
  return datesInRange(start, end).map(
    (date) => map.get(date) ?? { date, revenuePence: 0, orders: 0, customers: 0, refundPence: 0 },
  );
}

export function weeklyPoints(days: DaySales[]): Point[] {
  const totals = new Map<string, number>();
  for (const day of days) {
    const key = weekStartMonday(day.date);
    totals.set(key, (totals.get(key) ?? 0) + day.revenuePence);
  }
  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([start, value]) => ({ label: weekLabel(start), value, title: `Week of ${start}: ${money(value)}` }));
}

export function dailyPoints(days: DaySales[], today: string): Point[] {
  return days.map((day) => {
    const closed = weekdayOf(day.date) === 0 || weekdayOf(day.date) === 1;
    const future = day.date > today;
    return {
      label: String(Number(day.date.slice(8, 10))),
      value: day.revenuePence,
      muted: closed || future || day.revenuePence === 0,
      title: `${formatDateShort(day.date)} · ${future ? "Not yet" : closed ? "Closed" : money(day.revenuePence)} · ${day.orders} orders`,
    };
  });
}

export function windowSum(days: DaySales[], start: string, end: string) {
  return days.reduce((total, day) => {
    if (day.date >= start && day.date <= end) {
      total.revenuePence += day.revenuePence;
      total.orders += day.orders;
      total.refundPence += day.refundPence;
    }
    return total;
  }, { revenuePence: 0, orders: 0, refundPence: 0 });
}

export { dashboardWindows, formatGrowth, formatMonthLabel, growthPercent, monthBounds, monthComparison, isoDate, SHORT_MONTHS, WEEKDAYS };

export function monthlyGroups(
  year: number,
  today: string,
  lookup: (year: number, month: number) => number,
): GroupPoint[] {
  const currentYear = Number(today.slice(0, 4));
  const currentMonth = Number(today.slice(5, 7));
  return SHORT_MONTHS.map((label, index) => {
    const month = index + 1;
    const future = year > currentYear || (year === currentYear && month > currentMonth);
    return {
      label,
      previous: lookup(year - 1, month),
      current: future ? null : lookup(year, month),
    };
  });
}

export function rankMoney(name: string, pence: number, hint?: string): Rank {
  return { name, value: pence, hint: hint ?? money(pence) };
}

export function dishRanks(dishes: { name: string; quantity: number; revenuePence: number; category: string }[], limit = 8) {
  return [...dishes]
    .sort((a, b) => b.quantity - a.quantity || b.revenuePence - a.revenuePence)
    .slice(0, limit)
    .map((dish) => ({
      name: dish.name,
      value: dish.quantity,
      hint: `${dish.quantity} sold · ${money(dish.revenuePence)}`,
    }));
}

export function categoryRanks(dishes: { category: string; quantity: number; revenuePence: number }[]) {
  const map = new Map<string, { quantity: number; revenuePence: number }>();
  for (const dish of dishes) {
    const current = map.get(dish.category) ?? { quantity: 0, revenuePence: 0 };
    current.quantity += dish.quantity;
    current.revenuePence += dish.revenuePence;
    map.set(dish.category, current);
  }
  const rows = [...map.entries()].map(([name, value]) => ({ name, ...value }));
  const total = rows.reduce((sum, row) => sum + row.revenuePence, 0) || 1;
  return rows
    .sort((a, b) => b.revenuePence - a.revenuePence)
    .map((row) => ({
      name: row.name,
      value: row.revenuePence,
      hint: `${money(row.revenuePence)} · ${Math.round((row.revenuePence / total) * 100)}% · ${row.quantity} items`,
    }));
}
