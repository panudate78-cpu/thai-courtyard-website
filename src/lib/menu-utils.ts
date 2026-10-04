import type { MenuItem } from "./types";

/** Lowest possible price for a dish (base price + cheapest required choices). */
export function startingPrice(item: MenuItem) {
  let price = item.pricePence;
  for (const group of item.groups) {
    if (!group.required) continue;
    const prices = group.choices.filter((c) => c.available).map((c) => c.pricePence);
    if (prices.length) price += Math.min(...prices);
  }
  return price;
}

export function hasPriceRange(item: MenuItem) {
  return item.groups.some((group) => {
    if (!group.required) return false;
    const prices = group.choices.filter((c) => c.available).map((c) => c.pricePence);
    return prices.length > 1 && Math.max(...prices) !== Math.min(...prices);
  });
}

export function requiredChoiceHint(item: MenuItem) {
  const names = item.groups
    .filter((g) => g.required)
    .map((g) => g.name.replace(/^choice of /i, "").toLowerCase());
  return names.length ? `Choose ${names.join(" & ")}` : "";
}
