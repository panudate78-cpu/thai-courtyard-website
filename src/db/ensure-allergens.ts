import { pool } from "@/db";

const globalForAllergens = globalThis as typeof globalThis & { __thaiCourtyardAllergensReady?: Promise<void> };

export function ensureAllergensColumn(): Promise<void> {
  if (!globalForAllergens.__thaiCourtyardAllergensReady) {
    globalForAllergens.__thaiCourtyardAllergensReady = applyAllergensColumn().catch((error) => {
      globalForAllergens.__thaiCourtyardAllergensReady = undefined;
      throw error;
    });
  }
  return globalForAllergens.__thaiCourtyardAllergensReady;
}

async function applyAllergensColumn() {
  // Add allergens column to menu_items if it doesn't exist. Existing rows keep default '{}'.
  // Only definite allergens are stored per dish — no auto pre-tick of all 14.
  await pool.query(`ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "allergens" text[] NOT NULL DEFAULT '{}'`);
  // Cleanup: dishes that were auto-filled with all 14 during the earlier pre-tick (PR 42) should not show all allergens.
  // If a dish currently has all 14, it was not a definite list — reset to empty so only definite ticks remain.
  // This keeps the promise: "only list the definite allergens present in each dish, not all".
  try {
    await pool.query(`UPDATE "menu_items" SET allergens = '{}'::text[] WHERE array_length(allergens, 1) = 14`);
  } catch (e) {
    console.warn("[db] allergens cleanup skipped", e);
  }
}
