// UK FSA 14 major allergens — numbers follow the EU/FSA ordering used on many UK menus
export const ALLERGENS = {
  celery: {
    number: 1,
    short: "Ce",
    label: "Celery",
    description: "Celery stalks, leaves, seeds and celeriac. Often in stocks, soups and salads.",
  },
  gluten: {
    number: 2,
    short: "G",
    label: "Gluten",
    description: "Wheat, rye, barley, oats — e.g. soy sauce, noodles, batters, wheat flour.",
  },
  crustaceans: {
    number: 3,
    short: "Cr",
    label: "Crustaceans",
    description: "Prawns, crab, lobster, shrimp paste, prawn crackers.",
  },
  egg: {
    number: 4,
    short: "E",
    label: "Eggs",
    description: "Egg noodles, fried rice, batters, mayonnaise.",
  },
  fish: {
    number: 5,
    short: "F",
    label: "Fish",
    description: "Fish sauce (nam pla), dried fish, fish stock, anchovy paste — very common in Thai cooking.",
  },
  lupin: {
    number: 6,
    short: "L",
    label: "Lupin",
    description: "Lupin flour/seeds — rare in Thai food but listed for completeness.",
  },
  milk: {
    number: 7,
    short: "Mi",
    label: "Milk",
    description: "Cow's milk, butter, cheese, cream, yoghurt. Coconut milk/coconut cream is not cow's milk but we still flag milk when dairy is used.",
  },
  molluscs: {
    number: 8,
    short: "Mo",
    label: "Molluscs",
    description: "Mussels, squid, oyster sauce, clam stock. Oyster sauce is a mollusc.",
  },
  mustard: {
    number: 9,
    short: "Mu",
    label: "Mustard",
    description: "Mustard paste, powder, seeds.",
  },
  nuts: {
    number: 10,
    short: "N",
    label: "Tree nuts",
    description: "Almond, cashew, hazelnut, walnut, etc. (peanuts are separate, see below).",
  },
  peanuts: {
    number: 11,
    short: "P",
    label: "Peanuts",
    description: "Peanut sauce, satay, crushed peanuts — frequent in Thai salads & satay.",
  },
  sesame: {
    number: 12,
    short: "Se",
    label: "Sesame",
    description: "Sesame oil, sesame seeds, tahini.",
  },
  soya: {
    number: 13,
    short: "So",
    label: "Soya",
    description: "Soy sauce, tofu, soy oil, miso, soya mince.",
  },
  sulphites: {
    number: 14,
    short: "Su",
    label: "Sulphur dioxide / Sulphites",
    description: "Preservative in dried fruit, wine vinegar, some prawns; concentration >10ppm must be labelled.",
  },
} as const;

export type AllergenKey = keyof typeof ALLERGENS;
export const ALLERGEN_KEYS = Object.keys(ALLERGENS) as AllergenKey[];
export const ALLERGEN_NUMBERS = ALLERGEN_KEYS.map((k) => ALLERGENS[k].number);

export function isAllergenKey(value: string): value is AllergenKey {
  return Object.prototype.hasOwnProperty.call(ALLERGENS, value);
}

// Helper for sorting allergen keys by EU number (1–14) for consistent display
export function sortAllergens(keys: AllergenKey[]): AllergenKey[] {
  return [...keys].sort((a, b) => ALLERGENS[a].number - ALLERGENS[b].number);
}

// For display: "Peanuts (11), Fish (5), Soya (13)" etc — short + number
export function allergenBadgeLabel(key: AllergenKey): string {
  const a = ALLERGENS[key];
  return `${a.short}${a.number}`;
}
