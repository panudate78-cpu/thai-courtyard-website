import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { ensureBusinessTables } from "@/db/business-migration";
import { businessSettings } from "@/db/schema";
import { ensureDatabase } from "@/db/bootstrap";
import { isValidDateString } from "@/lib/hours";
import { getSettings, updateSettings } from "@/lib/settings";
import { EMAIL_RE } from "@/lib/validation";
import {
  DAY_KEYS,
  defaultContact,
  defaultOpeningHours,
  type BusinessSettingsInput,
  type BusinessSettingsView,
  type DayKey,
  type HolidayHour,
  type ManagedContact,
  type OpeningDay,
  type OpeningHoursMap,
  type RestaurantNotice,
  type SpecialEvent,
} from "./settings-model";

const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
const idRe = /^[a-zA-Z0-9_-]{4,40}$/;

const daySchema = z
  .object({
    closed: z.boolean(),
    open: z.string().regex(timeRe, "Use a time like 12:00"),
    close: z.string().regex(timeRe, "Use a time like 21:00"),
  })
  .refine((day) => day.closed || day.open < day.close, "Closing time must be after opening time");

const holidaySchema = z
  .object({
    id: z.string().regex(idRe, "Invalid holiday id"),
    date: z.string().refine(isValidDateString, "Holiday dates must look like 2026-12-25"),
    closed: z.boolean(),
    open: z.string().regex(timeRe).nullable(),
    close: z.string().regex(timeRe).nullable(),
    note: z.string().trim().max(160),
  })
  .refine((row) => row.closed || (row.open && row.close && row.open < row.close), "Holiday hours need an opening and closing time");

const eventSchema = z.object({
  id: z.string().regex(idRe, "Invalid event id"),
  title: z.string().trim().min(2, "Event title is too short").max(80),
  date: z.string().refine(isValidDateString, "Event dates must look like 2026-12-25"),
  endDate: z
    .union([z.string().refine(isValidDateString, "End date is not valid"), z.null()]),
  description: z.string().trim().max(400),
});

const noticeSchema = z.object({
  id: z.string().regex(idRe, "Invalid notice id"),
  title: z.string().trim().min(2, "Notice title is too short").max(80),
  body: z.string().trim().min(2, "Notice text is too short").max(500),
  active: z.boolean(),
});

const contactSchema = z.object({
  phoneDisplay: z.string().trim().min(8, "Enter a phone number").max(25),
  email: z.string().trim().max(200).refine((value) => !value || EMAIL_RE.test(value), "Enter a valid email or leave it blank"),
  street: z.string().trim().min(3).max(80),
  locality: z.string().trim().min(2).max(80),
  postcode: z.string().trim().min(3).max(12),
});

export const businessSettingsSchema = z.object({
  openingHours: z.object({
    "0": daySchema,
    "1": daySchema,
    "2": daySchema,
    "3": daySchema,
    "4": daySchema,
    "5": daySchema,
    "6": daySchema,
  }),
  holidayHours: z.array(holidaySchema).max(100),
  specialEvents: z.array(eventSchema).max(50),
  contact: contactSchema,
  notices: z.array(noticeSchema).max(50),
  announcement: z.string().trim().max(200, "The announcement is too long"),
});

function asDay(value: unknown): OpeningDay | null {
  const parsed = daySchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function asHours(value: unknown): OpeningHoursMap {
  const fallback = defaultOpeningHours();
  if (!value || typeof value !== "object") return fallback;
  const source = value as Record<string, unknown>;
  const hours = { ...fallback };
  for (const key of DAY_KEYS) {
    const day = asDay(source[key]);
    if (day) hours[key] = day;
  }
  return hours;
}

function asList<T>(value: unknown, schema: z.ZodType<T>): T[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const parsed = schema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

function asContact(value: unknown): ManagedContact {
  const parsed = contactSchema.safeParse(value);
  return parsed.success ? parsed.data : defaultContact();
}

export async function getBusinessSettings(): Promise<BusinessSettingsView> {
  const defaults = emptySettings();
  try {
    await ensureDatabase();
  } catch (error) {
    console.error("[business] settings read", error);
    return defaults;
  }
  const tablesReady = await ensureBusinessTables();
  const site = await getSettings().catch(() => null);
  defaults.announcement = site?.announcement ?? "";
  defaults.tablesReady = tablesReady;
  if (!tablesReady) return defaults;
  const [row] = await db.select().from(businessSettings).where(eq(businessSettings.id, 1)).limit(1);
  if (!row) return defaults;
  return {
    openingHours: asHours(row.openingHours),
    holidayHours: asList(row.holidayHours, holidaySchema).sort((a, b) => a.date.localeCompare(b.date)),
    specialEvents: asList(row.specialEvents, eventSchema).sort((a, b) => a.date.localeCompare(b.date)),
    contact: asContact(row.contact),
    notices: asList(row.notices, noticeSchema),
    announcement: site?.announcement ?? "",
    updatedAt: row.updatedAt.toISOString(),
    stored: true,
    tablesReady: true,
  };
}

function emptySettings(): BusinessSettingsView {
  return {
    openingHours: defaultOpeningHours(),
    holidayHours: [],
    specialEvents: [],
    contact: defaultContact(),
    notices: [],
    announcement: "",
    updatedAt: null,
    stored: false,
    tablesReady: false,
  };
}

export async function saveBusinessSettings(input: BusinessSettingsInput) {
  await ensureDatabase();
  const ready = await ensureBusinessTables();
  if (!ready) {
    throw new Error("The business settings table is not available yet. Run the additive migration, then try again.");
  }
  await updateSettings({ announcement: input.announcement || null });
  const savedAt = new Date();
  await db
    .insert(businessSettings)
    .values({
      id: 1,
      openingHours: input.openingHours,
      holidayHours: [...input.holidayHours].sort((a, b) => a.date.localeCompare(b.date)),
      specialEvents: [...input.specialEvents].sort((a, b) => a.date.localeCompare(b.date)),
      contact: input.contact,
      notices: input.notices,
      updatedAt: savedAt,
    })
    .onConflictDoUpdate({
      target: businessSettings.id,
      set: {
        openingHours: input.openingHours,
        holidayHours: [...input.holidayHours].sort((a, b) => a.date.localeCompare(b.date)),
        specialEvents: [...input.specialEvents].sort((a, b) => a.date.localeCompare(b.date)),
        contact: input.contact,
        notices: input.notices,
        updatedAt: savedAt,
      },
    });
  return getBusinessSettings();
}

export type { HolidayHour, SpecialEvent, RestaurantNotice, DayKey };
