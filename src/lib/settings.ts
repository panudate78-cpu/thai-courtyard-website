import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureDatabase } from "@/db/bootstrap";
import { siteSettings } from "@/db/schema";
import { toLondonDateTimeString } from "./hours";
import type { SlotConfig } from "./hours";
import type { Settings } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  orderingEnabled: true,
  pausedMessage: null,
  orderingPausedUntil: null,
  leadTimeMinutes: 20,
  slotIntervalMinutes: 15,
  maxDaysAhead: 7,
  closedDates: [],
  notificationEmail: null,
  announcement: null,
};

export async function getSettings(): Promise<Settings> {
  await ensureDatabase();
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
  if (!row) return DEFAULT_SETTINGS;
  return {
    orderingEnabled: row.orderingEnabled,
    pausedMessage: row.pausedMessage,
    orderingPausedUntil:
      typeof row.orderingPausedUntil === "string"
        ? row.orderingPausedUntil || null
        : row.orderingPausedUntil
        ? toLondonDateTimeString(row.orderingPausedUntil)
        : null,
    leadTimeMinutes: row.leadTimeMinutes,
    slotIntervalMinutes: row.slotIntervalMinutes,
    maxDaysAhead: row.maxDaysAhead,
    closedDates: row.closedDates ?? [],
    notificationEmail: row.notificationEmail,
    announcement: row.announcement,
  };
}

/** Never throws — used by public layouts so a DB hiccup can't take the site down. */
export async function getSettingsSafe(): Promise<Settings> {
  try {
    return await getSettings();
  } catch (error) {
    console.error("[settings] falling back to defaults", error);
    return DEFAULT_SETTINGS;
  }
}

export async function updateSettings(patch: Partial<Settings>) {
  await ensureDatabase();
  await db
    .insert(siteSettings)
    .values({ id: 1, ...patch, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteSettings.id, set: { ...patch, updatedAt: new Date() } });
  return getSettings();
}

export function toSlotConfig(settings: Settings): SlotConfig {
  return {
    leadTimeMinutes: settings.leadTimeMinutes,
    slotIntervalMinutes: settings.slotIntervalMinutes,
    maxDaysAhead: settings.maxDaysAhead,
    closedDates: settings.closedDates,
  };
}
