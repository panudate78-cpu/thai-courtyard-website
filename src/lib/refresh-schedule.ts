import { fromMinutes, londonNow, weekdayOf } from "./hours";

/**
 * When the dashboard is allowed to auto-refresh, and how often.
 *
 * Every auto-refresh is a real database query, and the database (Neon) only
 * stops billing compute seconds once it has been idle for a few minutes. A
 * timer that fires every 15 seconds therefore keeps the database awake around
 * the clock — roughly 720 hours of compute a month.
 *
 * So auto-refresh only runs while the restaurant is actually trading:
 * Tuesday – Saturday, 12:00 – 21:00 UK time. Outside those hours the timers
 * are switched off completely (nothing is polled, nothing wakes the database)
 * and staff can still press Refresh to fetch on demand.
 */
export const SERVICE_WINDOW: {
  /** JS weekdays, 0 = Sunday … 6 = Saturday. */
  days: readonly number[];
  /** Minutes past midnight, UK time. */
  openMinutes: number;
  closeMinutes: number;
  label: string;
} = {
  days: [2, 3, 4, 5, 6],
  openMinutes: 12 * 60,
  closeMinutes: 21 * 60,
  label: "Tuesday – Saturday, 12:00 – 21:00",
};

/** How often each polling panel refreshes while the window is open. */
export const POLL_INTERVALS = {
  /** Orders board — a new order should show up well inside half a minute. */
  ordersMs: 20_000,
  /** Sidebar site-visit counter — numbers, not operations. */
  visitsMs: 60_000,
};

const DAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MINUTE_MS = 60_000;

/** True while auto-refresh should be running (UK time, regardless of the visitor's clock). */
export function isServiceWindowOpen(at: Date = new Date()) {
  const now = londonNow(at);
  const day = weekdayOf(now.date);
  return (
    SERVICE_WINDOW.days.includes(day) &&
    now.minutes >= SERVICE_WINDOW.openMinutes &&
    now.minutes < SERVICE_WINDOW.closeMinutes
  );
}

/**
 * Milliseconds until the window next flips between open and closed.
 * Capped at a week so a timer never waits longer than a few days.
 */
export function msUntilWindowChange(at: Date = new Date()) {
  const now = londonNow(at);
  const day = weekdayOf(now.date);
  const { days, openMinutes, closeMinutes } = SERVICE_WINDOW;
  const openToday = days.includes(day);

  if (openToday && now.minutes >= openMinutes && now.minutes < closeMinutes) {
    return (closeMinutes - now.minutes) * MINUTE_MS;
  }
  if (openToday && now.minutes < openMinutes) {
    return (openMinutes - now.minutes) * MINUTE_MS;
  }
  for (let offset = 1; offset <= 8; offset += 1) {
    if (days.includes((day + offset) % 7)) {
      return (offset * 24 * 60 - now.minutes + openMinutes) * MINUTE_MS;
    }
  }
  return 24 * 60 * MINUTE_MS;
}

/** "today at 12:00", "tomorrow at 12:00", "Tuesday at 12:00". */
export function describeWindowResume(at: Date = new Date()) {
  const now = londonNow(at);
  const day = weekdayOf(now.date);
  const { days, openMinutes } = SERVICE_WINDOW;
  const open = fromMinutes(openMinutes);

  if (days.includes(day) && now.minutes < openMinutes) return `today at ${open}`;
  for (let offset = 1; offset <= 8; offset += 1) {
    const next = (day + offset) % 7;
    if (days.includes(next)) return `${offset === 1 ? "tomorrow" : DAY_LONG[next]} at ${open}`;
  }
  return open;
}
