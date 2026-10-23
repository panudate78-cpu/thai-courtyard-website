/**
 * Gross-margin estimates used only when menu items have no cost price.
 * Replace this map when cost prices are added to the menu.
 */
export const ESTIMATED_MARGIN: Record<string, number> = {
  Starters: 0.68,
  Mains: 0.66,
  Grill: 0.62,
  Salads: 0.72,
  Sides: 0.75,
  Desserts: 0.74,
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
