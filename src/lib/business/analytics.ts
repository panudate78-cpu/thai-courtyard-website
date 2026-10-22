import { formatPrice } from "@/lib/format";
import { SITE } from "@/lib/site";
import {
  SHORT_MONTHS,
  WEEKDAYS,
  dashboardWindows,
  formatGrowth,
  formatMonthLabel,
  generatedLabel,
  growthPercent,
  isoDate,
  londonNow,
  monthBounds,
  monthComparison,
  weekLabel,
  weekStartMonday,
  weekdayOf,
} from "./dates";
import {
  bookingStatus,
  databaseStatus,
  liveAddons,
  liveBookingFacts,
  liveBookingRows,
  liveCustomersFromDirectory,
  liveCustomersFromGloria,
  liveCustomersFromOrders,
  liveDaily,
  liveDishes,
  liveDistinctCustomers,
  liveMonthly,
  liveServiceSplit,
  liveTopItem,
  liveTotals,
  liveUnsoldItems,
  liveVisitMonths,
  orderStatus,
  type LiveCustomer,
} from "./live";
import { MARGIN_NOTE } from "./margins";
import {
  categoryRanks,
  compactMoney,
  dailyPoints,
  delta,
  dishRanks,
  fillDays,
  money,
  profitRanks,
  warningFor,
  weeklyPoints,
} from "./present";
import {
  isSampleClosed,
  lastMonths,
  narrativeFor,
  sampleAddons,
  sampleBookingCount,
  sampleBookingRows,
  sampleBusiestDays,
  sampleBookingHeadline,
  sampleCustomerDirectory,
  sampleCustomersForOrders,
  sampleDay,
  sampleLifetimeOrders,
  sampleDays,
  sampleDishes,
  sampleDrinks,
  sampleMonthlySeries,
  samplePopularTimes,
  sampleServiceSplit,
  sampleWeekly,
  sampleYearly,
  sumDays,
  type DaySales,
} from "./sample";
import type {
  BookingDashboard,
  CustomerDashboard,
  FoodDashboard,
  MarketingDashboard,
  Metric,
  Origin,
  Overview,
  Point,
  ReportDocument,
  SalesDashboard,
} from "./types";

const SAMPLE_NOTE =
  "Sample data — realistic placeholders for Thai Courtyard. Live orders, bookings or customer records replace these figures automatically.";

function sampleRange(start: string, end: string, today: string) {
  return sampleDays(start, end, today);
}

async function daysFor(start: string, end: string, today: string, live: boolean): Promise<DaySales[]> {
  if (!live) return sampleRange(start, end, today);
  const rows = await liveDaily(start, end);
  return fillDays(start, end, rows);
}

