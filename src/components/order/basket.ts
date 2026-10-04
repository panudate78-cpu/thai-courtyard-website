import type { MenuItem } from "@/lib/types";

export type BasketOption = { groupId: number; group: string; choiceId: number; choice: string; pricePence: number };

export type BasketLine = {
  key: string;
  itemId: number;
  name: string;
  unitPricePence: number;
  quantity: number;
  options: BasketOption[];
};

export function lineKey(itemId: number, choiceIds: number[]) {
  return `${itemId}:${[...choiceIds].sort((a, b) => a - b).join(",")}`;
}

/** Re-validates a stored basket against the current menu (drops removed items, refreshes prices). */
export function reconcileBasket(lines: unknown, items: Map<number, MenuItem>): BasketLine[] {
  if (!Array.isArray(lines)) return [];
  const result: BasketLine[] = [];
  for (const raw of lines) {
    const line = raw as Partial<BasketLine>;
    const item = typeof line.itemId === "number" ? items.get(line.itemId) : undefined;
    if (!item || !item.available || !Array.isArray(line.options)) continue;
    const options: BasketOption[] = [];
    let valid = true;
    for (const opt of line.options) {
      const group = item.groups.find((g) => g.choices.some((c) => c.id === opt?.choiceId));
      const choice = group?.choices.find((c) => c.id === opt?.choiceId);
      if (!group || !choice || !choice.available) {
        valid = false;
        break;
      }
      options.push({ groupId: group.id, group: group.name, choiceId: choice.id, choice: choice.name, pricePence: choice.pricePence });
    }
    if (!valid) continue;
    if (item.groups.some((g) => g.required && !options.some((o) => o.groupId === g.id))) continue;
    const quantity = Math.min(50, Math.max(1, Math.floor(Number(line.quantity) || 1)));
    const key = lineKey(item.id, options.map((o) => o.choiceId));
    const existing = result.find((l) => l.key === key);
    if (existing) {
      existing.quantity = Math.min(50, existing.quantity + quantity);
      continue;
    }
    result.push({
      key,
      itemId: item.id,
      name: item.name,
      unitPricePence: item.pricePence + options.reduce((sum, o) => sum + o.pricePence, 0),
      quantity,
      options,
    });
  }
  return result;
}
