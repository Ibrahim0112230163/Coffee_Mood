"use client";

import { Coffee, Eye, EyeOff, ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { CoffeeImage } from "@/components/coffee-art";
import { Button } from "@/components/ui";
import { caffeineLabel, formatPrice } from "@/lib/format";
import { lowestPrice } from "@/lib/recommend";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { MenuItem, SizeOption, Temperature } from "@/lib/types";
import { uploadShopImage } from "@/lib/upload";
import { Field, PageHeader, inputClass, textareaClass } from "./fields";
import { Modal } from "./modal";

/** Tags the recommendation engine understands when a mood has no explicit rule. */
export const KNOWN_TAGS = [
  "sweet", "creamy", "celebratory", "comforting", "chocolate", "soothing", "mellow", "caffeine-free",
  "energizing", "strong", "bold", "iced", "refreshing", "balanced", "classic", "light",
];

type Draft = Omit<MenuItem, "id" | "shop_id"> & { id?: string };

const emptyDraft = (sort: number): Draft => ({
  name: "",
  description: "",
  category: "Coffee",
  image_url: null,
  sizes: [{ label: "Regular", price: 4 }],
  temperatures: ["hot"],
  caffeine_mg: null,
  tags: [],
  is_available: true,
  sort_order: sort,
});

export function MenuManager({ shopId, currency, initialItems }: { shopId: string; currency: string; initialItems: MenuItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(item: MenuItem) {
    const supabase = getBrowserSupabase()!;
    const next = !item.is_available;
    setItems((xs) => xs.map((x) => (x.id === item.id ? { ...x, is_available: next } : x)));
    const { error } = await supabase.from("menu_items").update({ is_available: next }).eq("id", item.id);
    if (error) {
      setError(error.message);
      setItems((xs) => xs.map((x) => (x.id === item.id ? { ...x, is_available: !next } : x)));
    }
  }

  async function remove(item: MenuItem) {
    if (!confirm(`Delete "${item.name}"? It will also be removed from any mood rules.`)) return;
    const supabase = getBrowserSupabase()!;
    const { error } = await supabase.from("menu_items").delete().eq("id", item.id);
    if (error) return setError(error.message);
    setItems((xs) => xs.filter((x) => x.id !== item.id));
    router.refresh();
  }

  function saved(item: MenuItem) {
    setItems((xs) => {
      const exists = xs.some((x) => x.id === item.id);
      const next = exists ? xs.map((x) => (x.id === item.id ? item : x)) : [...xs, item];
      return next.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
    });
    setEditing(null);
    router.refresh();
  }

  return (
    <>
      <PageHeader
        title="Menu"
        description="Everything customers can be recommended. Hidden drinks are never suggested."
        action={
          <Button variant="dark" icon={<Plus className="size-4" />} onClick={() => setEditing(emptyDraft((items.at(-1)?.sort_order ?? 0) + 1))}>
            Add drink
          </Button>
        }
      />
      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <div className="rounded-3xl bg-foam p-10 text-center ring-1 ring-latte">
          <Coffee className="mx-auto size-10 text-caramel" />
          <h2 className="mt-4 font-display text-2xl font-semibold">Your menu is empty</h2>
          <p className="mt-2 text-coffee">Add your first drink so customers can get recommendations.</p>
          <Button className="mt-6" variant="dark" icon={<Plus className="size-4" />} onClick={() => setEditing(emptyDraft(1))}>
            Add drink
          </Button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <li key={item.id} className={`flex flex-col rounded-3xl bg-foam p-4 ring-1 ring-latte transition ${item.is_available ? "" : "opacity-60"}`}>
              <div className="flex gap-4">
                <div className="size-20 shrink-0 overflow-hidden rounded-2xl bg-sand">
                  <CoffeeImage item={item} temperature={item.temperatures[0]} className="size-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-coffee">{item.category}</p>
                  <p className="truncate font-display text-lg font-semibold">{item.name}</p>
                  <p className="text-sm text-coffee">
                    from {formatPrice(lowestPrice(item), currency)} · {item.temperatures.map((t) => (t === "iced" ? "Iced" : "Hot")).join(" / ")}
                  </p>
                  {caffeineLabel(item.caffeine_mg) && <p className="text-xs text-coffee">{caffeineLabel(item.caffeine_mg)}</p>}
                </div>
              </div>
              {item.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {item.tags.map((t) => (
                    <span key={t} className="rounded-full bg-sand px-2 py-0.5 text-[11px] font-semibold text-mocha">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-4 flex items-center justify-between border-t border-latte/70 pt-3">
                <button onClick={() => toggle(item)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-mocha hover:text-espresso">
                  {item.is_available ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  {item.is_available ? "Available" : "Hidden"}
                </button>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(item)} className="rounded-full p-2 text-mocha hover:bg-sand" aria-label={`Edit ${item.name}`}>
                    <Pencil className="size-4" />
                  </button>
                  <button onClick={() => remove(item)} className="rounded-full p-2 text-red-700 hover:bg-red-50" aria-label={`Delete ${item.name}`}>
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={!!editing} title={editing?.id ? "Edit drink" : "Add a drink"} onClose={() => setEditing(null)}>
        {editing && <MenuItemForm key={editing.id ?? "new"} shopId={shopId} initial={editing} onSaved={saved} onCancel={() => setEditing(null)} />}
      </Modal>
    </>
  );
}

function MenuItemForm({ shopId, initial, onSaved, onCancel }: { shopId: string; initial: Draft; onSaved: (m: MenuItem) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const setSize = (i: number, patch: Partial<SizeOption>) => set("sizes", draft.sizes.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const toggleTemp = (t: Temperature) => {
    const has = draft.temperatures.includes(t);
    if (has && draft.temperatures.length === 1) return;
    set("temperatures", has ? draft.temperatures.filter((x) => x !== t) : (["hot", "iced"] as Temperature[]).filter((x) => x === t || draft.temperatures.includes(x)));
  };
  const addTag = (raw: string) => {
    const t = raw.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 24);
    if (t && !draft.tags.includes(t) && draft.tags.length < 12) set("tags", [...draft.tags, t]);
    setTagInput("");
  };

  async function onFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      set("image_url", await uploadShopImage(shopId, file, "menu"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const sizes = draft.sizes.map((s) => ({ label: s.label.trim(), price: Math.round(Number(s.price) * 100) / 100 }));
    if (sizes.some((s) => !s.label || !(s.price >= 0))) return setError("Every size needs a name and a valid price.");
    if (new Set(sizes.map((s) => s.label.toLowerCase())).size !== sizes.length) return setError("Size names must be unique.");

    setSaving(true);
    setError(null);
    const payload = {
      shop_id: shopId,
      name: draft.name.trim(),
      description: draft.description.trim(),
      category: draft.category.trim() || "Coffee",
      image_url: draft.image_url,
      sizes,
      temperatures: draft.temperatures,
      caffeine_mg: draft.caffeine_mg === null || Number.isNaN(draft.caffeine_mg) ? null : draft.caffeine_mg,
      tags: draft.tags,
      is_available: draft.is_available,
      sort_order: draft.sort_order,
    };
    const supabase = getBrowserSupabase()!;
    const query = draft.id
      ? supabase.from("menu_items").update(payload).eq("id", draft.id).select().single()
      : supabase.from("menu_items").insert(payload).select().single();
    const { data, error } = await query;
    setSaving(false);
    if (error) return setError(error.message);
    onSaved({ ...(data as MenuItem), sizes, temperatures: draft.temperatures, tags: draft.tags });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="shrink-0">
          <div className="relative size-32 overflow-hidden rounded-2xl bg-sand ring-1 ring-latte">
            <CoffeeImage item={{ name: draft.name || "latte", image_url: draft.image_url }} temperature={draft.temperatures[0]} className="size-full" />
            {draft.image_url && (
              <button type="button" onClick={() => set("image_url", null)} className="absolute right-1.5 top-1.5 rounded-full bg-foam/90 p-1 shadow-soft" aria-label="Remove photo">
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <Button type="button" size="sm" variant="secondary" className="mt-2 w-32" loading={uploading} icon={<ImagePlus className="size-4" />} onClick={() => fileRef.current?.click()}>
            {draft.image_url ? "Replace" : "Upload"}
          </Button>
        </div>
        <div className="flex-1 space-y-4">
          <Field label="Name">
            <input required maxLength={80} value={draft.name} onChange={(e) => set("name", e.target.value)} className={inputClass} placeholder="Vanilla Latte" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <input maxLength={40} value={draft.category} onChange={(e) => set("category", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Caffeine (mg)" hint="Leave blank if unknown">
              <input
                type="number"
                min={0}
                max={1000}
                value={draft.caffeine_mg ?? ""}
                onChange={(e) => set("caffeine_mg", e.target.value === "" ? null : Number(e.target.value))}
                className={inputClass}
              />
            </Field>
          </div>
        </div>
      </div>

      <Field label="Description">
        <textarea maxLength={400} rows={2} value={draft.description} onChange={(e) => set("description", e.target.value)} className={textareaClass} />
      </Field>

      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold text-mocha">Sizes and prices</legend>
        <div className="space-y-2">
          {draft.sizes.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input aria-label="Size name" required maxLength={20} value={s.label} onChange={(e) => setSize(i, { label: e.target.value })} className={inputClass} placeholder="Medium" />
              <input
                aria-label="Price"
                required
                type="number"
                min={0}
                step="0.01"
                value={Number.isNaN(s.price) ? "" : s.price}
                onChange={(e) => setSize(i, { price: e.target.valueAsNumber })}
                className={`${inputClass} max-w-32`}
              />
              <button
                type="button"
                disabled={draft.sizes.length === 1}
                onClick={() => set("sizes", draft.sizes.filter((_, j) => j !== i))}
                className="rounded-full p-2 text-mocha hover:bg-sand disabled:opacity-30"
                aria-label="Remove size"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
        {draft.sizes.length < 6 && (
          <button type="button" onClick={() => set("sizes", [...draft.sizes, { label: "", price: draft.sizes.at(-1)?.price ?? 4 }])} className="mt-2 text-sm font-semibold text-caramel hover:text-coffee">
            + Add size
          </button>
        )}
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold text-mocha">Served</legend>
        <div className="flex gap-2">
          {(["hot", "iced"] as Temperature[]).map((t) => (
            <button
              type="button"
              key={t}
              aria-pressed={draft.temperatures.includes(t)}
              onClick={() => toggleTemp(t)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 ${draft.temperatures.includes(t) ? "bg-espresso text-foam ring-espresso" : "bg-foam ring-latte"}`}
            >
              {t === "hot" ? "Hot" : "Iced"}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold text-mocha">Mood tags</legend>
        <p className="mb-2 text-xs text-coffee">Used to suggest this drink for moods that don&apos;t have a specific rule.</p>
        <div className="flex flex-wrap gap-1.5">
          {draft.tags.map((t) => (
            <button type="button" key={t} onClick={() => set("tags", draft.tags.filter((x) => x !== t))} className="inline-flex items-center gap-1 rounded-full bg-espresso px-2.5 py-1 text-xs font-semibold text-foam">
              {t} <X className="size-3" />
            </button>
          ))}
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag(tagInput);
              }
            }}
            placeholder="Add tag…"
            className="h-7 w-28 rounded-full bg-foam px-3 text-xs ring-1 ring-latte outline-none focus:ring-caramel"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {KNOWN_TAGS.filter((t) => !draft.tags.includes(t)).map((t) => (
            <button type="button" key={t} onClick={() => addTag(t)} className="rounded-full bg-sand px-2 py-0.5 text-[11px] font-semibold text-mocha hover:bg-latte">
              + {t}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={draft.is_available} onChange={(e) => set("is_available", e.target.checked)} className="size-4 accent-[#6f4e37]" />
          Available to customers
        </label>
        <Field label="Display order">
          <input type="number" value={draft.sort_order} onChange={(e) => set("sort_order", Number(e.target.value) || 0)} className={`${inputClass} w-24`} />
        </Field>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2 border-t border-latte pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="dark" loading={saving} disabled={uploading}>
          {draft.id ? "Save changes" : "Add drink"}
        </Button>
      </div>
    </form>
  );
}