export async function getOverview(): Promise<Overview> {
  const db = await databaseStatus();
  const today = londonNow().date;
  const windows = dashboardWindows(today);
  const orders = db.warning ? "unavailable" : await orderStatus();
  const bookings = db.warning ? "unavailable" : await bookingStatus();
  const liveOrders = orders === "present";
  const liveBookings = bookings === "present";
  const warning = warningFor([orders, bookings], db.warning);

  const spanStart = windows.prevYearStart;
  const spanEnd = today;
  let days: DaySales[] = [];
  try {
    days = await daysFor(spanStart, spanEnd, today, liveOrders);
  } catch (error) {
    console.error("[business] overview days", error);
    days = sampleRange(spanStart, spanEnd, today);
  }
  const usingLiveOrders = liveOrders && !warning;
  const orderOrigin: Origin = usingLiveOrders ? "live" : "sample";

  const todaySum = sumDays(days, today, today);
  const yesterdaySum = sumDays(days, windows.yesterday, windows.yesterday);
  const weekSum = sumDays(days, windows.weekStart, windows.weekEnd);
  const prevWeekSum = sumDays(days, windows.prevWeekStart, windows.prevWeekEnd);
  const monthSum = sumDays(days, windows.monthStart, windows.monthEnd);
  const prevMonthSum = sumDays(days, windows.prevMonthStart, windows.prevMonthEnd);
  const yearSum = sumDays(days, windows.yearStart, windows.yearEnd);
  const prevYearSum = sumDays(days, windows.prevYearStart, windows.prevYearEnd);

  let totalOrders = monthSum.orders;
  let bestName = "Pad Thai";
  let bestHint = "Sample · this month";
  let categoryName = "Noodles / Rice";
  let categoryHint = "Sample · this month";
  const samplePeople = sampleCustomerDirectory(today);
  let newCustomers = samplePeople.filter((person) => person.firstOrder >= windows.monthStart && person.firstOrder <= today).length;
  let returningCustomers = samplePeople.filter((person) => person.orders >= 2).length;
  const customerOrigin: Origin = orderOrigin;

  if (usingLiveOrders) {
    try {
      const totals = await liveTotals();
      totalOrders = totals.orders;
      const top = (await liveTopItem(windows.monthStart, today)) ?? (await liveTopItem("2000-01-01", today));
      if (top) {
        bestName = top.name;
        bestHint = `${top.quantity} sold · ${top.category}`;
        categoryName = top.category;
      }
      const dishes = await liveDishes();
      const categories = categoryRanks(dishes);
      if (categories[0]) {
        categoryName = categories[0].name;
        categoryHint = categories[0].hint;
      }
      const people = await liveCustomersFromOrders();
      newCustomers = people.filter((person) => person.firstOrder && person.firstOrder >= windows.monthStart && person.firstOrder <= today).length;
      returningCustomers = people.filter((person) => person.orders >= 2).length;
    } catch (error) {
      console.error("[business] overview live extras", error);
    }
  } else {
    const dishes = sampleDishes();
    bestName = dishes[0]?.name ?? "Pad Thai";
    bestHint = `${dishes[0]?.quantity ?? 0} sold · sample mix`;
    categoryName = categoryRanks(dishes)[0]?.name ?? "Noodles / Rice";
    categoryHint = "Sample mix";
    totalOrders = sampleLifetimeOrders(today);
  }

  let bookingValue = "128";
  let bookingHint = "Sample · 18 upcoming";
  let bookingOrigin: Origin = "sample";
  if (liveBookings) {
    try {
      const facts = await liveBookingFacts(today);
      bookingValue = String(facts.total);
      bookingHint = `${facts.upcoming} upcoming`;
      bookingOrigin = "live";
    } catch (error) {
      console.error("[business] overview bookings", error);
    }
  } else {
    const headline = sampleBookingHeadline(today);
    bookingValue = String(headline.lifetime);
    bookingHint = `${headline.upcoming} upcoming · sample`;
  }

  const aov = monthSum.orders ? Math.round(monthSum.revenuePence / monthSum.orders) : 0;
  const metrics: Metric[] = [
    card("Today's sales", money(todaySum.revenuePence), orderOrigin, "/admin/sales", "Collection orders", delta(todaySum.revenuePence, yesterdaySum.revenuePence, "vs yesterday")),
    card("This week's sales", money(weekSum.revenuePence), orderOrigin, "/admin/sales", "Monday to today", delta(weekSum.revenuePence, prevWeekSum.revenuePence, "vs last week")),
    card("This month's sales", money(monthSum.revenuePence), orderOrigin, "/admin/sales", formatMonthLabel(Number(today.slice(0, 4)), Number(today.slice(5, 7))), delta(monthSum.revenuePence, prevMonthSum.revenuePence, "vs last month to date")),
    card("This year's sales", money(yearSum.revenuePence), orderOrigin, "/admin/sales", "Year to date", delta(yearSum.revenuePence, prevYearSum.revenuePence, "vs last year to date")),
    card("Total orders", String(totalOrders), orderOrigin, "/admin/orders", usingLiveOrders ? "All collection orders, excluding cancelled" : "Sample collection orders since 2023"),
    card("Table bookings", bookingValue, bookingOrigin, "/admin/booking-analytics", bookingHint),
    card("Average order value", money(aov), orderOrigin, "/admin/sales", "This month to date"),
    card("New customers", String(newCustomers), customerOrigin, "/admin/customer-analytics", "First order this month"),
    card("Returning customers", String(returningCustomers), customerOrigin, "/admin/customer-analytics", "Lifetime · 2 or more orders"),
    card("Best selling item", bestName, orderOrigin, "/admin/food", bestHint),
    card("Most popular category", categoryName, orderOrigin, "/admin/food", categoryHint),
  ];

  const origins = new Set(metrics.map((item) => item.origin));
  return {
    origin: origins.size > 1 ? "mixed" : (metrics[0]?.origin ?? "sample"),
    warning,
    note: origins.has("sample") ? SAMPLE_NOTE : "Live figures from collection orders and website bookings. Cancelled orders are excluded from sales.",
    metrics,
  };
}

function card(label: string, value: string, origin: Origin, href: string, hint?: string, change?: Metric["delta"]): Metric {
  return { label, value, origin, href, hint, delta: change };
}

