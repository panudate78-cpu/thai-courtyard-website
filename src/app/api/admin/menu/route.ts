import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { ensureDatabase } from "@/db/bootstrap";
import { menuCategories, menuItems, optionChoices, optionGroups } from "@/db/schema";
import { adminGuard } from "@/lib/auth";
import { isAllergenKey } from "@/lib/allergens";
import { isDietaryKey } from "@/lib/dietary";
import { readJson } from "@/lib/validation";

export const dynamic = "force-dynamic";

const id = z.number().int().positive();
const direction = z.enum(["up", "down"]);
const name = z.string().trim().min(1, "Please enter a name").max(100, "Name is too long");
const description = z.string().trim().max(600, "Description is too long").nullable().optional();
const price = z.number().int().min(0, "Price can't be negative").max(100000, "That price looks too high");
const dietary = z.array(z.string()).max(14).optional();
const allergens = z.array(z.string()).max(14).optional();

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("createCategory"), name, description, visible: z.boolean().optional() }),
  z.object({ action: z.literal("updateCategory"), id, name: name.optional(), description, visible: z.boolean().optional() }),
  z.object({ action: z.literal("deleteCategory"), id }),
  z.object({ action: z.literal("moveCategory"), id, direction }),
  z.object({
    action: z.literal("createItem"),
    categoryId: id,
    name,
    description,
    pricePence: price,
    dietary,
    allergens,
    available: z.boolean().optional(),
    visible: z.boolean().optional(),
    featured: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("updateItem"),
    id,
    categoryId: id.optional(),
    name: name.optional(),
    description,
    pricePence: price.optional(),
    dietary,
    allergens,
    available: z.boolean().optional(),
    visible: z.boolean().optional(),
    featured: z.boolean().optional(),
  }),
  z.object({ action: z.literal("deleteItem"), id }),
  z.object({ action: z.literal("moveItem"), id, direction }),
  z.object({
    action: z.literal("saveGroup"),
    id: id.optional(),
    categoryId: id.nullable().optional(),
    itemId: id.nullable().optional(),
    name,
    required: z.boolean(),
    maxSelect: z.number().int().min(1).max(20),
    choices: z
      .array(
        z.object({
          id: id.optional(),
          name: z.string().trim().min(1, "Every choice needs a name").max(80, "Choice name is too long"),
          pricePence: z.number().int().min(-100000).max(100000),
          available: z.boolean(),
        }),
      )
      .min(1, "Add at least one choice")
      .max(40, "Too many choices"),
  }),
  z.object({ action: z.literal("deleteGroup"), id }),
  z.object({
    action: z.literal("setChoiceAvailability"),
    choiceName: z.string().trim().min(1, "Choose a protein").max(80, "Name is too long"),
    available: z.boolean(),
  }),
]);

const ok = () => Response.json({ ok: true });

