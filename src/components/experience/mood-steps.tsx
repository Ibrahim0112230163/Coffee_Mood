"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Check, Hand } from "lucide-react";
import { Button } from "@/components/ui";
import { MOOD_META } from "@/lib/moods";
import { MOODS, type Mood } from "@/lib/types";

export function MoodBadge({ mood, size = "lg" }: { mood: Mood; size?: "lg" | "sm" }) {
  const meta = MOOD_META[mood];
  const big = size === "lg";
  return (
    <div className="relative inline-flex items-center justify-center">
      {big && (
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ background: meta.tint }}
          initial={{ scale: 0.6, opacity: 0.7 }}
          animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.8, repeat: Infinity }}
          aria-hidden
        />
      )}
      <motion.span
        initial={{ scale: 0.3, rotate: -20, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 10, stiffness: 140 }}
        className={`relative flex items-center justify-center rounded-full ${big ? "size-36 text-7xl sm:size-44 sm:text-8xl" : "size-12 text-2xl"}`}
        style={{ background: meta.tint }}
        aria-hidden
      >
        {meta.emoji}
      </motion.span>
    </div>
  );
}

export function ConfirmStep({ mood, onYes, onChoose }: { mood: Mood; onYes: () => void; onChoose: () => void }) {
  const meta = MOOD_META[mood];
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center py-10 text-center sm:py-16">
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-semibold uppercase tracking-[0.22em] text-coffee">
        We think you&apos;re feeling…
      </motion.p>
      <div className="my-8">
        <MoodBadge mood={mood} />
      </div>
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="font-display text-5xl font-semibold tracking-tight sm:text-6xl"
      >
        {meta.label}
      </motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="mt-3 max-w-sm text-coffee">
        That&apos;s our best guess from your expression, and only you know how you really feel.
      </motion.p>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-10 w-full">
        <p className="mb-4 font-display text-2xl">Did we get your mood right?</p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={onYes} icon={<Check className="size-5" />}>
            Yes, that&apos;s my mood!
          </Button>
          <Button size="lg" variant="secondary" onClick={onChoose} icon={<Hand className="size-5" />}>
            Not really, let me choose
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export function MoodPicker({
  onPick,
  onBack,
  highlight,
}: {
  onPick: (m: Mood) => void;
  onBack?: () => void;
  highlight?: Mood[];
}) {
  return (
    <div className="mx-auto max-w-3xl py-8 sm:py-12">
      <div className="text-center">
        <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">How are you feeling?</h2>
        <p className="mt-3 text-lg text-coffee">Pick the one that fits best. There are no wrong answers.</p>
      </div>
      <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {MOODS.map((m, i) => {
          const meta = MOOD_META[m];
          const suggested = highlight?.includes(m);
          return (
            <motion.li key={m} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <button
                onClick={() => onPick(m)}
                className="group flex w-full flex-col items-center gap-3 rounded-3xl bg-foam p-5 ring-1 ring-latte transition hover:-translate-y-1 hover:shadow-lift hover:ring-caramel focus-visible:-translate-y-1"
              >
                <span className="flex size-16 items-center justify-center rounded-full text-4xl transition group-hover:scale-110" style={{ background: meta.tint }} aria-hidden>
                  {meta.emoji}
                </span>
                <span className="font-semibold">{meta.label}</span>
                {suggested && <span className="-mt-2 text-[11px] font-semibold uppercase tracking-wider text-brand-accent">Maybe?</span>}
              </button>
            </motion.li>
          );
        })}
      </ul>
      {onBack && (
        <div className="mt-8 text-center">
          <Button variant="ghost" onClick={onBack} icon={<ArrowLeft className="size-4" />}>
            Back
          </Button>
        </div>
      )}
    </div>
  );
}