export async function getSalesDashboard(month: number, year: number, forceSample = false): Promise<SalesDashboard> {
  const db = await databaseStatus();
  const today = londonNow().date;
  const orders = db.warning ? "unavailable" : await orderStatus();
  const live = !forceSample && orders === "present" && !db.warning;
  const warning = warningFor([orders], db.warning);
  const origin: Origin = live ? "live" : "sample";
  const range = monthComparison(year, month, today);
  const label = formatMonthLabel(year, month);
  const prevLabel = formatMonthLabel(range.prev.year, range.prev.month);

  const chartStart = range.start;
  const chartEnd = range.fullEnd ?? range.end;
  const historyStart = isoDate(year - 4, 1, 1);
  const historyEnd = isoDate(year, 12, 31) < today ? isoDate(year, 12, 31) : today;

  let monthDays: DaySales[] = [];
  let currentRevenue = 0;
  let currentOrders = 0;
  let currentRefunds = 0;
  let previousRevenue = 0;
  let previousFull = 0;
  let customers = 0;
  let monthly = sampleMonthlySeries(year, today);
  let yearly = sampleYearly(year, today);

  if (origin === "sample") {
    monthDays = sampleDays(chartStart, chartEnd, today);
    const headlineEnd = range.future ? chartStart : range.current ? today : chartEnd;
    const headline = range.elapsed === 0 ? { revenuePence: 0, orders: 0, refundPence: 0 } : sumDays(monthDays, chartStart, headlineEnd);
    currentRevenue = headline.revenuePence;
    currentOrders = headline.orders;
    currentRefunds = headline.refundPence;
    if (range.prevEnd) previousRevenue = sumDays(sampleDays(range.prevBounds.start, range.prevEnd, today), range.prevBounds.start, range.prevEnd).revenuePence;
    previousFull = sumDays(sampleDays(range.prevBounds.start, range.prevBounds.end, today), range.prevBounds.start, range.prevBounds.end).revenuePence;
    customers = sampleCustomersForOrders(currentOrders);
  } else {
    try {
      monthDays = fillDays(chartStart, chartEnd, await liveDaily(chartStart, chartEnd));
      const headlineEnd = range.elapsed === 0 ? "" : range.current ? today : chartEnd;
      const headline = headlineEnd ? sumDays(monthDays, chartStart, headlineEnd) : { revenuePence: 0, orders: 0, refundPence: 0 };
      currentRevenue = headline.revenuePence;
      currentOrders = headline.orders;
      currentRefunds = headline.refundPence;
      customers = headlineEnd ? await liveDistinctCustomers(chartStart, headlineEnd) : 0;
      if (range.prevEnd) {
        const prevDays = await liveDaily(range.prevBounds.start, range.prevEnd);
        previousRevenue = sumDays(prevDays, range.prevBounds.start, range.prevEnd).revenuePence;
      }
      const prevFullDays = await liveDaily(range.prevBounds.start, range.prevBounds.end);
      previousFull = sumDays(prevFullDays, range.prevBounds.start, range.prevBounds.end).revenuePence;
      const months = await liveMonthly(historyStart, historyEnd);
      const lookup = (y: number, m: number) => months.find((row) => row.year === y && row.month === m)?.revenuePence ?? 0;
      monthly = SHORT_MONTHS.map((name, index) => {
        const m = index + 1;
        const future = year > Number(today.slice(0, 4)) || (year === Number(today.slice(0, 4)) && m > Number(today.slice(5, 7)));
        return { label: name, previous: lookup(year - 1, m), current: future ? null : lookup(year, m) };
      });
      yearly = [];
      for (let y = year - 4; y <= year; y += 1) {
        const revenue = months.filter((row) => row.year === y).reduce((sum, row) => sum + row.revenuePence, 0);
        const currentYear = y === Number(today.slice(0, 4));
        yearly.push({ label: currentYear ? `${y} YTD` : String(y), value: revenue, title: money(revenue) });
      }
    } catch (error) {
      console.error("[business] sales", error);
      const fallback = await getSalesDashboard(month, year, true);
      return { ...fallback, origin: "sample", warning: "A sales query failed, so this page is showing sample data." };
    }
  }

  const growth = growthPercent(currentRevenue, previousRevenue);
  const comparisonLabel = range.prevEnd
    ? `1–${Number(range.prevEnd.slice(8, 10))} ${prevLabel}`
    : prevLabel;
  const aov = currentOrders ? Math.round(currentRevenue / currentOrders) : 0;
  const showFullPrevious = range.current && previousFull !== previousRevenue;

  return {
    month,
    year,
    origin,
    warning,
    rangeLabel: range.current ? `${label} to date` : range.future ? `${label} has not started` : label,
    comparisonLabel,
    growthPercent: growth,
    currentRevenuePence: currentRevenue,
    previousRevenuePence: previousRevenue,
    previousFullRevenuePence: previousFull,
    showFullPrevious,
    narrative: narrativeFor(range.current ? `${label} to date` : label, comparisonLabel, growth, monthDays.filter((day) => !range.current || day.date <= today)),
    metrics: [
      card("Total revenue", money(currentRevenue), origin, "/admin/sales", range.current ? "Month to date, excluding cancelled" : "Excluding cancelled", delta(currentRevenue, previousRevenue, `vs ${comparisonLabel}`)),
      card("Total orders", String(currentOrders), origin, "/admin/orders", "Non-cancelled collection orders"),
      card("Average order value", money(aov), origin, "/admin/sales", currentOrders ? `${currentOrders} orders` : "No orders in this period"),
      card("Customers", String(customers), origin, "/admin/customer-analytics", origin === "sample" ? "Estimated unique guests" : "Distinct phone numbers"),
      card("Refunds", money(currentRefunds), origin, "/admin/reports", origin === "live" ? "Cancelled order value — no refund ledger yet" : "Sample cancelled value"),
    ],
    daily: dailyPoints(monthDays, today),
    weekly: origin === "sample" ? sampleWeekly(monthDays) : weeklyPoints(monthDays),
    monthly,
    yearly,
    dailyTable: {
      columns: ["Date", "Orders", "Revenue", "Cancelled"],
      rows: monthDays.map((day) => [
        formatDay(day.date),
        String(day.orders),
        money(day.revenuePence),
        money(day.refundPence),
      ]),
    },
  };
}

