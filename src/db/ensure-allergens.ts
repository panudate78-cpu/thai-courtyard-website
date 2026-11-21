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
}
