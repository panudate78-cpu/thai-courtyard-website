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
  await pool.query(`ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "allergens" text[] NOT NULL DEFAULT '{}'`);
  // Pre-tick: due to possible cross contamination, set any dish that has no allergen data to all 14 allergens.
  // This is the safest default — kitchen can later untick after confirming with allergen matrix.
  try {
    const all = ["celery","gluten","crustaceans","egg","fish","lupin","milk","molluscs","mustard","nuts","peanuts","sesame","soya","sulphites"];
    // Use ARRAY literal
    await pool.query(
      `UPDATE "menu_items" SET "allergens" = $1::text[] WHERE "allergens" = '{}'::text[] OR array_length("allergens",1) IS NULL`,
      [all]
    );
  } catch (e) {
    console.warn("[db] allergens backfill skipped", e);
  }
}