function formatDay(date: string) {
  return `${WEEKDAYS[weekdayOf(date)]?.slice(0, 3) ?? ""} ${Number(date.slice(8, 10))} ${SHORT_MONTHS[Number(date.slice(5, 7)) - 1] ?? ""}`;
}

export async function getFoodDashboard(): Promise<FoodDashboard> {
  const db = await databaseStatus();
  const orders = db.warning ? "unavailable" : await orderStatus();
  const warning = warningFor([orders], db.warning);
  if (orders !== "present" || db.warning) return sampleFood(warning);

  try {
    const dishes = await liveDishes();
    if (!dishes.length) return sampleFood(warning);
    const unsold = await liveUnsoldItems();
    const topQuantity = Math.max(...dishes.map((dish) => dish.quantity));
    const soldWorst = [...dishes]
      .filter((dish) => dish.quantity < topQuantity)
      .sort((a, b) => a.quantity - b.quantity || a.revenuePence - b.revenuePence)
      .slice(0, 5);
    const worst = [
      ...soldWorst.map((dish) => ({
        name: dish.name,
        value: dish.quantity,
        hint: `${dish.quantity} sold · ${money(dish.revenuePence)}`,
      })),
      ...unsold.slice(0, Math.max(0, 5 - soldWorst.length)).map((item) => ({
        name: item.name,
        value: 0,
        hint: `0 sold · ${item.category}`,
      })),
    ];
    const services = await liveServiceSplit();
    const lunch = services.find((row) => row.service === "lunch");
    const dinner = services.find((row) => row.service === "dinner");
    const addons = await liveAddons();
    const drinks = dishes.filter((dish) => /drink/i.test(dish.category) || /coke|sprite|water|fanta|tea|lemonade/i.test(dish.name));
    return {
      origin: "live",
      warning,
      windowLabel: "All collection orders currently in the database",
      marginNote: MARGIN_NOTE,
      best: dishRanks(dishes),
      worst,
      profitable: profitRanks(dishes),
      categories: categoryRanks(dishes),
      lunch: serviceCard(lunch),
      dinner: serviceCard(dinner),
      addons: addons.map((row) => ({
        name: row.name,
        value: row.quantity,
        hint: `${row.quantity} added · ${money(row.revenuePence)}`,
      })),
      drinks: drinks
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 8)
        .map((dish) => ({ name: dish.name, value: dish.quantity, hint: `${dish.quantity} sold · ${money(dish.revenuePence)}` })),
      addonNote: addons.length ? "Priced options on live order lines." : "No priced add-ons have been recorded on live orders yet.",
      drinkNote: drinks.length ? "Items in a drinks category, or with a drinks name." : "No drink sales have been recorded yet.",
    };
  } catch (error) {
    console.error("[business] food", error);
    return sampleFood("A food query failed, so this page is showing sample data.");
  }
}

function serviceCard(row: { orders: number; revenuePence: number; top: string } | undefined) {
  return {
    revenue: money(row?.revenuePence ?? 0),
    orders: String(row?.orders ?? 0),
    top: row?.top ?? "—",
    revenuePence: row?.revenuePence ?? 0,
    ordersCount: row?.orders ?? 0,
  };
}

function sampleFood(warning?: string): FoodDashboard {
  const dishes = sampleDishes();
  const split = sampleServiceSplit();
  const worst = [...dishes].sort((a, b) => a.quantity - b.quantity).slice(0, 5);
  return {
    origin: "sample",
    warning,
    windowLabel: "Illustrative month on the current Thai Courtyard menu",
    marginNote: MARGIN_NOTE,
    best: dishRanks(dishes),
    worst: worst.map((dish) => ({
      name: dish.name,
      value: dish.quantity,
      hint: `${dish.quantity} sold · ${money(dish.revenuePence)}`,
    })),
    profitable: profitRanks(dishes),
    categories: categoryRanks(dishes),
    lunch: {
      revenue: money(split.lunch.revenuePence),
      orders: String(split.lunch.orders),
      top: split.lunch.top,
      revenuePence: split.lunch.revenuePence,
      ordersCount: split.lunch.orders,
    },
    dinner: {
      revenue: money(split.dinner.revenuePence),
      orders: String(split.dinner.orders),
      top: split.dinner.top,
      revenuePence: split.dinner.revenuePence,
      ordersCount: split.dinner.orders,
    },
    addons: sampleAddons(),
    drinks: sampleDrinks(),
    addonNote: "Sample add-ons based on the menu's protein upgrades and fried egg.",
    drinkNote: "Sample drinks from the current drinks list.",
  };
}

