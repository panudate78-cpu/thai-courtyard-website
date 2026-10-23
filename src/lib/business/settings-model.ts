import { DAY_NAMES, DEFAULT_OPENING_HOURS, DEFAULT_RESTAURANT } from "@/lib/site";

export type DayKey = "0" | "1" | "2" | "3" | "4" | "5" | "6";

export type OpeningDay = { closed: boolean; open: string; close: string };

export type HolidayHour = {
  id: string;
  date: string;
  closed: boolean;
  open: string | null;
  close: string | null;
  note: string;
};

export type SpecialEvent = {
  id: string;
  title: string;
  date: string;
  endDate: string | null;
  description: string;
};

export type RestaurantNotice = {
  id: string;
  title: string;
  body: string;
  active: boolean;
};

export type ManagedContact = {
  phoneDisplay: string;
  email: string;
  street: string;
  locality: string;
  postcode: string;
};

export type OpeningHoursMap = Record<DayKey, OpeningDay>;

export const DAY_KEYS: DayKey[] = ["0", "1", "2", "3", "4", "5", "6"];

export function defaultOpeningHours(): OpeningHoursMap {
  const hours = {} as OpeningHoursMap;
  for (const key of DAY_KEYS) {
    const live = DEFAULT_OPENING_HOURS[Number(key)];
    hours[key] = live
      ? { closed: false, open: live.open, close: live.close }
      : { closed: true, open: "12:00", close: "22:00" };
  }
  return hours;
}

export function defaultContact(): ManagedContact {
  return {
    phoneDisplay: DEFAULT_RESTAURANT.phoneDisplay,
    email: DEFAULT_RESTAURANT.email,
    street: DEFAULT_RESTAURANT.street,
    locality: DEFAULT_RESTAURANT.locality,
    postcode: DEFAULT_RESTAURANT.postcode,
  };
}

export function dayLabel(key: DayKey) {
  return DAY_NAMES[Number(key)] ?? key;
}

export type BusinessSettingsInput = {
  openingHours: OpeningHoursMap;
  holidayHours: HolidayHour[];
  specialEvents: SpecialEvent[];
  contact: ManagedContact;
  notices: RestaurantNotice[];
  announcement: string;
};

export type BusinessSettingsView = BusinessSettingsInput & {
  updatedAt: string | null;
  stored: boolean;
  tablesReady: boolean;
};
