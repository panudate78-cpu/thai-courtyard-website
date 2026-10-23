import { hoursFor, londonNow, toMinutes, type HolidayException, type OpeningHoursMap } from "./hours";
import { DEFAULT_OPENING_HOURS } from "./site";

/** Is the restaurant open right now (UK time), given its configured hours? */
export function isRestaurantOpenNow(
  openingHours: OpeningHoursMap = DEFAULT_OPENING_HOURS,
  holidays: HolidayException[] = [],
  at: Date = new Date(),
) {
  const now = londonNow(at);
  const hours = hoursFor(now.date, openingHours, holidays);
  if (!hours) return false;
  return now.minutes >= toMinutes(hours.open) && now.minutes < toMinutes(hours.close);
}