export async function getBookingDashboard(): Promise<BookingDashboard> {
  const db = await databaseStatus();
  const today = londonNow().date;
  const status = db.warning ? "unavailable" : await bookingStatus();
  const warning = warningFor([status], db.warning);
  if (status !== "present" || db.warning) return sampleBookings(today, warning);

  try {
    const facts = await liveBookingFacts(today);
    const year = Number(today.slice(0, 4));
    const month = Number(today.slice(5, 7));
    const bounds = monthBounds(year, month);
    const daily = fillCountDays(bounds.start, bounds.end, facts.byDate, today);
    const weekly = bucketWeeks(facts.byDate, today, 8);
    const monthly = bucketMonths(facts.byDate, today, 12);
    const dow = [0, 0, 0, 0, 0, 0, 0];
    for (const row of facts.byDate) dow[weekdayOf(row.date)] += row.count;
    const totalTimed = facts.byTime.reduce((sum, row) => sum + row.count, 0) || 1;
    return {
      origin: "live",
      warning,
      averagePartySize: facts.averageParty.toFixed(1),
      partyHint: "Average of bookings that are not declined or cancelled.",
      metrics: [
        card("Total bookings", String(facts.total), "live", "/admin/bookings", "Every request stored on the website"),
        card("Upcoming bookings", String(facts.upcoming), "live", "/admin/bookings", "Pending or confirmed, from today"),
        card("This month", String(facts.byDate.filter((row) => row.date >= bounds.start && row.date <= bounds.end).reduce((sum, row) => sum + row.count, 0)), "live", "/admin/booking-analytics", formatMonthLabel(year, month)),
        card("Average party size", facts.averageParty.toFixed(1), "live", "/admin/booking-analytics", "Guests per booking"),
      ],
      daily,
      weekly,
      monthly,
      times: facts.byTime.map((row) => ({
        name: row.time,
        value: row.count,
        hint: `${Math.round((row.count / totalTimed) * 100)}%`,
      })),
      days: WEEKDAYS.map((name, index) => ({ name, value: dow[index] ?? 0, hint: dow[index] ? `${dow[index]} bookings` : "None" })),
    };
  } catch (error) {
    console.error("[business] bookings", error);
    return sampleBookings(today, "A booking query failed, so this page is showing sample data.");
  }
}

function sampleBookings(today: string, warning?: string): BookingDashboard {
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  const bounds = monthBounds(year, month);
  const byDate: { date: string; count: number }[] = [];
  const start = isoDate(year, month, 1);
  const historyStart = shiftMonth(today, -14);
  for (let date = historyStart; date <= shiftDays(bounds.end, 14); date = shiftDays(date, 1)) {
    byDate.push({ date, count: sampleBookingCount(date, today) });
  }
  const headline = sampleBookingHeadline(today);
  const times = samplePopularTimes();
  return {
    origin: "sample",
    warning,
    averagePartySize: headline.average.toFixed(1),
    partyHint: "Sample average. Live party size is used as soon as bookings exist.",
    metrics: [
      card("Total bookings", String(headline.lifetime), "sample", "/admin/bookings", "Sample requests over the last 18 months"),
      card("Upcoming bookings", String(headline.upcoming), "sample", "/admin/bookings", "Next three weeks · sample"),
      card("This month", String(headline.monthCount), "sample", "/admin/booking-analytics", formatMonthLabel(year, month)),
      card("Average party size", headline.average.toFixed(1), "sample", "/admin/booking-analytics", "Sample"),
    ],
    daily: fillCountDays(start, bounds.end, byDate, today),
    weekly: bucketWeeks(byDate, today, 8),
    monthly: bucketMonths(byDate, today, 12),
    times,
    days: sampleBusiestDays(),
  };
}

function fillCountDays(start: string, end: string, rows: { date: string; count: number }[], today: string): Point[] {
  const map = new Map(rows.map((row) => [row.date, row.count]));
  const points: Point[] = [];
  for (let date = start; date <= end; date = shiftDays(date, 1)) {
    const value = map.get(date) ?? 0;
    points.push({
      label: String(Number(date.slice(8, 10))),
      value,
      muted: date > today || isSampleClosed(date),
      title: `${date}: ${value} bookings`,
    });
  }
  return points;
}