function swapped(ids: number[], target: number, dir: "up" | "down") {
  const i = ids.indexOf(target);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ids.length) return null;
  const next = [...ids];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export async function POST(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const input = parsed.data;

  try {
    await ensureDatabase();
    try { const { ensureAllergensColumn } = await import("@/db/ensure-allergens"); await ensureAllergensColumn(); } catch {}
    switch (input.action) {
      case "createCategory": {
        const existing = await db.select({ id: menuCategories.id }).from(menuCategories);
        const [row] = await db
          .insert(menuCategories)
          .values({
            name: input.name,
            description: input.description || null,
            visible: input.visible ?? true,
            sortOrder: existing.length,
          })
          .returning({ id: menuCategories.id });
        return Response.json({ ok: true, id: row.id });
      }
      case "updateCategory": {
        const set: Partial<typeof menuCategories.$inferInsert> = {};
        if (input.name !== undefined) set.name = input.name;
        if (input.description !== undefined) set.description = input.description || null;
        if (input.visible !== undefined) set.visible = input.visible;
        if (Object.keys(set).length) await db.update(menuCategories).set(set).where(eq(menuCategories.id, input.id));
        return ok();
      }
      case "deleteCategory": {
        await db.delete(menuCategories).where(eq(menuCategories.id, input.id));
        return ok();
      }
      case "moveCategory": {
        const rows = await db
          .select({ id: menuCategories.id })
          .from(menuCategories)
          .orderBy(asc(menuCategories.sortOrder), asc(menuCategories.id));
        const ids = swapped(
          rows.map((r) => r.id),
          input.id,
          input.direction,
        );
        if (ids) {
          await db.transaction(async (tx) => {
            for (const [index, categoryId] of ids.entries()) {
              await tx.update(menuCategories).set({ sortOrder: index }).where(eq(menuCategories.id, categoryId));
            }
          });
        }
        return ok();
      }
      case "createItem": {
        const siblings = await db.select({ id: menuItems.id }).from(menuItems).where(eq(menuItems.categoryId, input.categoryId));
        const [row] = await db
          .insert(menuItems)
          .values({
            categoryId: input.categoryId,
            name: input.name,
            description: input.description || null,
            pricePence: input.pricePence,
            dietary: (input.dietary ?? []).filter(isDietaryKey),
            allergens: (input.allergens ?? []).filter(isAllergenKey) as string[],
            available: input.available ?? true,
            visible: input.visible ?? true,
            featured: input.featured ?? false,
            sortOrder: siblings.length,
          })
          .returning({ id: menuItems.id });
        return Response.json({ ok: true, id: row.id });
      }
      case "updateItem": {
        const set: Partial<typeof menuItems.$inferInsert> = { updatedAt: new Date() };
        if (input.name !== undefined) set.name = input.name;
        if (input.description !== undefined) set.description = input.description || null;
        if (input.pricePence !== undefined) set.pricePence = input.pricePence;
        if (input.dietary !== undefined) set.dietary = input.dietary.filter(isDietaryKey);
        if (input.allergens !== undefined) (set as Record<string, unknown>).allergens = input.allergens.filter(isAllergenKey);
        if (input.available !== undefined) set.available = input.available;
        if (input.visible !== undefined) set.visible = input.visible;
        if (input.featured !== undefined) set.featured = input.featured;
        if (input.categoryId !== undefined) {
          const [current] = await db.select({ categoryId: menuItems.categoryId }).from(menuItems).where(eq(menuItems.id, input.id));
          if (current && current.categoryId !== input.categoryId) {
            const siblings = await db.select({ id: menuItems.id }).from(menuItems).where(eq(menuItems.categoryId, input.categoryId));
            set.categoryId = input.categoryId;
            set.sortOrder = siblings.length;
          }
        }
        await db.update(menuItems).set(set).where(eq(menuItems.id, input.id));
        return ok();
      }
      case "deleteItem": {
        await db.delete(menuItems).where(eq(menuItems.id, input.id));
        return ok();
      }
      case "moveItem": {
        const [item] = await db.select({ categoryId: menuItems.categoryId }).from(menuItems).where(eq(menuItems.id, input.id));
        if (!item) return Response.json({ error: "Dish not found" }, { status: 404 });
        const rows = await db
          .select({ id: menuItems.id })
          .from(menuItems)
          .where(eq(menuItems.categoryId, item.categoryId))
          .orderBy(asc(menuItems.sortOrder), asc(menuItems.id));
        const ids = swapped(
          rows.map((r) => r.id),
          input.id,
          input.direction,
        );
        if (ids) {
          await db.transaction(async (tx) => {
            for (const [index, itemId] of ids.entries()) {
              await tx.update(menuItems).set({ sortOrder: index }).where(eq(menuItems.id, itemId));
            }
          });
        }
        return ok();
      }
      case "saveGroup": {
        if (!input.id && !input.categoryId && !input.itemId) {
          return Response.json({ error: "Choose a category or dish for these options" }, { status: 400 });
        }
        await db.transaction(async (tx) => {
          let groupId = input.id;
          if (groupId) {
            await tx
              .update(optionGroups)
              .set({ name: input.name, required: input.required, maxSelect: input.maxSelect })
              .where(eq(optionGroups.id, groupId));
          } else {
            const ownerFilter = input.itemId
              ? eq(optionGroups.itemId, input.itemId)
              : eq(optionGroups.categoryId, input.categoryId as number);
            const siblings = await tx.select({ id: optionGroups.id }).from(optionGroups).where(ownerFilter);
            const [row] = await tx
              .insert(optionGroups)
              .values({
                name: input.name,
                required: input.required,
                maxSelect: input.maxSelect,
                categoryId: input.itemId ? null : (input.categoryId ?? null),
                itemId: input.itemId ?? null,
                sortOrder: siblings.length,
              })
              .returning({ id: optionGroups.id });
            groupId = row.id;
          }
          const existing = await tx.select({ id: optionChoices.id }).from(optionChoices).where(eq(optionChoices.groupId, groupId));
          const existingIds = new Set(existing.map((e) => e.id));
          const keep = new Set(input.choices.flatMap((c) => (c.id && existingIds.has(c.id) ? [c.id] : [])));
          const remove = existing.filter((e) => !keep.has(e.id)).map((e) => e.id);
          if (remove.length) await tx.delete(optionChoices).where(inArray(optionChoices.id, remove));
          for (const [index, choice] of input.choices.entries()) {
            const values = { name: choice.name, pricePence: choice.pricePence, available: choice.available, sortOrder: index };
            if (choice.id && keep.has(choice.id)) {
              await tx.update(optionChoices).set(values).where(eq(optionChoices.id, choice.id));
            } else {
              await tx.insert(optionChoices).values({ ...values, groupId });
            }
          }
        });
        return ok();
      }
      case "deleteGroup": {
        await db.delete(optionGroups).where(eq(optionGroups.id, input.id));
        return ok();
      }
      case "setChoiceAvailability": {
        // Master switch: flip one named choice (e.g. "Prawn") in every
        // "Choice of Protein"-style group at once — category-wide groups and
        // dish-specific ones — so a missing protein disappears from all
        // sub-menus in a single action.
        const target = input.choiceName.trim().toLowerCase();
        const proteinGroupIds = db
          .select({ id: optionGroups.id })
          .from(optionGroups)
          .where(sql`lower(trim(${optionGroups.name})) like '%protein%'`);
        const rows = await db
          .update(optionChoices)
          .set({ available: input.available })
          .where(and(inArray(optionChoices.groupId, proteinGroupIds), sql`lower(trim(${optionChoices.name})) = ${target}`))
          .returning({ id: optionChoices.id });
        return Response.json({ ok: true, updated: rows.length });
      }
    }
    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("[admin/menu] failed", error);
    return Response.json({ error: "Could not save your change. Please try again." }, { status: 500 });
  }
}
