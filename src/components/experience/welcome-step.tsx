"use client";

import { motion } from "framer-motion";
import { Hand, ScanFace, Sparkles } from "lucide-react";
import { CoffeeArt } from "@/components/coffee-art";
import { Button } from "@/components/ui";
import type { Shop } from "@/lib/types";

const PILLARS = ["Detect", "Understand", "Recommend", "Enjoy"];

export function WelcomeStep({ shop, onDiscover, onManual }: { shop: Shop; onDiscover: () => void; onManual: () => void }) {
  return (
    <div className="grid items-center gap-10 py-6 md:grid-cols-[1.1fr_1fr] md:py-14">
      <div className="order-2 text-center md:order-1 md:text-left">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-foam px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-coffee ring-1 ring-latte"
        >
          <Sparkles className="size-3.5 text-brand-accent" /> Welcome to {shop.name}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="font-display text-[2.6rem] font-semibold leading-[1.05] tracking-tight text-espresso sm:text-6xl"
        >
          Let your mood
          <br />
          choose your <span className="italic text-brand">coffee.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-coffee md:mx-0"
        >
          {shop.welcome_message ||
            "Give us a smile (or a yawn). We'll read your vibe and pour a recommendation that fits your moment."}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="mt-8 flex flex-col items-center gap-3 sm:flex-row md:justify-start"
        >
          {shop.camera_enabled ? (
            <>
              <Button size="lg" onClick={onDiscover} icon={<ScanFace className="size-5" />} className="w-full sm:w-auto">
                Discover My Mood
              </Button>
              <Button size="lg" variant="ghost" onClick={onManual} icon={<Hand className="size-5" />}>
                I&apos;ll pick it myself
              </Button>
            </>
          ) : (
            <Button size="lg" onClick={onManual} icon={<Sparkles className="size-5" />} className="w-full sm:w-auto">
              Discover My Mood
            </Button>
          )}
        </motion.div>

        <ol className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm font-semibold text-coffee md:justify-start">
          {PILLARS.map((p, i) => (
            <li key={p} className="flex items-center gap-3">
              <span>{p}.</span>
              {i < PILLARS.length - 1 && <span className="size-1 rounded-full bg-caramel" aria-hidden />}
            </li>
          ))}
        </ol>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 18, delay: 0.1 }}
        className="relative order-1 mx-auto w-64 sm:w-80 md:order-2 md:w-full md:max-w-md"
      >
        <div className="absolute inset-6 rounded-full bg-brand-accent/25 blur-3xl" aria-hidden />
        <div className="animate-float relative">
          <CoffeeArt kind="latte" className="w-full drop-shadow-xl" title="A steaming latte" />
        </div>
        <div className="absolute -left-2 top-8 hidden animate-float rounded-2xl bg-foam/90 px-3 py-2 text-sm font-semibold shadow-soft ring-1 ring-latte backdrop-blur sm:block" style={{ animationDelay: "1.2s" }}>
          😌 Calm → Cappuccino
        </div>
        <div className="absolute -right-2 bottom-12 hidden animate-float rounded-2xl bg-foam/90 px-3 py-2 text-sm font-semibold shadow-soft ring-1 ring-latte backdrop-blur sm:block" style={{ animationDelay: "2.4s" }}>
          😴 Tired → Espresso
        </div>
      </motion.div>
    </div>
  );
}
