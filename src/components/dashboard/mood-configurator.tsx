"use client";

import { ArrowDown, ArrowUp, Check, Plus, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CoffeeImage } from "@/components/coffee-art";
import { Button } from "@/components/ui";
import { MOOD_META } from "@/lib/moods";
import { rankRecommendations, recommendationMessage } from "@/lib/recommend";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { MOODS, type MenuItem, type Mood, type MoodMessage, type MoodRule } from "@/lib/types";
import { PageHeader, textareaClass } from "./fields";

interface DraftRule {
  menu_item_id: string;
  reason: string;
}

type Drafts = Record<Mood, { rules: DraftRule[]; message: string }>;

function toDrafts(rules: MoodRule[], messages: MoodMessage[]): Drafts {
  return Object.fromEntries(
    MOODS.map((m) => [
      m,
      {
        rules: rules
          .filter((r) => r.mood === m)
          .sort((a, b) => a.rank - b.rank)
          .map((r) => ({ menu_item_id: r.menu_item_id, reason: r.reason ?? "" })),
        message: messages.find((x) => x.mood === m)?.message ?? "",
      },
    ]),
  ) as Drafts;
}

export function MoodConfigurator({
  shopId,
  menu,
  initialRules,
  initialMessages,
}: {
  shopId: string;
  menu: MenuItem[];
  initialRules: MoodRule[];
  initialMessages: MoodMessage[];
}) {
  const router = useRouter();
  const [mood, setMood] = useState<Mood>("happy");
  const [saved, setSaved] = useState<Drafts>(() => toDrafts(initialRules, initialMessages));
  const [drafts, setDrafts] = useState<Drafts>(saved);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const byId = useMemo(() => new Map(menu.map((m) => [m.id, m])), [menu]);
  const draft = drafts[mood];
  const dirty = (m: Mood) => JSON.stringify(drafts[m]) !== JSON.stringify(saved[m]);
  const unused = menu.filter((m) => !draft.rules.some((r) => r.menu_item_id === m.id));

  const update = (patch: Partial<Drafts[Mood]>) => {
    setStatus(null);
    setDrafts((d) => ({ ...d, [mood]: { ...d[mood], ...patch } }));
  };
  const setRule = (i: number, patch: Partial<DraftRule>) => update({ rules: draft.rules.map((r, j) => (j === i ? { ...r, ...patch } : r)) });
  const move = (i: number, dir: -1 | 1) => {
    const rules = [...draft.rules];
    [rules[i], rules[i + dir]] = [rules[i + dir], rules[i]];
    update({ rules });
  };

  // Live preview using the same engine the customer page uses.
  const preview = useMemo(() => {
    const rules: MoodRule[] = draft.rules.map((r, i) => ({ id: String(i), shop_id: shopId, mood, menu_item_id: r.menu_item_id, rank: i, reason: r.reason || null }));
    return rankRecommendations({ mood, menu, rules }).slice(0, 3);
  }, [draft.rules, menu, mood, shopId]);

  async function save() {
    setSaving(true);
    setStatus(null);
    const supabase = getBrowserSupabase()!;
    const { error } = await supabase.rpc("save_mood_config", {
      p_shop_id: shopId,
      p_mood: mood,
      p_rules: draft.rules.map((r) => ({ menu_item_id: r.menu_item_id, reason: r.reason })),
      p_message: draft.message,
    });
    setSaving(false);
    if (error) return setStatus({ ok: false, text: error.message });
    setSaved((s) => ({ ...s, [mood]: draft }));
    setStatus({ ok: true, text: `${MOOD_META[mood].label} saved.` });
    router.refresh();
  }

  if (menu.length === 0) {
    return (
      <>
        <PageHeader title="Mood rules" />
        <div className="rounded-3xl bg-foam p-10 text-center ring-1 ring-latte">
          <p className="font-display text-2xl font-semibold">Add some drinks first</p>
          <p className="mt-2 text-coffee">Mood rules point at drinks on your menu.</p>
          <Link href="/dashboard/menu" className="mt-4 inline-block font-semibold text-caramel underline">
            Go to menu
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Mood rules"
        description="Choose which drinks to recommend for each mood, in order. Customers can tap 'Show me something else' to move down the list."
      />

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Moods">
        {MOODS.map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={m === mood}
            onClick={() => {
              setMood(m);
              setStatus(null);
            }}
            className={`relative inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${
              m === mood ? "bg-espresso text-foam ring-espresso" : "bg-foam text-mocha ring-latte hover:ring-caramel"
            }`}
          >
            <span aria-hidden>{MOOD_META[m].emoji}</span> {MOOD_META[m].label}
            {dirty(m) && <span className="size-2 rounded-full bg-ember" aria-label="unsaved changes" />}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-3xl bg-foam p-6 ring-1 ring-latte">
            <h2 className="font-display text-xl font-semibold">Recommended drinks</h2>
            <p className="mt-1 text-sm text-coffee">The first drink is the top pick. Add a short reason customers will see.</p>

            {draft.rules.length === 0 && (
              <p className="mt-4 rounded-2xl bg-sand/70 p-4 text-sm text-mocha">
                No drinks yet. Customers will still get suggestions based on drink tags, but adding your own picks works best.
              </p>
            )}

            <ol className="mt-4 space-y-3">
              {draft.rules.map((r, i) => {
                const item = byId.get(r.menu_item_id);
                if (!item) return null;
                return (
                  <li key={r.menu_item_id} className="flex gap-3 rounded-2xl bg-cream p-3 ring-1 ring-latte/70">
                    <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-espresso text-xs font-bold text-foam">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">
                        {item.name} {!item.is_available && <span className="text-xs font-normal text-coffee">(hidden, skipped)</span>}
                      </p>
                      <input
                        value={r.reason}
                        maxLength={240}
                        onChange={(e) => setRule(i, { reason: e.target.value })}
                        placeholder={`Why it matches (e.g. "${MOOD_META[mood].defaultReason}")`}
                        className="mt-1.5 h-9 w-full rounded-lg bg-foam px-3 text-sm ring-1 ring-latte outline-none focus:ring-2 focus:ring-caramel"
                      />
                    </div>
                    <div className="flex flex-col">
                      <button disabled={i === 0} onClick={() => move(i, -1)} className="rounded p-1 hover:bg-sand disabled:opacity-25" aria-label="Move up">
                        <ArrowUp className="size-4" />
                      </button>
                      <button disabled={i === draft.rules.length - 1} onClick={() => move(i, 1)} className="rounded p-1 hover:bg-sand disabled:opacity-25" aria-label="Move down">
                        <ArrowDown className="size-4" />
                      </button>
                    </div>
                    <button onClick={() => update({ rules: draft.rules.filter((_, j) => j !== i) })} className="self-start rounded-full p-1.5 text-mocha hover:bg-sand" aria-label={`Remove ${item.name}`}>
                      <X className="size-4" />
                    </button>
                  </li>
                );
              })}
            </ol>

            {unused.length > 0 && draft.rules.length < 12 && (
              <div className="mt-4 flex items-center gap-2">
                <Plus className="size-4 text-caramel" />
                <select
                  value=""
                  onChange={(e) => e.target.value && update({ rules: [...draft.rules, { menu_item_id: e.target.value, reason: "" }] })}
                  className="h-10 flex-1 rounded-xl bg-foam px-3 text-sm ring-1 ring-latte"
                  aria-label="Add a drink to this mood"
                >
                  <option value="">Add a drink…</option>
                  {unused.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                      {m.is_available ? "" : " (hidden)"}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </section>

          <section className="rounded-3xl bg-foam p-6 ring-1 ring-latte">
            <h2 className="font-display text-xl font-semibold">Personal message</h2>
            <p className="mt-1 text-sm text-coffee">
              Shown on the result screen. Use <code className="rounded bg-sand px-1">{"{coffee}"}</code> for the drink name. Keep it warm and non-judgemental.
            </p>
            <textarea
              rows={3}
              maxLength={280}
              value={draft.message}
              onChange={(e) => update({ message: e.target.value })}
              placeholder={MOOD_META[mood].defaultMessage}
              className={`${textareaClass} mt-3`}
            />
          </section>

          <div className="flex items-center gap-3">
            <Button variant="dark" onClick={save} loading={saving} disabled={!dirty(mood)} icon={<Check className="size-4" />}>
              Save {MOOD_META[mood].label}
            </Button>
            {dirty(mood) && (
              <Button variant="ghost" onClick={() => setDrafts((d) => ({ ...d, [mood]: saved[mood] }))}>
                Discard
              </Button>
            )}
            {status && (
              <p role="status" className={`text-sm font-semibold ${status.ok ? "text-green-700" : "text-red-700"}`}>
                {status.text}
              </p>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-3xl bg-espresso p-6 text-foam lg:sticky lg:top-6">
          <p className="flex items-center gap-2 text-sm font-semibold text-honey">
            <Sparkles className="size-4" /> Customer preview
          </p>
          <p className="mt-3 font-display text-lg">
            {MOOD_META[mood].emoji} When someone feels <em>{MOOD_META[mood].label.toLowerCase()}</em>:
          </p>
          {preview.length === 0 ? (
            <p className="mt-4 text-sm text-latte/80">No available drinks to recommend.</p>
          ) : (
            <>
              <ul className="mt-4 space-y-3">
                {preview.map((p, i) => (
                  <li key={p.item.id} className="flex items-center gap-3 rounded-2xl bg-mocha/60 p-3">
                    <div className="size-12 shrink-0 overflow-hidden rounded-xl bg-sand">
                      <CoffeeImage item={p.item} temperature={p.item.temperatures[0]} className="size-full" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {i === 0 ? "Top pick: " : ""}
                        {p.item.name}
                      </p>
                      <p className="truncate text-xs text-latte/80">
                        {p.source === "rule" ? p.reason : p.source === "match" ? "Suggested from tags" : "Menu fallback"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-5 font-display text-lg italic leading-snug text-latte">
                &ldquo;{recommendationMessage(mood, preview[0].item.name, draft.message ? [{ shop_id: shopId, mood, message: draft.message }] : [])}&rdquo;
              </p>
            </>
          )}
        </aside>
      </div>
    </>
  );
}