function bucketWeeks(rows: { date: string; count: number }[], today: string, count: number): Point[] {
  const end = weekStartMonday(today);
  const start = shiftDays(end, -7 * (count - 1));
  const totals = new Map<string, number>();
  for (let date = start; date <= end; date = shiftDays(date, 7)) totals.set(date, 0);
  for (const row of rows) {
    const key = weekStartMonday(row.date);
    if (key >= start && key <= end) totals.set(key, (totals.get(key) ?? 0) + row.count);
  }
  return [...totals.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => ({
    label: weekLabel(key),
    value,
    title: `Week of ${key}: ${value}`,
  }));
}

function bucketMonths(rows: { date: string; count: number }[], today: string, count: number): Point[] {
  const months = lastMonths(today, count);
  return months.map((month) => ({
    label: SHORT_MONTHS[month.month - 1] ?? month.label,
    value: rows.filter((row) => row.date.startsWith(month.key)).reduce((sum, row) => sum + row.count, 0),
    title: month.label,
  }));
}

function shiftDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, (month || 1) - 1, (day || 1) + days));
  return next.toISOString().slice(0, 10);
}

function shiftMonth(date: string, months: number) {
  const [year, month] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1 + months, 1));
  return next.toISOString().slice(0, 10);
}

export async function getCustomerDashboard(): Promise<CustomerDashboard> {
  const db = await databaseStatus();
  const today = londonNow().date;
  const orders = db.warning ? "unavailable" : await orderStatus();
  const warning = warningFor([orders], db.warning);
  if (db.warning) return sampleCustomers(today, warning);

  try {
    if (orders === "present") {
      const people = await liveCustomersFromOrders();
      if (people.length) {
        const dash = customerFromRecords(people, "live", "Calculated from collection orders, grouped by phone number.", today, warning);
        const months = lastMonths(today, 12);
        const visits = await liveVisitMonths(`${months[0]?.key ?? today.slice(0, 7)}-01`, today);
        dash.visits = months.map((month) => {
          const row = visits.find((item) => item.ym === month.key);
          return {
            label: SHORT_MONTHS[month.month - 1] ?? "",
            value: row?.orders ?? 0,
            title: `${month.label}: ${row?.orders ?? 0} collection orders`,
          };
        });
        return dash;
      }
    }
    const directory = await liveCustomersFromDirectory();
    if (directory.length) {
      return customerFromRecords(
        directory,
        "live",
        "Taken from the customer directory. First-visit dates are not stored, so growth uses last order date where needed.",
        today,
        warning,
      );
    }
    const gloria = await liveCustomersFromGloria();
    if (gloria.length) {
      return customerFromRecords(gloria, "live", "Imported GloriaFood customers. Growth is limited because first-order dates are not in that export.", today, warning);
    }
  } catch (error) {
    console.error("[business] customers", error);
    return sampleCustomers(today, "A customer query failed, so this page is showing sample data.");
  }
  return sampleCustomers(today, warning);
}

function customerFromRecords(people: LiveCustomer[], origin: Origin, methodNote: string, today: string, warning?: string): CustomerDashboard {
  const total = people.length;
  const returning = people.filter((person) => person.orders >= 2).length;
  const monthStart = `${today.slice(0, 7)}-01`;
  const newThisMonth = people.filter((person) => {
    const first = person.firstOrder || (person.orders <= 1 ? person.lastOrder : null);
    return Boolean(first && first >= monthStart && first <= today);
  }).length;
  const retention = total ? Math.round((returning / total) * 100) : 0;
  const tiers = tierRanks(people);
  const months = lastMonths(today, 12);
  const growth = months.map((month) => ({
    label: SHORT_MONTHS[month.month - 1] ?? "",
    value: people.filter((person) => (person.firstOrder || "").startsWith(month.key)).length,
    title: month.label,
  }));
  let running = people.filter((person) => person.firstOrder && person.firstOrder < months[0]!.key).length;
  const cumulative = growth.map((point, index) => {
    running += point.value;
    return { label: point.label, value: running, title: `${months[index]?.label}: ${running} customers with a known first order` };
  });
  let visits: Point[] = [];
  visits = months.map((month) => ({
    label: SHORT_MONTHS[month.month - 1] ?? "",
    value: people.filter((person) => (person.lastOrder || "").startsWith(month.key)).length,
    title: `${month.label} last visits — visit trend uses order history when available`,
  }));
  return {
    origin,
    warning,
    methodNote,
    metrics: [
      card("Total customers", String(total), origin, "/admin/customers", origin === "live" ? "Unique records in this source" : "Sample directory"),
      card("New this month", String(newThisMonth), origin, "/admin/customer-analytics", "First known order this month"),
      card("Returning customers", String(returning), origin, "/admin/customer-analytics", "2 or more orders"),
      card("Retention", `${retention}%`, origin, "/admin/customer-analytics", "Returning ÷ total"),
    ],
    tiers,
    growth,
    cumulative,
    visits,
    spenders: rankPeople(people, (a, b) => b.spendPence - a.spendPence),
    frequent: rankPeople(people, (a, b) => b.orders - a.orders || b.spendPence - a.spendPence),
  };
}

