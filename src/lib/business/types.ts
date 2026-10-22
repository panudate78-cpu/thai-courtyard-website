export type Origin = "live" | "sample";

export type Delta = { percent: number | null; label: string };

export type Metric = {
  label: string;
  value: string;
  hint?: string;
  origin: Origin;
  href?: string;
  delta?: Delta;
};

export type Point = { label: string; value: number; title?: string; muted?: boolean };

export type GroupPoint = { label: string; current: number | null; previous: number };

export type Rank = { name: string; value: number; hint?: string };

export type TableData = { columns: string[]; rows: string[][] };

export type Overview = {
  origin: Origin | "mixed";
  warning?: string;
  note: string;
  metrics: Metric[];
};

export type SalesDashboard = {
  month: number;
  year: number;
  origin: Origin;
  warning?: string;
  rangeLabel: string;
  comparisonLabel: string;
  metrics: Metric[];
  growthPercent: number | null;
  currentRevenuePence: number;
  previousRevenuePence: number;
  previousFullRevenuePence: number;
  showFullPrevious: boolean;
  narrative: string;
  daily: Point[];
  weekly: Point[];
  monthly: GroupPoint[];
  yearly: Point[];
  dailyTable: TableData;
};

export type ServiceSplit = { revenue: string; orders: string; top: string; revenuePence: number; ordersCount: number };

export type FoodDashboard = {
  origin: Origin;
  warning?: string;
  windowLabel: string;
  marginNote: string;
  best: Rank[];
  worst: Rank[];
  profitable: Rank[];
  categories: Rank[];
  lunch: ServiceSplit;
  dinner: ServiceSplit;
  addons: Rank[];
  drinks: Rank[];
  addonNote?: string;
  drinkNote?: string;
};

export type BookingDashboard = {
  origin: Origin;
  warning?: string;
  metrics: Metric[];
  daily: Point[];
  weekly: Point[];
  monthly: Point[];
  times: Rank[];
  days: Rank[];
  averagePartySize: string;
  partyHint: string;
};

export type CustomerRow = { name: string; orders: string; spend: string; last: string; phone: string };

export type CustomerDashboard = {
  origin: Origin;
  warning?: string;
  methodNote: string;
  metrics: Metric[];
  tiers: Rank[];
  growth: Point[];
  cumulative: Point[];
  visits: Point[];
  spenders: CustomerRow[];
  frequent: CustomerRow[];
};

export type MarketingDashboard = {
  origin: "sample";
  vouchers: { code: string; offer: string; uses: string; value: string; status: string }[];
  promotions: { name: string; detail: string; redemptions: string; lift: string }[];
  referrals: Rank[];
  seasonal: Point[];
  reviews: {
    average: string;
    count: string;
    distribution: Rank[];
    recent: { author: string; rating: number; text: string; date: string }[];
  };
  reviewUrl: string;
};

export type ReportDocument = {
  title: string;
  filename: string;
  origin: Origin;
  notes: string[];
  columns: string[];
  rows: string[][];
};
