import type { Metadata } from "next";
import Link from "next/link";
import { count } from "drizzle-orm";
import { db } from "@/db";
import { ensureDatabase } from "@/db/bootstrap";
import { menuCategories } from "@/db/schema";
import { SetupWizard } from "@/components/setup/SetupWizard";
import { isAdmin } from "@/lib/auth";
import { getBusinessSettings } from "@/lib/business/settings-store";
import { getRestaurantConfigSafe, getRestaurantProfile } from "@/lib/restaurant";
import { getSettingsSafe } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Set up your restaurant",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  let initial = null;
  let setupCompleted = false;
  let canEdit = true;
  try {
    await ensureDatabase();
    const [profile, business, settings, catCount, admin] = await Promise.all([
      getRestaurantProfile(),
      getBusinessSettings(),
      getSettingsSafe(),
      db.select({ value: count() }).from(menuCategories),
      isAdmin(),
    ]);
    setupCompleted = profile.setupCompleted;
    canEdit = !profile.setupCompleted || admin;
    initial = {
      profile,
      openingHours: business.openingHours,
      ordering: {
        leadTimeMinutes: settings.leadTimeMinutes,
        slotIntervalMinutes: settings.slotIntervalMinutes,
        maxDaysAhead: settings.maxDaysAhead,
      },
      menuCategoryCount: catCount[0]?.value ?? 0,
      setupCompleted: profile.setupCompleted,
    };
  } catch (error) {
    console.error("[setup] page load failed", error);
  }

  if (!initial) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-serif text-4xl font-semibold">We can&apos;t reach the database yet</h1>
        <p className="mt-3 text-charcoal/70">
          Add your Neon <code>DATABASE_URL</code> to the environment (see <code>docs/neon-setup.md</code>), redeploy,
          then refresh this page. The platform creates every table automatically on first run.
        </p>
      </main>
    );
  }

  if (setupCompleted && !canEdit) {
    const config = await getRestaurantConfigSafe();
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-serif text-4xl font-semibold">{config.name} is already set up</h1>
        <p className="mt-3 text-charcoal/70">Business settings now live in the admin — it only takes a minute to sign in.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/admin" className="btn btn-dark">Open admin</Link>
          <Link href="/" className="btn btn-outline">View website</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-svh bg-[#f5f1ea]">
      <SetupWizard initial={initial} />
    </main>
  );
}
