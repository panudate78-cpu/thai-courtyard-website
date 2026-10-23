import { addDays, weekdayOf } from "@/lib/hours";
import {
  SHORT_MONTHS,
  WEEKDAYS,
  datesInRange,
  formatMonthLabel,
  isoDate,
  monthBounds,
  weekLabel,
  weekStartMonday,
} from "./dates";
import { estimatedMargin, marginLabel } from "./margins";
import type { GroupPoint, Point, Rank } from "./types";

export type DaySales = {
  date: string;
  revenuePence: number;
  orders: number;
  customers: number;
  refundPence: number;
};

const SEASON = [0, 0.82, 0.85, 0.9, 0.95, 1, 1.05, 1.08, 1.02, 1.06, 1.04, 1.1, 1.22];

function yearFactor(year: number) {
  return Math.min(1.18, Math.max(0.7, 0.78 + (year - 2022) * 0.07));
}

function hash(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return (year * 1000 + month * 40 + day) >>> 0;
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function isSampleClosed(date: string) {
  const weekday = weekdayOf(date);
  if (weekday === 1) return true; // demo defaults: closed Mondays (see DEFAULT_OPENING_HOURS)
  const md = date.slice(4);
  return md === "-12-25" || md === "-12-26" || md === "-01-01";
}

/** Deterministic collection-day figures. Future dates stay at zero — they are not forecasts. */
export function sampleDay(date: string, today: string): DaySales {
  if (date > today || isSampleClosed(date)) {
    return { date, revenuePence: 0, orders: 0, customers: 0, refundPence: 0 };
  }
  const [year, month] = date.split("-").map(Number);
  const random = rng(hash(date));
  const weekday = weekdayOf(date);
  const dow = weekday === 6 ? 1.48 : weekday === 5 ? 1.32 : weekday === 4 ? 1.08 : weekday === 2 ? 0.88 : 1;
  const noise = 0.84 + random() * 0.32;
  const revenuePence = Math.round(36000 * (SEASON[month] ?? 1) * yearFactor(year) * dow * noise);
  const average = 2500 + Math.round(random() * 700);
  const orders = Math.max(6, Math.round(revenuePence / average));
  const customers = Math.max(4, Math.round(orders * (0.72 + random() * 0.12)));
  const refundPence = random() > 0.72 ? Math.round(revenuePence * (0.015 + random() * 0.02)) : 0;
  return { date, revenuePence, orders, customers, refundPence };
}

export function sampleDays(start: string, end: string, today: string): DaySales[] {
  return datesInRange(start, end).map((date) => sampleDay(date, today));
}

export function sumDays(days: DaySales[], start: string, end: string) {
  return days.reduce(
    (total, day) => {
      if (day.date < start || day.date > end) return total;
      total.revenuePence += day.revenuePence;
      total.orders += day.orders;
      total.refundPence += day.refundPence;
      return total;
    },
    { revenuePence: 0, orders: 0, refundPence: 0 },
  );
}

export function sampleCustomersForOrders(orders: number) {
  if (orders <= 0) return 0;
  return Math.max(1, Math.round(orders * 0.74));
}

const DISHES: { name: string; category: string; quantity: number; unitPence: number }[] = [
  { name: "House Burger", category: "Mains", quantity: 186, unitPence: 1550 },
  { name: "Grilled Chicken", category: "Mains", quantity: 164, unitPence: 1650 },
  { name: "Crispy Halloumi", category: "Starters", quantity: 142, unitPence: 750 },
  { name: "Fish & Chips", category: "Mains", quantity: 128, unitPence: 1600 },
  { name: "Garden Risotto", category: "Mains", quantity: 121, unitPence: 1450 },
  { name: "Mixed Grill", category: "Grill", quantity: 96, unitPence: 2400 },
  { name: "Steak Frites", category: "Mains", quantity: 84, unitPence: 2150 },
  { name: "Grilled Salmon", category: "Grill", quantity: 79, unitPence: 1950 },
  { name: "Sticky Toffee Pudding", category: "Desserts", quantity: 74, unitPence: 750 },
  { name: "Lamb Chops", category: "Grill", quantity: 61, unitPence: 2200 },
  { name: "Chicken Wings", category: "Starters", quantity: 58, unitPence: 800 },
  { name: "Chocolate Brownie", category: "Desserts", quantity: 44, unitPence: 700 },
  { name: "Soup of the Day", category: "Starters", quantity: 39, unitPence: 650 },
  { name: "Onion Rings", category: "Sides", quantity: 22, unitPence: 450 },
  { name: "House Salad", category: "Sides", quantity: 14, unitPence: 450 },
  { name: "Seasonal Greens", category: "Sides", quantity: 11, unitPence: 450 },
  { name: "Garlic Bread", category: "Starters", quantity: 9, unitPence: 450 },
  { name: "Still Water 500ml", category: "Drinks", quantity: 8, unitPence: 200 },
];

export function sampleDishes() {
  return DISHES.map((dish) => {
    const revenuePence = dish.quantity * dish.unitPence;
    const margin = estimatedMargin(dish.category);
    return {
      ...dish,
      revenuePence,
      profitPence: Math.round(revenuePence * margin),
      marginLabel: marginLabel(dish.category),
    };
  });
}

export function sampleAddons(): Rank[] {
  return [
    { name: "Skin-on fries", value: 96, hint: "£336 · side add-on" },
    { name: "Seasonal greens", value: 74, hint: "£259 · side add-on" },
    { name: "Chilli jam", value: 63, hint: "£31" },
    { name: "House salad", value: 41, hint: "£123 · side add-on" },
    { name: "Garlic mayo", value: 38, hint: "Included" },
  ];
}

export function sampleDrinks(): Rank[] {
  return [
    { name: "Coke 330ml", value: 88, hint: "£220" },
    { name: "Still Water 500ml", value: 54, hint: "£108" },
    { name: "Sprite 330ml", value: 41, hint: "£102" },
    { name: "Diet Coke 330ml", value: 36, hint: "£90" },
    { name: "Orange Juice", value: 29, hint: "£87" },
  ];
}

export function sampleServiceSplit() {
  const dishes = sampleDishes().filter((dish) => dish.category !== "Drinks");
  const revenue = dishes.reduce((sum, dish) => sum + dish.revenuePence, 0);
  const quantity = dishes.reduce((sum, dish) => sum + dish.quantity, 0);
  const lunchRevenue = Math.round(revenue * 0.36);
  return {
    lunch: { revenuePence: lunchRevenue, orders: Math.round(quantity * 0.34), top: "House Burger" },
    dinner: { revenuePence: revenue - lunchRevenue, orders: quantity - Math.round(quantity * 0.34), top: "Grilled Chicken" },
  };
}

export type SampleCustomer = {
  name: string;
  phone: string;
  email: string;
  orders: number;
  spendPence: number;
  lastOrder: string;
  firstOrder: string;
};

const FIRST_NAMES = ["Amelia", "James", "Priya", "Owen", "Mei", "Hassan", "Grace", "Leo", "Sofia", "Noah", "Aisha", "Ben"];
const LAST_INITIALS = ["P.", "K.", "N.", "R.", "L.", "S.", "W.", "T.", "M.", "B.", "C.", "H."];

export function sampleCustomerDirectory(today: string): SampleCustomer[] {
  const people: SampleCustomer[] = [];
  for (let i = 0; i < 420; i += 1) {
    const random = rng(8100 + i * 17);
    const orders = i < 8 ? 26 + (i % 6) : i < 28 ? 10 + (i % 8) : i < 90 ? 3 + (i % 5) : i < 220 ? 2 : 1;
    const spendPence = orders * (2400 + Math.round(random() * 1800));
    const daysAgo = i < 40 ? Math.round(random() * 18) : 20 + Math.round(random() * 200);
    const firstDays = i < 22 ? Math.round(random() * 18) : 28 + Math.round(random() * 700);
    people.push({
      name: `Sample · ${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_INITIALS[(i * 3) % LAST_INITIALS.length]}`,
      phone: `020 7946 ${String(i).padStart(4, "0")}`,
      email: `sample.guest${i + 1}@example.com`,
      orders,
      spendPence,
      lastOrder: shift(today, -daysAgo),
      firstOrder: shift(today, -firstDays),
    });
  }
  return people.sort((a, b) => b.spendPence - a.spendPence);
}

export function sampleLifetimeOrders(today: string) {
  return sampleDays("2023-01-01", today, today).reduce((sum, day) => sum + day.orders, 0);
}

export function sampleBookingHeadline(today: string) {
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  const bounds = monthBounds(year, month);
  const start = addDays(today, -540);
  const upcomingEnd = addDays(today, 21);
  let lifetime = 0;
  let monthCount = 0;
  let upcoming = 0;
  for (let date = start; date <= upcomingEnd; date = addDays(date, 1)) {
    const count = sampleBookingCount(date, today);
    if (date <= today) lifetime += count;
    if (date >= bounds.start && date <= bounds.end) monthCount += count;
    if (date >= today) upcoming += count;
  }
  return { lifetime, monthCount, upcoming, average: samplePartySize() };
}

function shift(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function sampleBookingCount(date: string, today: string) {
  if (isSampleClosed(date)) return 0;
  const random = rng(hash(date) ^ 0x9e3779b9);
  const weekday = weekdayOf(date);
  const base = weekday === 6 ? 14 : weekday === 5 ? 12 : weekday === 4 ? 8 : 6;
  const upcomingBoost = date > today ? 0.7 : 1;
  return Math.max(0, Math.round((base + random() * 4) * upcomingBoost));
}

export function samplePartySize() {
  return 2.8;
}

export function samplePopularTimes(): Rank[] {
  return [
    { name: "19:00", value: 86, hint: "26% of bookings" },
    { name: "18:30", value: 74, hint: "22%" },
    { name: "19:30", value: 61, hint: "18%" },
    { name: "18:00", value: 40, hint: "12%" },
    { name: "20:00", value: 33, hint: "10%" },
    { name: "12:30", value: 22, hint: "7%" },
    { name: "13:00", value: 16, hint: "5%" },
  ];
}

export function sampleBusiestDays(): Rank[] {
  return ["Saturday", "Friday", "Sunday", "Thursday", "Wednesday", "Tuesday", "Monday"].map((name, index) => ({
    name,
    value: [128, 112, 88, 74, 61, 52, 0][index] ?? 0,
    hint: name === "Monday" ? "Closed" : undefined,
  }));
}

export function sampleMonthlySeries(year: number, today: string): GroupPoint[] {
  const currentYear = Number(today.slice(0, 4));
  const currentMonth = Number(today.slice(5, 7));
  return SHORT_MONTHS.map((label, index) => {
    const month = index + 1;
    const previous = monthRevenue(year - 1, month, `${year - 1}-12-31`);
    const future = year > currentYear || (year === currentYear && month > currentMonth);
    return {
      label,
      previous,
      current: future ? null : monthRevenue(year, month, today),
    };
  });
}

export function monthRevenue(year: number, month: number, today: string) {
  const { start, end } = monthBounds(year, month);
  const cap = today.slice(0, 7) === start.slice(0, 7) ? today : end;
  if (start > today) return 0;
  return sampleDays(start, cap < start ? start : cap, today).reduce((sum, day) => sum + day.revenuePence, 0);
}

export function sampleYearly(endYear: number, today: string): Point[] {
  const points: Point[] = [];
  for (let year = endYear - 4; year <= endYear; year += 1) {
    let revenue = 0;
    for (let month = 1; month <= 12; month += 1) revenue += monthRevenue(year, month, today);
    const current = year === Number(today.slice(0, 4));
    points.push({
      label: current ? `${year} YTD` : String(year),
      value: revenue,
      title: `${current ? `${year} year to date` : year}: placeholder`,
    });
  }
  return points;
}

export function sampleWeekly(days: DaySales[]): Point[] {
  const totals = new Map<string, number>();
  for (const day of days) {
    const key = weekStartMonday(day.date);
    totals.set(key, (totals.get(key) ?? 0) + day.revenuePence);
  }
  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([start, value]) => ({ label: weekLabel(start), value, title: `Week commencing ${start}` }));
}

export function narrativeFor(monthLabel: string, previousLabel: string, growth: number | null, days: DaySales[]) {
  const byDay = [0, 0, 0, 0, 0, 0, 0];
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const day of days) {
    if (day.revenuePence <= 0) continue;
    const weekday = weekdayOf(day.date);
    byDay[weekday] += day.revenuePence;
    counts[weekday] += 1;
  }
  let best = -1;
  let bestAvg = -1;
  for (let i = 0; i < 7; i += 1) {
    if (!counts[i]) continue;
    const avg = byDay[i] / counts[i];
    if (avg > bestAvg) {
      bestAvg = avg;
      best = i;
    }
  }
  const growthText =
    growth === null
      ? `There is no ${previousLabel} revenue to compare with.`
      : `${monthLabel} is ${growth >= 0 ? "up" : "down"} ${Math.abs(growth).toFixed(1)}% versus ${previousLabel}.`;
  const dayText = best >= 0 ? ` ${WEEKDAYS[best]} is the strongest collection day in this period.` : "";
  return `${growthText}${dayText} Mondays stay at zero in this demo configuration because the restaurant is closed.`;
}

