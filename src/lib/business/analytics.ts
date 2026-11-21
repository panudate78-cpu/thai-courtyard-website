import { addDays, londonNow } from "@/lib/hours";
import {
  SHORT_MONTHS,
  WEEKDAYS,
  datesInRange,
  formatMonthLabel,
  growthPercent,
  isoDate,
  monthBounds,
  monthComparison,
  weekLabel,
  weekStartMonday,
} from "./dates";
import {
  databaseStatus,
  liveAddons,
  liveBookingFacts,
  liveCustomersFromDirectory,
  liveCustomersFromGloria,
  liveCustomersFromOrders,
  liveDaily,
  liveDishes,
  liveDistinctCustomers,
  liveMonthly,
  liveServiceSplit,
  liveUnsoldItems,
  type DishRow,
  type LiveCustomer,
} from "./live";
import { compactMoney, dailyPoints, delta, dishRanks, fillDays, money, weeklyPoints } from "./present";
import type { BookingDashboard, CustomerDashboard, DaySales, FoodDashboard, Metric, Overview, Point, SalesDashboard } from "./types";

function metric(label: string, value: string, href: string, hint?: string, change?: Metric["delta"]): Metric {
  return { label, value, origin: "live", href, hint, delta: change };
}

function emptyDay(date: string): DaySales {
  return { date, revenuePence: 0, orders: 0, customers: 0, refundPence: 0 };
}
function sum(days: DaySales[], start: string, end: string) {
  return days.reduce((totals, day) => {
    if (day.date >= start && day.date <= end) {
      totals.revenuePence += day.revenuePence;
      totals.orders += day.orders;
      totals.refundPence += day.refundPence;
    }
    return totals;
  }, { revenuePence: 0, orders: 0, refundPence: 0 });
}
function emptySales(month: number, year: number, warning?: string): SalesDashboard {
  const previous = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  return {
    month, year, origin: "live", warning, rangeLabel: formatMonthLabel(year, month),
    comparisonLabel: formatMonthLabel(previous.year, previous.month), metrics: [],
    growthPercent: null, currentRevenuePence: 0, previousRevenuePence: 0, previousFullRevenuePence: 0,
    showFullPrevious: false, narrative: "No data available for this period.", daily: [],
    weekly: [], monthly: [], yearly: [],
    dailyTable: { columns: ["Date", "Orders", "Revenue", "Cancelled"], rows: [] },
  };
}

export async function getOverview(): Promise<Overview> {
  const today = londonNow().date;
  const db = await databaseStatus();
  try {
    const [booking, customers, enquiries] = await Promise.all([
      liveBookingFacts(today),
      liveCustomersFromOrders(),
      (async () => {
        const { pool } = await import("@/db");
        const result = await pool.query<{ n: number }>("select count(*)::int as n from contact_messages");
        return Number(result.rows[0]?.n ?? 0);
      })(),
    ]);
    const thisMonth = await liveDaily(`${today.slice(0, 7)}-01`, today);
    const revenue = thisMonth.reduce((total, row) => total + row.revenuePence, 0);
    const orderCount = thisMonth.reduce((total, row) => total + row.orders, 0);
    return {
      origin: "live",
      warning: db.warning,
      note: "Live counts and revenue from saved restaurant records. No estimates or generated figures are used.",
      metrics: [
        metric("Orders today", String((await liveDaily(today, today))[0]?.orders ?? 0), "/admin/orders", "Non-cancelled collection orders"),
        metric("Revenue this month", money(revenue), "/admin/sales", "From collection orders"),
        metric("Bookings", String(booking.total), "/admin/bookings", `${booking.upcoming} upcoming`),
        metric("Customers", String(customers.length), "/admin/customers", "Customers with recorded collection orders"),
        metric("Enquiries", String(enquiries), "/admin/messages", "Contact requests stored"),
        metric("Orders this month", String(orderCount), "/admin/orders", "Non-cancelled collection orders"),
      ],
    };
  } catch (error) {
    console.error("[business] live overview query failed", error);
    return { origin: "live", warning: "Live business data could not be loaded.", note: "No data available until database records can be read.", metrics: [] };
  }
}

