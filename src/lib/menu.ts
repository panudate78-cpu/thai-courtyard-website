import { asc } from "drizzle-orm";
import { db } from "@/db";
import { ensureDatabase } from "@/db/bootstrap";
import { menuCategories, menuItems, optionChoices, optionGroups } from "@/db/schema";
import { isAllergenKey } from "./allergens";
import { isDietaryKey } from "./dietary";
import type { MenuCategory, MenuChoice, MenuGroup, MenuItem } from "./types";

const byGroupOrder = (a: MenuGroup, b: MenuGroup) =>
  Number(b.required) - Number(a.required) || a.sortOrder - b.sortOrder || a.id - b.id;

export async function getMenu(options: { includeHidden?: boolean } = {}): Promise<MenuCategory[]> {
  await ensureDatabase();
  try {
    const { ensureAllergensColumn } = await import("@/db/ensure-allergens");
    await ensureAllergensColumn();
  } catch {}

  const includeHidden = options.includeHidden ?? false;
  const [cats, items, groups, choices] = await Promise.all([
    db.select().from(menuCategories).orderBy(asc(menuCategories.sortOrder), asc(menuCategories.id)),
    db.select().from(menuItems).orderBy(asc(menuItems.sortOrder), asc(menuItems.id)),
    db.select().from(optionGroups).orderBy(asc(optionGroups.sortOrder), asc(optionGroups.id)),
    db.select().from(optionChoices).orderBy(asc(optionChoices.sortOrder), asc(optionChoices.id)),
  ]);

  const choicesByGroup = new Map<number, MenuChoice[]>();
  for (const c of choices) {
    const list = choicesByGroup.get(c.groupId) ?? [];
    list.push({ id: c.id, name: c.name, pricePence: c.pricePence, available: c.available });
    choicesByGroup.set(c.groupId, list);
  }

  const allGroups: MenuGroup[] = groups.map((g) => ({
    id: g.id,
    categoryId: g.categoryId,
    itemId: g.itemId,
    name: g.name,
    required: g.required,
    maxSelect: g.maxSelect,
    sortOrder: g.sortOrder,
    choices: choicesByGroup.get(g.id) ?? [],
  }));

  const result: MenuCategory[] = [];
  for (const c of cats) {
    if (!includeHidden && !c.visible) continue;
    const categoryGroups = allGroups.filter((g) => g.categoryId === c.id && g.itemId === null).sort(byGroupOrder);
    const categoryItems: MenuItem[] = items
      .filter((i) => i.categoryId === c.id && (includeHidden || i.visible))
      .map((i) => {
        const own = allGroups.filter((g) => g.itemId === i.id).sort(byGroupOrder);
        const ownNames = new Set(own.map((g) => g.name.trim().toLowerCase()));
        const effective = [...own, ...categoryGroups.filter((g) => !ownNames.has(g.name.trim().toLowerCase()))].sort(
          byGroupOrder,
        );
        return {
          id: i.id,
          categoryId: i.categoryId,
          name: i.name,
          description: i.description,
          pricePence: i.pricePence,
          dietary: (i.dietary ?? []).filter(isDietaryKey),
          allergens: ((i as unknown as { allergens?: unknown }).allergens as string[] ?? []).filter(isAllergenKey),
          available: i.available,
          visible: i.visible,
          featured: i.featured,
          sortOrder: i.sortOrder,
          ownGroups: own,
          groups: effective,
        };
      });
    result.push({
      id: c.id,
      name: c.name,
      description: c.description,
      sortOrder: c.sortOrder,
      visible: c.visible,
      groups: categoryGroups,
      items: categoryItems,
    });
  }
  return result;
}
