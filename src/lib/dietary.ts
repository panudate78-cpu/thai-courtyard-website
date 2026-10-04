export const DIETARY = {
  vegetarian: { short: "V", label: "Vegetarian", tone: "jade" },
  vegan: { short: "VG", label: "Vegan", tone: "jade" },
  veg_option: { short: "VO", label: "Vegetarian option available (tofu or vegetable)", tone: "jade" },
  spicy: { short: "Spicy", label: "Spicy", tone: "chili" },
  nuts: { short: "N", label: "Contains nuts", tone: "teak" },
  gluten_free: { short: "GF", label: "Gluten free", tone: "gold" },
  popular: { short: "Chef's pick", label: "Chef's recommendation", tone: "gold" },
} as const;

export type DietaryKey = keyof typeof DIETARY;
export type DietaryTone = (typeof DIETARY)[DietaryKey]["tone"];

export const DIETARY_KEYS = Object.keys(DIETARY) as DietaryKey[];

export function isDietaryKey(value: string): value is DietaryKey {
  return Object.prototype.hasOwnProperty.call(DIETARY, value);
}