function sampleCustomers(today: string, warning?: string): CustomerDashboard {
  const people: LiveCustomer[] = sampleCustomerDirectory(today).map((person) => ({
    name: person.name,
    phone: person.phone,
    email: person.email,
    orders: person.orders,
    spendPence: person.spendPence,
    lastOrder: person.lastOrder,
    firstOrder: person.firstOrder,
    consent: "Sample",
  }));
  const dash = customerFromRecords(people, "sample", "Sample guest book. Names, phones and emails are fictional.", today, warning);
  const months = lastMonths(today, 12);
  dash.visits = months.map((month, index) => ({
    label: SHORT_MONTHS[month.month - 1] ?? "",
    value: 80 + ((index * 17) % 40),
    title: `${month.label} sample visits`,
  }));
  return dash;
}

function tierRanks(people: LiveCustomer[]) {
  const vip = people.filter((person) => person.orders >= 25).length;
  const gold = people.filter((person) => person.orders >= 10 && person.orders < 25).length;
  const regular = people.filter((person) => person.orders >= 3 && person.orders < 10).length;
  const newer = people.filter((person) => person.orders < 3).length;
  return [
    { name: "VIP · 25+ orders", value: vip, hint: "Same tier as the customer list" },
    { name: "Gold · 10–24", value: gold, hint: "Same tier as the customer list" },
    { name: "Regular · 3–9", value: regular, hint: "Same tier as the customer list" },
    { name: "Newer · under 3", value: newer, hint: "Includes first orders" },
  ];
}

function rankPeople(people: LiveCustomer[], compare: (a: LiveCustomer, b: LiveCustomer) => number) {
  return [...people]
    .sort(compare)
    .slice(0, 8)
    .map((person) => ({
      name: person.name,
      phone: displayPhone(person.phone),
      orders: String(person.orders),
      spend: formatPrice(person.spendPence),
      last: person.lastOrder || "—",
    }));
}

function displayPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("44")) return `0${digits.slice(2)}`;
  return phone || "—";
}

export async function getMarketingDashboard(): Promise<MarketingDashboard> {
  return {
    origin: "sample",
    reviewUrl: SITE.googleReviewUrl,
    vouchers: [
      { code: "WELCOME10", offer: "10% off a first collection", uses: "46", value: "£612 attributed", status: "Sample · active" },
      { code: "LUNCH5", offer: "£5 off before 15:00", uses: "28", value: "£140 discount", status: "Sample · active" },
      { code: "BIRTHDAY", offer: "Free starter with a main", uses: "11", value: "£82 discount", status: "Sample · scheduled" },
      { code: "MOLESEY15", offer: "15% off midweek", uses: "63", value: "Ended in August", status: "Sample · ended" },
    ],
    promotions: [
      { name: "Tuesday lunch", detail: "Set lunch mention on the homepage banner", redemptions: "34", lift: "+12% lunch covers" },
      { name: "Pad Thai Friday", detail: "Staff mention, not a coded voucher", redemptions: "41", lift: "+18% noodle items" },
      { name: "Green curry week", detail: "Featured dish push", redemptions: "22", lift: "+9% curry sales" },
    ],
    referrals: [
      { name: "Google search", value: 48, hint: "Sample share of first visits" },
      { name: "Friend or family", value: 22, hint: "Sample" },
      { name: "Instagram", value: 14, hint: "Sample" },
      { name: "Deliveroo profile", value: 9, hint: "Sample" },
      { name: "Walk-in", value: 7, hint: "Sample" },
    ],
    seasonal: SHORT_MONTHS.map((label, index) => ({
      label,
      value: Math.round([82, 85, 90, 95, 100, 105, 108, 102, 106, 104, 110, 122][index] ?? 100),
      title: `${label} sample index, 100 = a typical May`,
    })),
    reviews: {
      average: "4.6",
      count: "186",
      distribution: [
        { name: "5 stars", value: 112, hint: "Sample" },
        { name: "4 stars", value: 48, hint: "Sample" },
        { name: "3 stars", value: 16, hint: "Sample" },
        { name: "2 stars", value: 6, hint: "Sample" },
        { name: "1 star", value: 4, hint: "Sample" },
      ],
      recent: [
        { author: "Sample · Amelia P.", rating: 5, text: "Green curry tasted just like Bangkok. Warm room and a quick Tuesday lunch.", date: "12 Oct 2026" },
        { author: "Sample · James K.", rating: 5, text: "Pad Thai and satay for collection — ready on time and properly spiced.", date: "4 Oct 2026" },
        { author: "Sample · Priya N.", rating: 4, text: "Lovely duck and a friendly welcome. We booked for six and the table was ready.", date: "21 Sep 2026" },
      ],
    },
  };
}