export async function getSalesDashboard(month: number, year: number): Promise<SalesDashboard> {
  const db = await databaseStatus();
  const today = londonNow().date;
  const range = monthComparison(year, month, today);
  const previousLabel = formatMonthLabel(range.prev.year, range.prev.month);
  try {
    const monthDays = fillDays(range.start, range.fullEnd, await liveDaily(range.start, range.fullEnd));
    const currentEnd = range.future ? range.start : range.current ? today : range.fullEnd;
    const current = range.elapsed ? sum(monthDays, range.start, currentEnd) : { revenuePence: 0, orders: 0, refundPence: 0 };
    const previousDays = range.prevEnd ? await liveDaily(range.prevBounds.start, range.prevEnd) : [];
    const previousRevenue = sum(previousDays, range.prevBounds.start, range.prevEnd ?? range.prevBounds.start).revenuePence;
    const previousFull = sum(await liveDaily(range.prevBounds.start, range.prevBounds.end), range.prevBounds.start, range.prevBounds.end).revenuePence;
    const customerCount = range.elapsed ? await liveDistinctCustomers(range.start, currentEnd) : 0;
    const historyStart = isoDate(year - 4, 1, 1);
    const historyEnd = isoDate(year, 12, 31) < today ? isoDate(year, 12, 31) : today;
    const monthlyRows = await liveMonthly(historyStart, historyEnd);
    const lookup = (y: number, m: number) => monthlyRows.find((row) => row.year === y && row.month === m)?.revenuePence ?? 0;
    const monthly = SHORT_MONTHS.map((label, index) => {
      const m = index + 1;
      const future = year > Number(today.slice(0, 4)) || (year === Number(today.slice(0, 4)) && m > Number(today.slice(5, 7)));
      return { label, previous: lookup(year - 1, m), current: future ? null : lookup(year, m) };
    });
    const yearly = Array.from({ length: 5 }, (_, index) => {
      const y = year - 4 + index;
      const value = monthlyRows.filter((row) => row.year === y).reduce((total, row) => total + row.revenuePence, 0);
      return { label: y === Number(today.slice(0, 4)) ? `${y} YTD` : String(y), value, title: money(value) };
    });
    const days = datesInRange(range.start, range.fullEnd).map((date) => monthDays.find((day) => day.date === date) ?? emptyDay(date));
    const currentRevenue = current.revenuePence;
    const growth = growthPercent(currentRevenue, previousRevenue);
    const aov = current.orders ? Math.round(currentRevenue / current.orders) : 0;
    const dailyTable = {
      columns: ["Date", "Orders", "Revenue", "Cancelled"],
      rows: days.map((day) => [day.date, String(day.orders), money(day.revenuePence), money(day.refundPence)]),
    };
    return {
      month, year, origin: "live", warning: db.warning,
      rangeLabel: range.current ? `${formatMonthLabel(year, month)} to date` : formatMonthLabel(year, month),
      comparisonLabel: range.prevEnd ? `1–${Number(range.prevEnd.slice(8, 10))} ${previousLabel}` : previousLabel,
      growthPercent: growth, currentRevenuePence: currentRevenue, previousRevenuePence: previousRevenue,
      previousFullRevenuePence: previousFull, showFullPrevious: range.current && previousFull !== previousRevenue,
      narrative: current.orders ? `${current.orders} orders generated ${money(currentRevenue)} in this period.` : "No data available for this period.",
      metrics: [
        metric("Total revenue", money(currentRevenue), "/admin/sales", "Non-cancelled collection orders", delta(currentRevenue, previousRevenue, `vs ${previousLabel}`)),
        metric("Total orders", String(current.orders), "/admin/orders", "Non-cancelled collection orders"),
        metric("Average order value", money(aov), "/admin/sales", current.orders ? `${current.orders} orders` : "No data available"),
        metric("Customers", String(customerCount), "/admin/customer-analytics", "Distinct phone numbers"),
        metric("Cancelled orders", String(current.refundPence ? days.reduce((n, day) => n + (day.refundPence > 0 ? 1 : 0), 0) : 0), "/admin/reports", "Cancelled order value is not a refund ledger"),
      ],
      daily: dailyPoints(days, today), weekly: weeklyPoints(days), monthly, yearly,
      dailyTable,
    };
  } catch (error) {
    console.error("[business] live sales query failed", error);
    const empty = emptySales(month, year, "Live sales data could not be loaded.");
    return { ...empty, metrics: [metric("Total revenue", "No data available", "/admin/sales"), metric("Total orders", "No data available", "/admin/orders")], warning: "Live sales data could not be loaded." };
  }
}

function ranksByCategory(dishes: DishRow[]) {
  const categories = new Map<string, { quantity: number; revenue: number }>();
  for (const dish of dishes) {
    const value = categories.get(dish.category) ?? { quantity: 0, revenue: 0 };
    value.quantity += dish.quantity;
    value.revenue += dish.revenuePence;
    categories.set(dish.category, value);
  }
  return [...categories].map(([name, value]) => ({ name, value: value.revenue, hint: `${money(value.revenue)} · ${value.quantity} items` })).sort((a, b) => b.value - a.value);
}

