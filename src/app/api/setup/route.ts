import { count } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { appendMenu, clearMenu, ensureDatabase } from "@/db/bootstrap";
import { menuCategories } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { getBusinessSettings, saveBusinessSettings } from "@/lib/business/settings-store";
import { draftToSeed, importPublishSchema } from "@/lib/menu-import";
import {
  getRestaurantProfile,
  restaurantProfileSchema,
  saveRestaurantProfile,
} from "@/lib/restaurant";
import { getSettings, updateSettings } from "@/lib/settings";
import { firstError, readJson } from "@/lib/validation";

export const dynamic = "force-dynamic";

const daySchema = z.object({ closed: z.boolean(), open: z.string(), close: z.string() });

const setupSchema = z.object({
  profile: restaurantProfileSchema,
  openingHours: z.object({
    "0": daySchema,
    "1": daySchema,
    "2": daySchema,
    "3": daySchema,
    "4": daySchema,
    "5": daySchema,
    "6": daySchema,
  }),
  ordering: z
    .object({
      leadTimeMinutes: z.number().int().min(5).max(240),
      slotIntervalMinutes: z.number().int().min(5).max(60),
      maxDaysAhead: z.number().int().min(1).max(30),
    })
    .optional(),
  menuAction: z.enum(["keep", "empty", "categories", "import"]).optional(),
  categoryNames: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
  importDraft: importPublishSchema.optional(),
  complete: z.boolean().optional(),
});

async function canEditSetup() {
  const profile = await getRestaurantProfile();
  if (!profile.setupCompleted) return true;
  return isAdmin();
}

export async function GET() {
  try {
    await ensureDatabase();
    const [profile, business, settings, catCount, admin] = await Promise.all([
      getRestaurantProfile(),
      getBusinessSettings(),
      getSettings(),
      db.select({ value: count() }).from(menuCategories),
      isAdmin(),
    ]);
    return Response.json({
      setupCompleted: profile.setupCompleted,
      canEdit: !profile.setupCompleted || admin,
      profile,
      openingHours: business.openingHours,
      ordering: {
        leadTimeMinutes: settings.leadTimeMinutes,
        slotIntervalMinutes: settings.slotIntervalMinutes,
        maxDaysAhead: settings.maxDaysAhead,
      },
      menuCategoryCount: catCount[0]?.value ?? 0,
    });
  } catch (error) {
    console.error("[setup] status failed", error);
    return Response.json({ error: "Could not load setup status. Check DATABASE_URL and try again." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await canEditSetup())) {
    return Response.json({ error: "Setup is already complete. Sign in to the admin to change business settings." }, { status: 403 });
  }
  const parsed = setupSchema.safeParse(await readJson(req));
  if (!parsed.success) return Response.json({ error: firstError(parsed.error) }, { status: 400 });
  const { profile, openingHours, ordering, menuAction, categoryNames, importDraft, complete } = parsed.data;

  try {
    const existingBusiness = await getBusinessSettings();
    await saveBusinessSettings({
      openingHours,
      holidayHours: existingBusiness.holidayHours,
      specialEvents: existingBusiness.specialEvents,
      contact: {
        phoneDisplay: profile.phoneDisplay,
        email: profile.email,
        street: profile.street,
        locality: profile.locality,
        postcode: profile.postcode,
      },
      notices: existingBusiness.notices,
      announcement: existingBusiness.announcement,
    });
    if (ordering) await updateSettings(ordering);

    if (complete) {
      if (menuAction === "empty") {
        await clearMenu();
      } else if (menuAction === "categories" && categoryNames?.length) {
        await clearMenu();
        const { insertMenu } = await import("@/db/bootstrap");
        await db.transaction(async (tx) => {
          await insertMenu(
            tx,
            categoryNames.map((name) => ({ name, items: [] })),
          );
        });
      } else if (menuAction === "import" && importDraft) {
        const seed = draftToSeed(importDraft);
        if (!seed.length) return Response.json({ error: "The imported menu has no items to publish." }, { status: 400 });
        await clearMenu();
        await appendMenu(seed);
      }
      // "keep" leaves the current (demo or existing) menu untouched.
    }

    const saved = await saveRestaurantProfile({
      ...profile,
      setupCompleted: complete ? true : profile.setupCompleted,
      demoMode: complete ? false : profile.demoMode,
    });
    return Response.json({ ok: true, profile: saved, setupCompleted: saved.setupCompleted });
  } catch (error) {
    console.error("[setup] save failed", error);
    return Response.json({ error: error instanceof Error ? error.message : "Could not save setup" }, { status: 500 });
  }
}
