import { addDays, formatDateLong, formatDateShort, isValidDateString, londonNow, weekdayOf } from "@/lib/hours";

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export function currentPeriod(today = londonNow().date) {
  const [year, month, day] = today.split("-").map(Number);
  return { today, year, month, day };
}

export function clampPeriod(yearRaw: unknown, monthRaw: unknown) {
  const now = currentPeriod();
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  return {
    year: Number.isInteger(year) && year >= 2020 && year <= 2100 ? year : now.year,
    month: Number.isInteger(month) && month >= 1 && month <= 12 ? month : now.month,
  };
}

export function monthBounds(year: number, month: number) {
  const mm = String(month).padStart(2, "0");
  const start = `${year}-${mm}-01`;
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const end = `${year}-${mm}-${String(days).padStart(2, "0")}`;
  return { start, end, days };
}

export function previousMonth(year: number, month: number) {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

export function formatMonthLabel(year: number, month: number) {
  return `${MONTHS[month - 1] ?? "Month"} ${year}`;
}

export function datesInRange(start: string, end: string) {
  if (!isValidDateString(start) || !isValidDateString(end) || start > end) return [];
  const dates: string[] = [];
  for (let date = start, guard = 0; date <= end && guard < 4000; date = addDays(date, 1), guard += 1) {
    dates.push(date);
  }
  return dates;
}

/** Monday-start week, using the same UTC weekday as collection dates. */
export function weekStartMonday(date: string) {
  const day = weekdayOf(date);
  const diff = day === 0 ? 6 : day - 1;
  return addDays(date, -diff);
}

export function weekLabel(monday: string) {
  const day = String(Number(monday.slice(8, 10)));
  const month = SHORT_MONTHS[Number(monday.slice(5, 7)) - 1] ?? "";
  return `w/c ${day} ${month}`;
}

export function sameDayLastYear(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const last = new Date(Date.UTC(year - 1, month, 0)).getUTCDate();
  return `${year - 1}-${String(month).padStart(2, "0")}-${String(Math.min(day, last)).padStart(2, "0")}`;
}

export function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Like-for-like window for a selected month. Incomplete months compare the same number of days. */
export function monthComparison(year: number, month: number, today = londonNow().date) {
  const bounds = monthBounds(year, month);
  const future = bounds.start > today;
  const current = today.slice(0, 7) === bounds.start.slice(0, 7);
  const end = future ? bounds.start : current ? today : bounds.end;
  const elapsed = future ? 0 : Number(end.slice(8, 10));
  const prev = previousMonth(year, month);
  const prevBounds = monthBounds(prev.year, prev.month);
  const prevElapsed = Math.min(elapsed, prevBounds.days);
  const prevEnd = prevElapsed === 0 ? null : isoDate(prev.year, prev.month, prevElapsed);
  return { ...bounds, fullEnd: bounds.end, end, future, current, elapsed, prev, prevBounds, prevEnd };
}

export function dashboardWindows(today = londonNow().date) {
  const { year, month, day } = currentPeriod(today);
  const weekStart = weekStartMonday(today);
  const prev = previousMonth(year, month);
  const prevBounds = monthBounds(prev.year, prev.month);
  return {
    today,
    yesterday: addDays(today, -1),
    weekStart,
    weekEnd: today,
    prevWeekStart: addDays(weekStart, -7),
    prevWeekEnd: addDays(today, -7),
    monthStart: monthBounds(year, month).start,
    monthEnd: today,
    prevMonthStart: prevBounds.start,
    prevMonthEnd: isoDate(prev.year, prev.month, Math.min(day, prevBounds.days)),
    yearStart: `${year}-01-01`,
    yearEnd: today,
    prevYearStart: `${year - 1}-01-01`,
    prevYearEnd: sameDayLastYear(today),
  };
}

export function generatedLabel(at = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(at);
}

export function growthPercent(current: number, previous: number): number | null {
  if (previous <= 0) return current <= 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export function formatGrowth(percent: number | null) {
  if (percent === null) return "No prior period";
  const sign = percent > 0 ? "+" : "";
  return `${sign}${percent.toFixed(1)}%`;
}

export { addDays, formatDateLong, formatDateShort, isValidDateString, londonNow, weekdayOf };