export function sampleBookingRows(year: number, month: number, today: string) {
  const { start, end } = monthBounds(year, month);
  const names = ["Sample · Amelia P.", "Sample · James K.", "Sample · Priya N.", "Sample · Owen R.", "Sample · Mei L."];
  const times = ["12:30", "13:00", "18:00", "18:30", "19:00", "19:30", "20:00"];
  const rows: string[][] = [];
  for (const date of datesInRange(start, end)) {
    const count = Math.min(4, sampleBookingCount(date, today));
    for (let i = 0; i < count; i += 1) {
      const random = rng(hash(date) + i * 13);
      const party = 2 + Math.floor(random() * 4);
      const status = date >= today ? (random() > 0.25 ? "confirmed" : "pending") : "confirmed";
      rows.push([
        date,
        times[Math.floor(random() * times.length)] ?? "19:00",
        names[(hash(date) + i) % names.length] ?? "Sample guest",
        `020 7946 ${String(200 + ((hash(date) + i) % 80)).padStart(4, "0")}`,
        "sample.booking@example.com",
        String(party),
        status,
        i === 0 && weekdayOf(date) === 6 ? "Window table if possible" : "",
      ]);
    }
  }
  return rows;
}

export function lastMonths(today: string, count: number) {
  const labels: { year: number; month: number; key: string; label: string }[] = [];
  let year = Number(today.slice(0, 4));
  let month = Number(today.slice(5, 7));
  for (let i = 0; i < count; i += 1) {
    labels.unshift({ year, month, key: isoDate(year, month, 1).slice(0, 7), label: formatMonthLabel(year, month) });
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }
  return labels;
}

export { formatMonthLabel };