export async function getFoodDashboard(): Promise<FoodDashboard> {
  const db = await databaseStatus();
  const emptyService = { revenue: "£0.00", orders: "0", top: "No data available", revenuePence: 0, ordersCount: 0 };
  try {
    const [dishes, unsold, addons, split] = await Promise.all([liveDishes(), liveUnsoldItems(), liveAddons(), liveServiceSplit()]);
    const live = (name: string) => split.find((row) => row.service === name);
    const service = (name: string) => {
      const row = live(name);
      return { revenue: money(row?.revenuePence ?? 0), orders: String(row?.orders ?? 0), top: row?.top ?? "No data available", revenuePence: row?.revenuePence ?? 0, ordersCount: row?.orders ?? 0 };
    };
    const best = dishRanks(dishes);
    const worst = [...dishes].sort((a, b) => a.quantity - b.quantity).slice(0, 8).map((dish) => ({ name: dish.name, value: dish.quantity, hint: `${dish.quantity} sold · ${money(dish.revenuePence)}` }));
    const bestItems = new Set(best.map((row) => row.name));
    for (const item of unsold) if (worst.length < 8 && !bestItems.has(item.name)) worst.push({ name: item.name, value: 0, hint: "No recorded sales" });
    const drinks = dishes.filter((dish) => /drink|beverage/i.test(dish.category)).slice(0, 8).map((dish) => ({ name: dish.name, value: dish.quantity, hint: `${dish.quantity} sold · ${money(dish.revenuePence)}` }));
    return {
      origin: "live", warning: db.warning, windowLabel: "All recorded non-cancelled collection orders",
      marginNote: "Profit is unavailable because menu item costs are not stored in the database.",
      best, worst, profitable: [], categories: ranksByCategory(dishes), lunch: service("lunch"), dinner: service("dinner"),
      addons: addons.map((row) => ({ name: row.name, value: row.quantity, hint: `${row.quantity} sold · ${money(row.revenuePence)}` })),
      drinks, addonNote: "Add-on quantities from recorded order options.", drinkNote: "Recorded sales for menu categories named as drinks or beverages.",
    };
  } catch (error) {
    console.error("[business] live food query failed", error);
    return { origin: "live", warning: "Live food data could not be loaded.", windowLabel: "No data available", marginNote: "Profit is unavailable because menu item costs are not stored in the database.", best: [], worst: [], profitable: [], categories: [], lunch: emptyService, dinner: emptyService, addons: [], drinks: [], addonNote: "No data available", drinkNote: "No data available" };
  }
}

function dayCounts(rows: { date: string; count: number }[], start: string, end: string): Point[] {
  const map = new Map(rows.map((row) => [row.date, row.count]));
  return datesInRange(start, end).map((date) => ({ label: String(Number(date.slice(8, 10))), value: map.get(date) ?? 0, title: `${date}: ${map.get(date) ?? 0} bookings` }));
}
function monthStart(date: string) { return `${date.slice(0, 7)}-01`; }
function monthShift(date: string, shift: number) {
  const [year, month] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1 + shift, 1)).toISOString().slice(0, 10);
}

export async function getBookingDashboard(): Promise<BookingDashboard> {
  const db = await databaseStatus();
  const today = londonNow().date;
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  const bounds = monthBounds(year, month);
  try {
    const facts = await liveBookingFacts(today);
    const byDate = facts.byDate;
    const daily = dayCounts(byDate, bounds.start, today);
    const weekly = Array.from({ length: 8 }, (_, index) => {
      const monday = addDays(weekStartMonday(today), -7 * (7 - index));
      const sunday = addDays(monday, 6);
      const value = byDate.filter((row) => row.date >= monday && row.date <= sunday).reduce((sum, row) => sum + row.count, 0);
      return { label: weekLabel(monday), value, title: `${monday}: ${value} bookings` };
    });
    const monthly = Array.from({ length: 12 }, (_, index) => {
      const first = monthShift(today, index - 11);
      const end = monthBounds(Number(first.slice(0, 4)), Number(first.slice(5, 7))).end;
      const value = byDate.filter((row) => row.date >= first && row.date <= end).reduce((sum, row) => sum + row.count, 0);
      return { label: SHORT_MONTHS[Number(first.slice(5, 7)) - 1] ?? "", value, title: first.slice(0, 7) };
    });
    const weekdayCounts = WEEKDAYS.map((name, index) => ({ name, value: byDate.filter((row) => new Date(`${row.date}T00:00:00Z`).getUTCDay() === index).reduce((sum, row) => sum + row.count, 0) }));
    return {
      origin: "live", warning: db.warning,
      metrics: [metric("Total bookings", String(facts.total), "/admin/bookings", "All stored table requests"), metric("Upcoming bookings", String(facts.upcoming), "/admin/bookings", "Pending or confirmed from today"), metric("This month", String(byDate.filter((row) => row.date >= bounds.start && row.date <= bounds.end).reduce((sum, row) => sum + row.count, 0)), "/admin/booking-analytics", formatMonthLabel(year, month)), metric("Average party size", facts.averageParty.toFixed(1), "/admin/booking-analytics", "Non-cancelled bookings")],
      daily, weekly, monthly,
      times: facts.byTime.map((row) => ({ name: row.time, value: row.count })),
      days: weekdayCounts,
      averagePartySize: facts.averageParty.toFixed(1),
      partyHint: "Average party size from non-declined, non-cancelled booking records.",
    };
  } catch (error) {
    console.error("[business] live booking analytics failed", error);
    return { origin: "live", warning: "Live booking data could not be loaded.", metrics: [metric("Total bookings", "No data available", "/admin/bookings")], daily: [], weekly: [], monthly: [], times: [], days: [], averagePartySize: "No data available", partyHint: "No data available" };
  }
}

