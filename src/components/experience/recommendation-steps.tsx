"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Coffee, Flame, Heart, IceCream2, RotateCcw, ShoppingBag, Shuffle, Snowflake, Sparkles, Zap } from "lucide-react";
import { CoffeeImage } from "@/components/coffee-art";
import { Button, Pill } from "@/components/ui";
import { caffeineLabel, formatPrice } from "@/lib/format";
import { MOOD_META } from "@/lib/moods";
import type { Recommendation } from "@/lib/recommend";
import type { MenuItem, Mood, Temperature } from "@/lib/types";
import { MoodBadge } from "./mood-steps";

export interface Selection {
  size: string;
  temperature: Temperature;
}

export function defaultSelection(item: MenuItem): Selection {
  // Middle size reads as the "regular" choice for most menus.
  const size = item.sizes[Math.floor((item.sizes.length - 1) / 2)]?.label ?? item.sizes[0]?.label ?? "";
  return { size, temperature: item.temperatures[0] ?? "hot" };
}

export function priceFor(item: MenuItem, size: string): number {
  return item.sizes.find((s) => s.label === size)?.price ?? item.sizes[0]?.price ?? 0;
}

function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  render,
}: {
  label: string;
  options: T[];
  value: T;
  onChange: (v: T) => void;
  render: (v: T) => React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-coffee">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            aria-pressed={o === value}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${
              o === value ? "bg-espresso text-foam ring-espresso" : "bg-foam text-mocha ring-latte hover:ring-caramel"
            }`}
          >
            {render(o)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function DrinkOptions({
  item,
  selection,
  currency,
  onChange,
}: {
  item: MenuItem;
  selection: Selection;
  currency: string;
  onChange: (s: Selection) => void;
}) {
  return (
    <div className="space-y-4">
      <OptionGroup
        label="Size"
        options={item.sizes.map((s) => s.label)}
        value={selection.size}
        onChange={(size) => onChange({ ...selection, size })}
        render={(label) => (
          <>
            {label} <span className="opacity-60">{formatPrice(priceFor(item, label), currency)}</span>
          </>
        )}
      />
      {item.temperatures.length > 0 && (
        <OptionGroup
          label="Served"
          options={item.temperatures}
          value={selection.temperature}
          onChange={(temperature) => onChange({ ...selection, temperature })}
          render={(t) => (
            <>
              {t === "iced" ? <Snowflake className="size-4" /> : <Flame className="size-4" />}
              {t === "iced" ? "Iced" : "Hot"}
            </>
          )}
        />
      )}
    </div>
  );
}

export function RecommendationStep({
  mood,
  recs,
  index,
  selection,
  currency,
  onSelection,
  onAccept,
  onNext,
  onPickAlternative,
  onChangeMood,
}: {
  mood: Mood;
  recs: Recommendation[];
  index: number;
  selection: Selection;
  currency: string;
  onSelection: (s: Selection) => void;
  onAccept: () => void;
  onNext: () => void;
  onPickAlternative: (index: number) => void;
  onChangeMood: () => void;
}) {
  const current = recs[index];
  const { item } = current;
  const alternatives = recs
    .map((r, i) => ({ r, i }))
    .filter(({ i }) => i !== index)
    .slice(0, 3);
  const caffeine = caffeineLabel(item.caffeine_mg);

  return (
    <div className="py-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-center gap-3 text-center sm:justify-between sm:text-left">
        <div className="flex items-center gap-3">
          <MoodBadge mood={mood} size="sm" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-coffee">Your mood</p>
            <p className="font-display text-xl font-semibold">{MOOD_META[mood].label}</p>
          </div>
        </div>
        <button onClick={onChangeMood} className="text-sm font-semibold text-brand underline-offset-4 hover:underline">
          Change mood
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.article
          key={item.id}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ type: "spring", damping: 22, stiffness: 200 }}
          className="grid overflow-hidden rounded-[2rem] bg-foam shadow-lift ring-1 ring-latte md:grid-cols-[0.9fr_1.1fr]"
        >
          <div className="relative flex items-center justify-center bg-sand p-8">
            <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-foam/90 px-3 py-1 text-xs font-bold text-brand shadow-soft">
              <Sparkles className="size-3.5" /> {index === 0 ? "Top pick for you" : `Option ${index + 1} of ${recs.length}`}
            </span>
            <CoffeeImage item={item} temperature={selection.temperature} className="aspect-square w-full max-w-xs rounded-3xl" />
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-coffee">{item.category}</p>
              <h2 className="mt-1 font-display text-4xl font-semibold tracking-tight">{item.name}</h2>
              <p className="mt-2 text-coffee">{item.description}</p>
            </div>

            <div className="flex gap-3 rounded-2xl bg-sand/70 p-4">
              <Heart className="mt-0.5 size-5 shrink-0 text-brand-accent" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-coffee">Why it matches</p>
                <p className="mt-0.5 font-medium text-mocha">{current.reason}</p>
              </div>
            </div>

            <DrinkOptions item={item} selection={selection} currency={currency} onChange={onSelection} />

            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-3xl font-semibold">{formatPrice(priceFor(item, selection.size), currency)}</span>
              {caffeine && (
                <Pill>
                  <Zap className="size-3.5" /> {caffeine}
                </Pill>
              )}
              {item.temperatures.includes("iced") && item.temperatures.includes("hot") && (
                <Pill>
                  <IceCream2 className="size-3.5" /> Hot or iced
                </Pill>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={onAccept} icon={<Coffee className="size-5" />} className="sm:flex-1">
                Sounds Perfect!
              </Button>
              {recs.length > 1 && (
                <Button size="lg" variant="secondary" onClick={onNext} icon={<Shuffle className="size-5" />}>
                  Show Me Something Else
                </Button>
              )}
            </div>
          </div>
        </motion.article>
      </AnimatePresence>

      {alternatives.length > 0 && (
        <section className="mt-10">
          <h3 className="mb-4 font-display text-2xl font-semibold">You might also like</h3>
          <ul className="grid gap-3 sm:grid-cols-3">
            {alternatives.map(({ r, i }) => (
              <li key={r.item.id}>
                <button
                  onClick={() => onPickAlternative(i)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-foam p-3 text-left ring-1 ring-latte transition hover:-translate-y-0.5 hover:shadow-soft hover:ring-caramel"
                >
                  <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-sand">
                    <CoffeeImage item={r.item} temperature={r.item.temperatures[0]} className="size-full" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{r.item.name}</p>
                    <p className="line-clamp-2 text-xs text-coffee">{r.reason}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function ResultStep({
  mood,
  rec,
  message,
  selection,
  currency,
  onSelection,
  onAddToCart,
  onOrderNow,
  onStartAgain,
}: {
  mood: Mood;
  rec: Recommendation;
  message: string;
  selection: Selection;
  currency: string;
  onSelection: (s: Selection) => void;
  onAddToCart: () => void;
  onOrderNow: () => void;
  onStartAgain: () => void;
}) {
  const { item } = rec;
  const caffeine = caffeineLabel(item.caffeine_mg);
  return (
    <div className="grid items-center gap-8 py-6 md:grid-cols-2 md:py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotate: -4 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 16 }}
        className="relative mx-auto w-full max-w-md"
      >
        <div className="absolute inset-8 rounded-full bg-brand-accent/30 blur-3xl" aria-hidden />
        <CoffeeImage item={item} temperature={selection.temperature} className="relative aspect-square w-full rounded-[2.5rem] shadow-lift" />
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-espresso px-4 py-2 text-sm font-semibold text-foam shadow-lift">
            {MOOD_META[mood].emoji} Matched to your {MOOD_META[mood].label.toLowerCase()} mood
          </span>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-6">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-accent">Your coffee moment</p>
          <h2 className="mt-2 font-display text-5xl font-semibold tracking-tight sm:text-6xl">{item.name}</h2>
          <p className="mt-4 font-display text-2xl italic leading-snug text-mocha">&ldquo;{message}&rdquo;</p>
        </div>

        <p className="text-coffee">{item.description}</p>

        <DrinkOptions item={item} selection={selection} currency={currency} onChange={onSelection} />

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display text-3xl font-semibold">{formatPrice(priceFor(item, selection.size), currency)}</span>
          {caffeine && (
            <Pill>
              <Zap className="size-3.5" /> {caffeine}
            </Pill>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" onClick={onOrderNow} icon={<Coffee className="size-5" />} className="sm:flex-1">
            Order Now
          </Button>
          <Button size="lg" variant="secondary" onClick={onAddToCart} icon={<ShoppingBag className="size-5" />}>
            Add to Cart
          </Button>
        </div>
        <Button variant="ghost" onClick={onStartAgain} icon={<RotateCcw className="size-4" />}>
          Start again
        </Button>
      </motion.div>
    </div>
  );
}
