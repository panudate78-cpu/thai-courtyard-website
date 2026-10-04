import { OPENING_HOURS } from "./site";

export const TIME_ZONE = "Europe/London";

export type SlotConfig = {
  leadTimeMinutes: number;
  slotIntervalMinutes: number;
  maxDaysAhead: number;
  closedDates: string[];
};

export type SlotDay = { date: string; label: string; times: string[] };
export type LondonNow = { date: string; minutes: number };

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_LONG = [
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
];

/** Current date ("YYYY-MM-DD") and minutes past midnight in UK time. */
export function londonNow(at: Date = new Date()): LondonNow {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "0";
  const hour = Number(get("hour")) % 24;
  return { date: `${get("year")}-${get("month")}-${get("day")}`, minutes: hour * 60 + Number(get("minute")) };
}

function parseDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y || 1970, (m || 1) - 1, d || 1));
}

export function isValidDateString(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = parseDate(date);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

export function weekdayOf(date: string) {
  return parseDate(date).getUTCDay();
}

export function addDays(date: string, days: number) {
  const dt = parseDate(date);
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function fromMinutes(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function hoursFor(date: string) {
  return OPENING_HOURS[weekdayOf(date)] ?? null;
}

export function formatDateShort(date: string) {
  const d = parseDate(date);
  return `${WEEKDAY_SHORT[d.getUTCDay()]} ${d.getUTCDate()} ${MONTH_SHORT[d.getUTCMonth()]}`;
}

export function formatDateLong(date: string) {
  const d = parseDate(date);
  return `${WEEKDAY_LONG[d.getUTCDay()]} ${d.getUTCDate()} ${MONTH_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function relativeDayLabel(date: string, today: string = londonNow().date) {
  if (date === today) return "Today";
  if (date === addDays(today, 1)) return "Tomorrow";
  return formatDateShort(date);
}

/** UK date + time for an ISO timestamp. */
export function londonDateTime(iso: string) {
  const now = londonNow(new Date(iso));
  return { date: now.date, time: fromMinutes(now.minutes) };
}

/** Collection slots for a given date, honouring opening hours, lead time and closures. */
export function getSlotsForDate(date: string, cfg: SlotConfig, now: LondonNow = londonNow(), graceMinutes = 0) {
  if (!isValidDateString(date) || date < now.date) return [];
  if (date > addDays(now.date, Math.max(1, cfg.maxDaysAhead) - 1)) return [];
  if (cfg.closedDates.includes(date)) return [];
  const hours = hoursFor(date);
  if (!hours) return [];
  const interval = Math.min(60, Math.max(5, cfg.slotIntervalMinutes));
  const open = toMinutes(hours.open);
  const close = toMinutes(hours.close);
  let start = Math.ceil((open + interval) / interval) * interval;
  if (date === now.date) {
    const earliest = now.minutes + cfg.leadTimeMinutes - graceMinutes;
    start = Math.max(start, Math.ceil(earliest / interval) * interval);
  }
  const slots: string[] = [];
  for (let t = start; t < close; t += interval) slots.push(fromMinutes(t));
  return slots;
}

export function getCollectionDays(cfg: SlotConfig, now: LondonNow = londonNow()): SlotDay[] {
  const days: SlotDay[] = [];
  for (let i = 0; i < Math.max(1, cfg.maxDaysAhead); i++) {
    const date = addDays(now.date, i);
    const times = getSlotsForDate(date, cfg, now);
    if (times.length) days.push({ date, label: relativeDayLabel(date, now.date), times });
  }
  return days;
}

export function isValidCollectionSlot(date: string, time: string, cfg: SlotConfig, graceMinutes = 10) {
  if (!/^\d{2}:\d{2}$/.test(time)) return false;
  return getSlotsForDate(date, cfg, londonNow(), graceMinutes).includes(time);
}

/** Table booking times: every 30 minutes from opening until an hour before closing. */
export function bookingTimesFor(date: string, closedDates: string[] = [], now: LondonNow = londonNow()) {
  if (!isValidDateString(date) || date < now.date || closedDates.includes(date)) return [];
  const hours = hoursFor(date);
  if (!hours) return [];
  const times: string[] = [];
  for (let t = toMinutes(hours.open); t <= toMinutes(hours.close) - 60; t += 30) {
    if (date === now.date && t < now.minutes + 30) continue;
    times.push(fromMinutes(t));
  }
  return times;
}
