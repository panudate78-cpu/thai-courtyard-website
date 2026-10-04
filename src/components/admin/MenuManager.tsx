"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronDown, Eye, EyeOff, Loader2, Pencil, Plus, Search, Settings2, Star, Trash2 } from "lucide-react";
import { DIETARY, DIETARY_KEYS, type DietaryKey } from "@/lib/dietary";
import { formatPrice, poundsToPence } from "@/lib/format";
import type { MenuCategory, MenuGroup, MenuItem } from "@/lib/types";
import { Modal, Notice, Toggle, useNotice } from "./AdminUI";

type RunFn = (body: Record<string, unknown>, okText: string) => Promise<boolean>;
type ItemTarget = { mode: "create"; categoryId: number } | { mode: "edit"; item: MenuItem };
type CategoryTarget = { mode: "create" } | { mode: "edit"; category: MenuCategory };
type GroupTarget = { title: string; categoryId?: number; itemId?: number };

function choiceSummary(group: MenuGroup) {
  return group.choices.map((c) => (c.pricePence ? `${c.name} +${formatPrice(c.pricePence)}` : c.name)).join(", ");
}

export function MenuManager({ categories }: { categories: MenuCategory[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [notice, setNotice] = useNotice();
  const [busy, setBusy] = useState(false);
  const [itemTarget, setItemTarget] = useState<ItemTarget | null>(null);
  const [categoryTarget, setCategoryTarget] = useState<CategoryTarget | null>(null);
  const [groupTarget, setGroupTarget] = useState<GroupTarget | null>(null);
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  const run: RunFn = async (body, okText) => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return false;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setNotice({ type: "ok", text: okText });
      startTransition(() => router.refresh());
      return true;
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Something went wrong" });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const editorGroups = useMemo(() => {
    if (!groupTarget) return [];
    if (groupTarget.itemId) {
      for (const c of categories) {
        const item = c.items.find((i) => i.id === groupTarget.itemId);
        if (item) return item.ownGroups;
      }
      return [];
    }
    return categories.find((c) => c.id === groupTarget.categoryId)?.groups ?? [];
  }, [groupTarget, categories]);

  const totalItems = categories.reduce((n, c) => n + c.items.length, 0);
  const soldOut = categories.reduce((n, c) => n + c.items.filter((i) => !i.available).length, 0);
  const q = query.trim().toLowerCase();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Menu &amp; prices</h1>
          <p className="text-sm text-black/55">
            {categories.length} categories · {totalItems} dishes{soldOut ? ` · ${soldOut} sold out` : ""}. Changes go live on the
            website and ordering page immediately.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-black/40" aria-hidden="true" />
            <label htmlFor="menu-admin-search" className="sr-only">
              Find a dish
            </label>
            <input
              id="menu-admin-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a dish"
              className="adm-input w-56 pl-9"
            />
          </div>
          <button type="button" className="adm-btn-primary" onClick={() => setCategoryTarget({ mode: "create" })}>
            <Plus aria-hidden="true" /> Add category
          </button>
        </div>
      </header>

      <p className="rounded-xl bg-white p-3 text-xs text-black/60 ring-1 ring-black/5">
        Tip: type a new price and press Enter to save it. Use the switch to mark a dish sold out for the day, and the star to feature
        it on the homepage. Category “Options” hold the protein and spice choices shared by every dish in that category.
      </p>

      {categories.map((category, ci) => {
        const items = q ? category.items.filter((i) => i.name.toLowerCase().includes(q)) : category.items;
        if (q && items.length === 0) return null;
        const isCollapsed = !q && Boolean(collapsed[category.id]);
        return (
          <section key={category.id} className="adm-card overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 border-b border-black/5 bg-black/[0.015] p-4">
              <button
                type="button"
                onClick={() => setCollapsed((c) => ({ ...c, [category.id]: !c[category.id] }))}
                aria-expanded={!isCollapsed}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <ChevronDown className={`h-5 w-5 shrink-0 transition ${isCollapsed ? "-rotate-90" : ""}`} aria-hidden="true" />
                <span className="truncate text-lg font-semibold">{category.name}</span>
                <span className="shrink-0 text-xs text-black/50">{category.items.length} dishes</span>
                {!category.visible ? <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-semibold">Hidden</span> : null}
              </button>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  className="adm-btn px-2"
                  aria-label={`Move ${category.name} up`}
                  disabled={busy || ci === 0}
                  onClick={() => run({ action: "moveCategory", id: category.id, direction: "up" }, "Category moved")}
                >
                  <ArrowUp aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="adm-btn px-2"
                  aria-label={`Move ${category.name} down`}
                  disabled={busy || ci === categories.length - 1}
                  onClick={() => run({ action: "moveCategory", id: category.id, direction: "down" }, "Category moved")}
                >
                  <ArrowDown aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="adm-btn"
                  disabled={busy}
                  onClick={() =>
                    run(
                      { action: "updateCategory", id: category.id, visible: !category.visible },
                      category.visible ? `${category.name} hidden from the website` : `${category.name} is now visible`,
                    )
                  }
                >
                  {category.visible ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
                  {category.visible ? "Visible" : "Hidden"}
                </button>
                <button
                  type="button"
                  className="adm-btn"
                  onClick={() => setGroupTarget({ title: `${category.name}: options for every dish`, categoryId: category.id })}
                >
                  <Settings2 aria-hidden="true" /> Options{category.groups.length ? ` (${category.groups.length})` : ""}
                </button>
                <button type="button" className="adm-btn" onClick={() => setCategoryTarget({ mode: "edit", category })}>
                  <Pencil aria-hidden="true" /> Edit
                </button>
                <button type="button" className="adm-btn-primary" onClick={() => setItemTarget({ mode: "create", categoryId: category.id })}>
                  <Plus aria-hidden="true" /> Add dish
                </button>
              </div>
            </div>
            {!isCollapsed && category.groups.length > 0 ? (
              <p className="border-b border-black/5 px-4 py-2 text-xs text-black/55">
                <b>Customer choices:</b> {category.groups.map((g) => `${g.name} (${choiceSummary(g)})`).join(" · ")}
              </p>
            ) : null}
            {!isCollapsed ? (
              items.length === 0 ? (
                <p className="p-6 text-center text-sm text-black/50">No dishes in this category yet.</p>
              ) : (
                <ul className="divide-y divide-black/5">
                  {items.map((item, index) => (
                    <ItemRow
                      key={`${item.id}-${item.pricePence}`}
                      item={item}
                      index={index}
                      total={items.length}
                      canMove={!q}
                      busy={busy}
                      run={run}
                      onEdit={() => setItemTarget({ mode: "edit", item })}
                    />
                  ))}
                </ul>
              )
            ) : null}
          </section>
        );
      })}

      {itemTarget ? (
        <ItemEditor
          target={itemTarget}
          categories={categories}
          busy={busy}
          run={run}
          onClose={() => setItemTarget(null)}
          onOptions={(item) => {
            setItemTarget(null);
            setGroupTarget({ title: `${item.name}: dish-specific options`, itemId: item.id });
          }}
        />
      ) : null}
      {categoryTarget ? (
        <CategoryEditor target={categoryTarget} busy={busy} run={run} onClose={() => setCategoryTarget(null)} />
      ) : null}
      {groupTarget ? (
        <GroupsEditor target={groupTarget} groups={editorGroups} busy={busy} run={run} onClose={() => setGroupTarget(null)} />
      ) : null}
      <Notice notice={notice} onClose={() => setNotice(null)} />
    </div>
  );
}

function ItemRow({
  item,
  index,
  total,
  canMove,
  busy,
  run,
  onEdit,
}: {
  item: MenuItem;
  index: number;
  total: number;
  canMove: boolean;
  busy: boolean;
  run: RunFn;
  onEdit: () => void;
}) {
  const [price, setPrice] = useState((item.pricePence / 100).toFixed(2));

  async function savePrice() {
    const pence = poundsToPence(price);
    if (!Number.isFinite(pence) || pence < 0) {
      setPrice((item.pricePence / 100).toFixed(2));
      return;
    }
    if (pence === item.pricePence) return;
    await run({ action: "updateItem", id: item.id, pricePence: pence }, `${item.name} is now ${formatPrice(pence)}`);
  }

  return (
    <li className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{item.name}</span>
          {item.featured ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
              <Star className="h-3 w-3 fill-current" aria-hidden="true" /> Homepage
            </span>
          ) : null}
          {!item.visible ? <span className="rounded-full bg-black/10 px-2 py-0.5 text-[11px] font-semibold">Hidden</span> : null}
          {!item.available ? (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-800">Sold out</span>
          ) : null}
          {item.dietary.map((d) => (
            <span key={d} className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-semibold text-black/60" title={DIETARY[d].label}>
              {DIETARY[d].short}
            </span>
          ))}
        </div>
        {item.description ? <p className="mt-0.5 line-clamp-1 text-sm text-black/55">{item.description}</p> : null}
        {item.ownGroups.length ? (
          <p className="mt-0.5 text-xs text-black/50">Dish options: {item.ownGroups.map((g) => g.name).join(", ")}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1 rounded-lg border border-black/15 bg-white px-2 focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/30">
          <span className="text-sm text-black/50">£</span>
          <input
            type="text"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onBlur={() => void savePrice()}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            aria-label={`Price of ${item.name}`}
            className="w-16 py-2 text-sm outline-none"
          />
        </label>
        <span className="flex items-center gap-2 text-xs text-black/60">
          <Toggle
            checked={item.available}
            disabled={busy}
            label={item.available ? `${item.name}: in stock (switch to mark sold out)` : `${item.name}: sold out (switch to mark available)`}
            onChange={(value) =>
              run({ action: "updateItem", id: item.id, available: value }, value ? `${item.name} is available` : `${item.name} marked sold out`)
            }
          />
          <span className="w-14">{item.available ? "In stock" : "Sold out"}</span>
        </span>
        <button
          type="button"
          className="adm-btn px-2"
          disabled={busy}
          aria-label={item.featured ? `Remove ${item.name} from homepage` : `Feature ${item.name} on homepage`}
          title={item.featured ? "Remove from homepage" : "Feature on homepage"}
          onClick={() =>
            run(
              { action: "updateItem", id: item.id, featured: !item.featured },
              item.featured ? `${item.name} removed from homepage` : `${item.name} featured on homepage`,
            )
          }
        >
          <Star className={item.featured ? "fill-amber-400 text-amber-500" : ""} aria-hidden="true" />
        </button>
        {canMove ? (
          <>
            <button
              type="button"
              className="adm-btn px-2"
              disabled={busy || index === 0}
              aria-label={`Move ${item.name} up`}
              onClick={() => run({ action: "moveItem", id: item.id, direction: "up" }, "Dish moved")}
            >
              <ArrowUp aria-hidden="true" />
            </button>
            <button
              type="button"
              className="adm-btn px-2"
              disabled={busy || index === total - 1}
              aria-label={`Move ${item.name} down`}
              onClick={() => run({ action: "moveItem", id: item.id, direction: "down" }, "Dish moved")}
            >
              <ArrowDown aria-hidden="true" />
            </button>
          </>
        ) : null}
        <button type="button" className="adm-btn" onClick={onEdit}>
          <Pencil aria-hidden="true" /> Edit
        </button>
      </div>
    </li>
  );
}

function ItemEditor({
  target,
  categories,
  busy,
  run,
  onClose,
  onOptions,
}: {
  target: ItemTarget;
  categories: MenuCategory[];
  busy: boolean;
  run: RunFn;
  onClose: () => void;
  onOptions: (item: MenuItem) => void;
}) {
  const item = target.mode === "edit" ? target.item : null;
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [price, setPrice] = useState(item ? (item.pricePence / 100).toFixed(2) : "");
  const [categoryId, setCategoryId] = useState<number>(item ? item.categoryId : target.mode === "create" ? target.categoryId : 0);
  const [dietary, setDietary] = useState<DietaryKey[]>(item?.dietary ?? []);
  const [available, setAvailable] = useState(item?.available ?? true);
  const [visible, setVisible] = useState(item?.visible ?? true);
  const [featured, setFeatured] = useState(item?.featured ?? false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const pricePence = poundsToPence(price);
    if (!name.trim()) return setError("Please enter a dish name.");
    if (!Number.isFinite(pricePence) || pricePence < 0) return setError("Please enter a valid price, e.g. 11.50");
    const fields = { name: name.trim(), description: description.trim() || null, pricePence, categoryId, dietary, available, visible, featured };
    const ok = await run(item ? { action: "updateItem", id: item.id, ...fields } : { action: "createItem", ...fields }, item ? "Dish saved" : "Dish added");
    if (ok) onClose();
  }

  async function remove() {
    if (!item || !window.confirm(`Delete “${item.name}” from the menu? This cannot be undone.`)) return;
    if (await run({ action: "deleteItem", id: item.id }, "Dish deleted")) onClose();
  }

  return (
    <Modal title={item ? `Edit ${item.name}` : "Add a dish"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="dish-name" className="adm-label">
            Dish name
          </label>
          <input id="dish-name" value={name} onChange={(e) => setName(e.target.value)} className="adm-input" required maxLength={100} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="dish-price" className="adm-label">
              Price (£)
            </label>
            <input
              id="dish-price"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="11.50"
              className="adm-input"
              required
            />
          </div>
          <div>
            <label htmlFor="dish-category" className="adm-label">
              Category
            </label>
            <select id="dish-category" value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} className="adm-input">
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="dish-description" className="adm-label">
            Description
          </label>
          <textarea
            id="dish-description"
            rows={3}
            maxLength={600}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="adm-input resize-y"
          />
        </div>
        <fieldset>
          <legend className="adm-label">Dietary indicators</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {DIETARY_KEYS.map((key) => (
              <label key={key} className="flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={dietary.includes(key)}
                  onChange={(e) => setDietary((d) => (e.target.checked ? [...d, key] : d.filter((x) => x !== key)))}
                  className="h-4 w-4 accent-charcoal"
                />
                <span className="font-semibold">{DIETARY[key].short}</span>
                <span className="text-black/60">{DIETARY[key].label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} className="h-4 w-4 accent-charcoal" />
            In stock
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} className="h-4 w-4 accent-charcoal" />
            Show on website
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 accent-charcoal" />
            Feature on homepage
          </label>
        </div>
        {item ? (
          <div className="rounded-xl bg-black/[0.03] p-3 text-sm">
            <p>
              <b>Dish-specific options:</b> {item.ownGroups.length ? item.ownGroups.map((g) => g.name).join(", ") : "none"}{" "}
              <button type="button" className="font-semibold text-teak underline" onClick={() => onOptions(item)}>
                Manage
              </button>
            </p>
            <p className="mt-1 text-xs text-black/50">Shared choices (e.g. protein &amp; spice) are edited from the category&apos;s Options button.</p>
          </div>
        ) : null}
        {error ? (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          {item ? (
            <button type="button" className="adm-btn-danger" onClick={remove} disabled={busy}>
              <Trash2 aria-hidden="true" /> Delete dish
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" className="adm-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="adm-btn-primary" disabled={busy}>
              {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              Save dish
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function CategoryEditor({
  target,
  busy,
  run,
  onClose,
}: {
  target: CategoryTarget;
  busy: boolean;
  run: RunFn;
  onClose: () => void;
}) {
  const category = target.mode === "edit" ? target.category : null;
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [visible, setVisible] = useState(category?.visible ?? true);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;
    const fields = { name: name.trim(), description: description.trim() || null, visible };
    const ok = await run(
      category ? { action: "updateCategory", id: category.id, ...fields } : { action: "createCategory", ...fields },
      category ? "Category saved" : "Category added",
    );
    if (ok) onClose();
  }

  async function remove() {
    if (!category) return;
    const msg = category.items.length
      ? `Delete “${category.name}” and all ${category.items.length} dishes in it? This cannot be undone.`
      : `Delete “${category.name}”?`;
    if (!window.confirm(msg)) return;
    if (await run({ action: "deleteCategory", id: category.id }, "Category deleted")) onClose();
  }

  return (
    <Modal title={category ? `Edit ${category.name}` : "Add a category"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="category-name" className="adm-label">
            Category name
          </label>
          <input id="category-name" value={name} onChange={(e) => setName(e.target.value)} className="adm-input" required maxLength={100} />
        </div>
        <div>
          <label htmlFor="category-description" className="adm-label">
            Description (shown on the menu)
          </label>
          <textarea
            id="category-description"
            rows={2}
            maxLength={600}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="adm-input resize-y"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} className="h-4 w-4 accent-charcoal" />
          Show on website
        </label>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          {category ? (
            <button type="button" className="adm-btn-danger" onClick={remove} disabled={busy}>
              <Trash2 aria-hidden="true" /> Delete category
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" className="adm-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="adm-btn-primary" disabled={busy}>
              Save category
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function groupKey(g: MenuGroup) {
  return `${g.id}:${g.name}:${g.required}:${g.maxSelect}:${g.choices.map((c) => `${c.id}-${c.name}-${c.pricePence}-${c.available}`).join("|")}`;
}

function GroupsEditor({
  target,
  groups,
  busy,
  run,
  onClose,
}: {
  target: GroupTarget;
  groups: MenuGroup[];
  busy: boolean;
  run: RunFn;
  onClose: () => void;
}) {
  const [adding, setAdding] = useState(false);
  return (
    <Modal title={target.title} onClose={onClose} wide>
      <p className="text-sm text-black/60">
        {target.itemId
          ? "These choices apply only to this dish. A dish option with the same name as a category option (e.g. “Choice of Protein”) replaces it for this dish."
          : "These choices are shown for every dish in this category — for example protein and spice level. Extra prices are added to the dish price."}
      </p>
      <div className="mt-4 space-y-4">
        {groups.map((g) => (
          <GroupForm key={groupKey(g)} group={g} target={target} busy={busy} run={run} />
        ))}
        {groups.length === 0 && !adding ? (
          <p className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-black/50">No option groups yet.</p>
        ) : null}
        {adding ? (
          <GroupForm group={null} target={target} busy={busy} run={run} onDone={() => setAdding(false)} />
        ) : (
          <button type="button" className="adm-btn" onClick={() => setAdding(true)}>
            <Plus aria-hidden="true" /> Add option group
          </button>
        )}
      </div>
    </Modal>
  );
}

type ChoiceDraft = { key: string; id?: number; name: string; price: string; available: boolean };

function GroupForm({
  group,
  target,
  busy,
  run,
  onDone,
}: {
  group: MenuGroup | null;
  target: GroupTarget;
  busy: boolean;
  run: RunFn;
  onDone?: () => void;
}) {
  const [name, setName] = useState(group?.name ?? "");
  const [required, setRequired] = useState(group?.required ?? true);
  const [maxSelect, setMaxSelect] = useState(group?.maxSelect ?? 1);
  const [choices, setChoices] = useState<ChoiceDraft[]>(() =>
    group
      ? group.choices.map((c) => ({ key: `c${c.id}`, id: c.id, name: c.name, price: (c.pricePence / 100).toFixed(2), available: c.available }))
      : [{ key: "n0", name: "", price: "0.00", available: true }],
  );
  const [error, setError] = useState<string | null>(null);
  const updateChoice = (key: string, patch: Partial<ChoiceDraft>) =>
    setChoices((list) => list.map((c) => (c.key === key ? { ...c, ...patch } : c)));

  async function save() {
    setError(null);
    if (!name.trim()) return setError("Give this option group a name, e.g. “Choice of Protein”.");
    const cleaned = choices.filter((c) => c.name.trim());
    if (!cleaned.length) return setError("Add at least one choice.");
    const parsed = cleaned.map((c) => ({ id: c.id, name: c.name.trim(), pricePence: poundsToPence(c.price || "0"), available: c.available }));
    if (parsed.some((c) => !Number.isFinite(c.pricePence))) return setError("Please check the extra prices (e.g. 0.50).");
    const ok = await run(
      {
        action: "saveGroup",
        id: group?.id,
        categoryId: group ? undefined : (target.categoryId ?? null),
        itemId: group ? undefined : (target.itemId ?? null),
        name: name.trim(),
        required,
        maxSelect,
        choices: parsed,
      },
      "Options saved",
    );
    if (ok && !group) onDone?.();
  }

  async function remove() {
    if (!group) {
      onDone?.();
      return;
    }
    if (!window.confirm(`Delete the “${group.name}” option group?`)) return;
    await run({ action: "deleteGroup", id: group.id }, "Option group deleted");
  }

  const fieldPrefix = group ? `g${group.id}` : "gnew";

  return (
    <div className="rounded-2xl border border-black/10 p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div>
          <label htmlFor={`${fieldPrefix}-name`} className="adm-label">
            Group name
          </label>
          <input
            id={`${fieldPrefix}-name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Choice of Protein"
            className="adm-input"
          />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="h-4 w-4 accent-charcoal" />
          Customer must choose
        </label>
        <div>
          <label htmlFor={`${fieldPrefix}-max`} className="adm-label">
            Max picks
          </label>
          <input
            id={`${fieldPrefix}-max`}
            type="number"
            min={1}
            max={20}
            value={maxSelect}
            onChange={(e) => setMaxSelect(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
            className="adm-input w-20"
          />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="grid grid-cols-[minmax(0,1fr)_88px_44px_40px] gap-2 text-[11px] font-semibold tracking-wide text-black/45 uppercase">
          <span>Choice</span>
          <span>Extra £</span>
          <span>On</span>
          <span className="sr-only">Remove</span>
        </div>
        {choices.map((c) => (
          <div key={c.key} className="grid grid-cols-[minmax(0,1fr)_88px_44px_40px] items-center gap-2">
            <input
              value={c.name}
              onChange={(e) => updateChoice(c.key, { name: e.target.value })}
              className="adm-input"
              aria-label="Choice name"
              placeholder="e.g. Chicken"
            />
            <input
              value={c.price}
              inputMode="decimal"
              onChange={(e) => updateChoice(c.key, { price: e.target.value })}
              className="adm-input"
              aria-label={`Extra price for ${c.name || "choice"}`}
            />
            <Toggle checked={c.available} onChange={(v) => updateChoice(c.key, { available: v })} label={`${c.name || "Choice"} available`} />
            <button
              type="button"
              className="adm-btn px-2"
              onClick={() => setChoices((list) => list.filter((x) => x.key !== c.key))}
              aria-label={`Remove ${c.name || "choice"}`}
            >
              <Trash2 aria-hidden="true" />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-sm font-semibold text-teak hover:underline"
          onClick={() => setChoices((list) => [...list, { key: `n${Date.now()}`, name: "", price: "0.00", available: true }])}
        >
          + Add choice
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap justify-between gap-2">
        <button type="button" className="adm-btn-danger" onClick={remove} disabled={busy}>
          <Trash2 aria-hidden="true" /> {group ? "Delete group" : "Discard"}
        </button>
        <button type="button" className="adm-btn-primary" onClick={() => void save()} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          Save options
        </button>
      </div>
    </div>
  );
}
