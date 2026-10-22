/**
 * Gross-margin estimates used only when menu items have no cost price.
 * Replace this map when cost prices are added to the menu.
 */
export const ESTIMATED_MARGIN: Record<string, number> = {
  Starters: 0.68,
  Soups: 0.7,
  Curries: 0.66,
  "Stir Fried": 0.64,
  Salads: 0.72,
  "Recommended Dishes": 0.62,
  "Noodles / Rice": 0.7,
  Sides: 0.75,
  Drinks: 0.78,
};

export const MARGIN_NOTE =
  "Estimated margins — cost prices are not stored on menu items. Figures use a category food-cost ratio so the ranking can be replaced with live costs later.";

export function estimatedMargin(category: string) {
  return ESTIMATED_MARGIN[category] ?? 0.65;
}

export function marginLabel(category: string) {
  return `${Math.round(estimatedMargin(category) * 100)}% est.`;
}