function customerRows(people: LiveCustomer[]) {
  return [...people].sort((a, b) => b.spendPence - a.spendPence).slice(0, 8).map((person) => ({ name: person.name, orders: String(person.orders), spend: money(person.spendPence), last: person.lastOrder ?? "—", phone: person.phone || "—" }));
}

export async function getCustomerDashboard(): Promise<CustomerDashboard> {
  const db = await databaseStatus();
  const today = londonNow().date;
  try {
    let people = await liveCustomersFromOrders();
    let method = "Calculated from recorded collection orders, grouped by customer phone.";
    if (!people.length) {
      people = await liveCustomersFromDirectory();
      method = "Live customer directory records.";
    }
    if (!people.length) {
      people = await liveCustomersFromGloria();
      method = "Imported customer database records.";
    }
    const total = people.length;
    const returning = people.filter((person) => person.orders >= 2).length;
    const tiers = [
      { name: "VIP · 10+ orders", value: people.filter((person) => person.orders >= 10).length },
      { name: "Gold · 5–9", value: people.filter((person) => person.orders >= 5 && person.orders < 10).length },
      { name: "Regular · 3–4", value: people.filter((person) => person.orders >= 3 && person.orders < 5).length },
      { name: "Under 3 orders", value: people.filter((person) => person.orders < 3).length },
    ];
    const months = Array.from({ length: 12 }, (_, index) => monthShift(today, index - 11));
    const visitsRows = await liveDaily(months[0]!, today);
    const growth: Point[] = months.map((monthDate) => {
      const value = people.filter((person) => person.firstOrder?.startsWith(monthDate.slice(0, 7))).length;
      return { label: SHORT_MONTHS[Number(monthDate.slice(5, 7)) - 1] ?? "", value, title: `${monthDate.slice(0, 7)}: ${value} customers with recorded first order` };
    });
    const cumulativePoints = months.map((monthDate) => {
      const monthEnd = monthBounds(Number(monthDate.slice(0, 4)), Number(monthDate.slice(5, 7))).end;
      const value = people.filter((person) => person.firstOrder && person.firstOrder <= monthEnd).length;
      return { label: SHORT_MONTHS[Number(monthDate.slice(5, 7)) - 1] ?? "", value, title: `${monthDate.slice(0, 7)}: ${value} customers with known first-order dates` };
    });
    const visits = months.map((monthDate) => {
      const value = visitsRows.filter((row) => row.date.startsWith(monthDate.slice(0, 7))).reduce((total, row) => total + row.orders, 0);
      return { label: SHORT_MONTHS[Number(monthDate.slice(5, 7)) - 1] ?? "", value, title: `${monthDate.slice(0, 7)}: ${value} recorded orders` };
    });
    return {
      origin: "live", warning: db.warning, methodNote: method,
      metrics: [metric("Total customers", String(total), "/admin/customers", "Live customer records"), metric("New this month", String(growth.at(-1)?.value ?? 0), "/admin/customer-analytics", "Known first orders this month"), metric("Returning customers", String(returning), "/admin/customer-analytics", "Two or more recorded orders"), metric("Retention", total ? `${Math.round(returning / total * 100)}%` : "No data available", "/admin/customer-analytics", "Returning customers ÷ total")],
      tiers, growth, cumulative: cumulativePoints, visits,
      spenders: customerRows(people), frequent: [...people].sort((a, b) => b.orders - a.orders || b.spendPence - a.spendPence).slice(0, 8).map((person) => ({ name: person.name, orders: String(person.orders), spend: money(person.spendPence), last: person.lastOrder ?? "—", phone: person.phone || "—" })),
    };
  } catch (error) {
    console.error("[business] live customer analytics failed", error);
    return { origin: "live", warning: "Live customer data could not be loaded.", methodNote: "No data available.", metrics: [metric("Total customers", "No data available", "/admin/customers")], tiers: [], growth: [], cumulative: [], visits: [], spenders: [], frequent: [] };
  }
}

export { compactMoney, money };