export async function getReport(kind: string, month: number, year: number): Promise<ReportDocument | null> {
  const today = londonNow().date;
  const stamp = generatedLabel();
  if (kind === "sales") {
    const sales = await getSalesDashboard(month, year);
    return {
      title: `Thai Courtyard sales · ${formatMonthLabel(year, month)}`,
      filename: `thai-courtyard-sales-${year}-${String(month).padStart(2, "0")}`,
      origin: sales.origin,
      notes: [
        `Generated ${stamp}`,
        sales.origin === "live" ? "Data source: live collection orders" : "Data source: SAMPLE — not a till export",
        sales.rangeLabel,
        `Revenue ${money(sales.currentRevenuePence)} · growth ${formatGrowth(sales.growthPercent)} vs ${sales.comparisonLabel}`,
        sales.warning ?? "Cancelled order value is listed as refunds because there is no separate refund ledger.",
      ],
      columns: sales.dailyTable.columns,
      rows: sales.dailyTable.rows,
    };
  }
  if (kind === "bookings") {
    const bounds = monthBounds(year, month);
    const status = await bookingStatus().catch(() => "unavailable" as const);
    if (status === "present") {
      const rows = await liveBookingRows(bounds.start, bounds.end);
      return {
        title: `Thai Courtyard bookings · ${formatMonthLabel(year, month)}`,
        filename: `thai-courtyard-bookings-${year}-${String(month).padStart(2, "0")}`,
        origin: "live",
        notes: [`Generated ${stamp}`, "Data source: live website bookings", rows.length >= 800 ? "Export capped at 800 rows." : `${rows.length} rows`],
        columns: ["Date", "Time", "Name", "Phone", "Email", "Party", "Status", "Notes"],
        rows: rows.map((row) => [row.date, row.time, row.name, row.phone, row.email ?? "", String(row.party_size), row.status, row.notes ?? ""]),
      };
    }
    const rows = sampleBookingRows(year, month, today);
    return {
      title: `Thai Courtyard bookings · ${formatMonthLabel(year, month)}`,
      filename: `thai-courtyard-bookings-${year}-${String(month).padStart(2, "0")}`,
      origin: "sample",
      notes: [`Generated ${stamp}`, "Data source: SAMPLE — fictional booking requests", "Replace automatically when website bookings exist."],
      columns: ["Date", "Time", "Name", "Phone", "Email", "Party", "Status", "Notes"],
      rows,
    };
  }
  if (kind === "customers") {
    const customers = await getCustomerDashboard();
    const source = customers.origin === "live" ? await customerExportRows() : sampleCustomerDirectory(today);
    const rows = customers.origin === "live"
      ? (source as LiveCustomer[]).map((person) => [
          person.name,
          displayPhone(person.phone),
          person.email ?? "",
          String(person.orders),
          formatPrice(person.spendPence),
          person.lastOrder ?? "",
          person.orders >= 25 ? "VIP" : person.orders >= 10 ? "Gold" : person.orders >= 3 ? "Regular" : "Customer",
          person.consent ?? "",
        ])
      : (source as ReturnType<typeof sampleCustomerDirectory>).map((person) => [
          person.name,
          person.phone,
          person.email,
          String(person.orders),
          formatPrice(person.spendPence),
          person.lastOrder,
          person.orders >= 25 ? "VIP" : person.orders >= 10 ? "Gold" : person.orders >= 3 ? "Regular" : "Customer",
          "Sample",
        ]);
    return {
      title: "Thai Courtyard customers",
      filename: "thai-courtyard-customers",
      origin: customers.origin,
      notes: [
        `Generated ${stamp}`,
        customers.origin === "live" ? "Data source: live customer records" : "Data source: SAMPLE — fictional guests",
        customers.methodNote,
        "Store this file securely. It can contain contact details.",
      ],
      columns: ["Name", "Phone", "Email", "Orders", "Spend", "Last order", "Tier", "Consent"],
      rows: rows.slice(0, 500),
    };
  }
  return null;
}

async function customerExportRows(): Promise<LiveCustomer[]> {
  const fromOrders = await liveCustomersFromOrders();
  if (fromOrders.length) return fromOrders.sort((a, b) => b.spendPence - a.spendPence);
  const directory = await liveCustomersFromDirectory();
  if (directory.length) return directory.sort((a, b) => b.spendPence - a.spendPence);
  return (await liveCustomersFromGloria()).sort((a, b) => b.spendPence - a.spendPence);
}

export { compactMoney, formatGrowth, money };
