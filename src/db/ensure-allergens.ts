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

// Sensible definite allergens per dish — based on actual Thai recipes at Thai Courtyard.
// Only ingredients that are definitely in the dish, not cross-contact. Admin can refine.
// Keys must match UK FSA 14: celery, gluten, crustaceans, egg, fish, lupin, milk, molluscs, mustard, nuts, peanuts, sesame, soya, sulphites
const DEFINITE_ALLERGENS: Record<string, string[]> = {
  // Starters
  "Thai Prawn Crackers": ["crustaceans", "gluten"],
  "Vegetable Spring Rolls": ["gluten", "soya"],
  "Satay Chicken": ["peanuts", "soya", "gluten"],
  "Prawn Sesame Rolls": ["crustaceans", "sesame", "gluten", "soya"],
  "Salt & Pepper Tofu": ["soya", "gluten"],
  "Szechuan Peppercorn Squid": ["molluscs", "gluten", "soya"],
  "Pepper Wings": ["gluten", "soya", "egg"],
  "Thai Fishcake": ["fish", "egg", "gluten", "soya"],
  "Red Wine Wings": ["gluten", "soya", "sesame", "sulphites"],
  "Red Wine Ribs": ["gluten", "soya", "sesame", "sulphites"],
  "Szechuan Ribs": ["gluten", "soya"],
  "Mussels": ["molluscs", "fish", "soya", "gluten"],
  "Pork Dumplings": ["gluten", "soya", "egg", "sesame"],
  // Soups — base often fish sauce; seafood variants add crustaceans/molluscs via protein choice (not tagged here)
  "Tom Yum": ["fish", "crustaceans", "soya", "gluten"],
  "Tom Kha": ["fish", "crustaceans", "soya"],
  // Curries — coconut milk base with fish sauce + shrimp paste
  "Red Curry": ["fish", "crustaceans", "soya", "gluten"],
  "Green Curry": ["fish", "crustaceans", "soya", "gluten"],
  "Phanaeng": ["fish", "crustaceans", "peanuts", "nuts", "soya", "gluten"],
  // Stir Fried — soy + oyster + fish sauce common
  "Sweet & Sour": ["soya", "gluten", "fish"],
  "Cashew Nut": ["nuts", "soya", "gluten", "fish"],
  "Pad Khing": ["soya", "gluten", "fish"],
  "Pad Grapow": ["soya", "gluten", "fish", "egg"],
  "Pad Kratiem Prik Thai": ["soya", "gluten", "fish"],
  "Pad Pak": ["soya", "gluten", "molluscs", "fish", "sesame"],
  // Salads
  "Yum Yum": ["fish", "soya", "gluten", "peanuts"],
  "Larb": ["fish", "soya", "gluten"],
  // Recommended
  "Lemon Grass Chicken": ["fish", "soya", "gluten"],
  "Tamarind Duck": ["fish", "soya", "gluten"],
  "Steamed Seabass": ["fish", "soya", "gluten"],
  // Noodles / Rice
  "Pad Thai": ["peanuts", "soya", "gluten", "fish", "egg", "crustaceans"],
  "Pad Si-Ew": ["gluten", "soya", "egg", "fish", "molluscs"],
  "Pad Kee Mao": ["gluten", "soya", "egg", "fish"],
  "Pad Mee": ["gluten", "soya", "egg", "fish"],
  "Fried Rice": ["egg", "soya", "gluten", "fish", "molluscs"],
  // Sides
  "Steamed Jasmine Rice": [],
  "Egg Fried Rice": ["egg", "soya", "gluten", "fish", "molluscs"],
  "Coconut Rice": [],
  "Egg Noodles": ["gluten", "egg", "soya"],
  "Curry Sauce": ["fish", "crustaceans", "soya", "gluten"],
  "Sweet & Sour Sauce": ["soya", "gluten"],
  "Roti": ["gluten", "milk", "egg"],
  "Fried Egg": ["egg"],
  "Chilli Sauce": [],
  // Drinks — none
  "Coke 330ml": [],
  "Diet Coke 330ml": [],
  "Fanta Orange 330ml": [],
  "Sprite 330ml": [],
  "Lipton Lemon Ice Tea 330ml": [],
  "R Whites Lemonade 330ml": [],
  "Still Water 500ml": [],
  "Sparkling Water 500ml": [],
};

async function applyAllergensColumn() {
  // Add allergens column to menu_items if it doesn't exist. Existing rows keep default '{}'.
  // Only definite allergens are stored per dish — no auto pre-tick of all 14.
  await pool.query(`ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "allergens" text[] NOT NULL DEFAULT '{}'`);
  // Cleanup: dishes that were auto-filled with all 14 during the earlier pre-tick (PR 42) should not show all allergens.
  // If a dish currently has all 14, it was not a definite list — reset to empty so only definite ticks remain.
  try {
    await pool.query(`UPDATE "menu_items" SET allergens = '{}'::text[] WHERE array_length(allergens, 1) = 14`);
  } catch (e) {
    console.warn("[db] allergens cleanup skipped", e);
  }
  // Populate sensible definite allergens where still empty — so menu/order immediately show correct badges.
  // Only fills dishes that still have '{}' (never manually edited); admin edits are preserved.
  try {
    for (const [name, allergens] of Object.entries(DEFINITE_ALLERGENS)) {
      await pool.query(`UPDATE "menu_items" SET allergens = $1::text[] WHERE name = $2 AND allergens = '{}'::text[]`, [allergens, name]);
    }
  } catch (e) {
    console.warn("[db] allergens default fill skipped", e);
  }
}
