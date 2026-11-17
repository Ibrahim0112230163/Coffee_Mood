"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CupSoda, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState, type CSSProperties } from "react";
import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui";
import { completeInteraction, logInteraction } from "@/lib/events";
import type { ExpressionEstimate } from "@/lib/expression/classify";
import { contrastText } from "@/lib/format";
import { rankRecommendations, recommendationMessage } from "@/lib/recommend";
import type { Mood, ShopBundle } from "@/lib/types";
import { CameraStep } from "./camera-step";
import { CartButton, CartDrawer, CartProvider, useCart } from "./cart";
import { ConfirmStep, MoodPicker } from "./mood-steps";
import { RecommendationStep, ResultStep, defaultSelection, priceFor, type Selection } from "./recommendation-steps";
import { WelcomeStep } from "./welcome-step";

type Step = "welcome" | "camera" | "confirm" | "choose" | "recommend" | "result";

interface Session {
  method: "camera" | "manual";
  detected: ExpressionEstimate | null;
  mood: Mood | null;
  index: number;
  alternativesViewed: number;
  interactionId: string | null;
  accepted: boolean;
}

const EMPTY_SESSION: Session = {
  method: "manual",
  detected: null,
  mood: null,
  index: 0,
  alternativesViewed: 0,
  interactionId: null,
  accepted: false,
};

export function Experience({ bundle }: { bundle: ShopBundle }) {
  const { shop } = bundle;
  const style = {
    "--brand": shop.primary_color,
    "--brand-accent": shop.accent_color,
    "--brand-ink": contrastText(shop.primary_color),
  } as CSSProperties;

  return (
    <CartProvider shopId={shop.id}>
      <div style={style} className="grain flex min-h-dvh flex-col bg-cream">
        <Flow bundle={bundle} />
      </div>
    </CartProvider>
  );
}

function Flow({ bundle }: { bundle: ShopBundle }) {
  const { shop, menu, rules, messages, demo } = bundle;
  const cart = useCart();
  const [step, setStep] = useState<Step>("welcome");
  const [session, setSession] = useState<Session>(EMPTY_SESSION);
  const [selection, setSelection] = useState<Selection>({ size: "", temperature: "hot" });

  const recs = useMemo(() => (session.mood ? rankRecommendations({ mood: session.mood, menu, rules }) : []), [session.mood, menu, rules]);
  const current = recs[session.index] ?? null;

  const go = (s: Step) => {
    setStep(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /** Mood confirmed (by the camera estimate or by hand): build recommendations and log the event. */
  const confirmMood = useCallback(
    (mood: Mood, method: "camera" | "manual", detected: ExpressionEstimate | null) => {
      const ranked = rankRecommendations({ mood, menu, rules });
      setSession({ ...EMPTY_SESSION, method, detected, mood });
      if (ranked[0]) setSelection(defaultSelection(ranked[0].item));
      go("recommend");
      void logInteraction({
        shopId: shop.id,
        demo,
        method,
        detectedMood: detected?.mood ?? null,
        confirmedMood: mood,
        recommendedItemId: ranked[0]?.item.id ?? null,
      }).then((id) => setSession((s) => (s.mood === mood ? { ...s, interactionId: id } : s)));
    },
    [menu, rules, shop.id, demo],
  );

  const showIndex = (index: number) => {
    const next = recs[index];
    if (!next) return;
    setSession((s) => ({ ...s, index, alternativesViewed: s.alternativesViewed + 1 }));
    setSelection(defaultSelection(next.item));
  };

  const accept = () => {
    if (!current) return;
    setSession((s) => ({ ...s, accepted: true }));
    void completeInteraction({
      interactionId: session.interactionId,
      selectedItemId: current.item.id,
      accepted: true,
      alternativesViewed: session.alternativesViewed,
    });
    go("result");
  };

  const startAgain = () => {
    if (session.mood && !session.accepted) {
      void completeInteraction({
        interactionId: session.interactionId,
        selectedItemId: null,
        accepted: false,
        alternativesViewed: session.alternativesViewed,
      });
    }
    setSession(EMPTY_SESSION);
    go("welcome");
  };

  const addCurrentToCart = () => {
    if (!current) return;
    cart.add({
      menuItemId: current.item.id,
      name: current.item.name,
      imageUrl: current.item.image_url,
      size: selection.size,
      temperature: selection.temperature,
      unitPrice: priceFor(current.item, selection.size),
    });
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-latte/60 bg-cream/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <button onClick={startAgain} className="flex items-center gap-3 text-left" aria-label={`${shop.name} home`}>
            {shop.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- tenant logo from storage
              <img src={shop.logo_url} alt="" className="size-9 rounded-full object-cover ring-1 ring-latte" />
            ) : (
              <span className="flex size-9 items-center justify-center rounded-full bg-brand text-brand-ink">
                <CupSoda className="size-5" />
              </span>
            )}
            <span className="leading-tight">
              <span className="block font-display text-lg font-semibold">{shop.name}</span>
              {shop.tagline && <span className="hidden text-xs text-coffee sm:block">{shop.tagline}</span>}
            </span>
          </button>
          <CartButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step + (session.mood ?? "")}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            {step === "welcome" && <WelcomeStep shop={shop} onDiscover={() => go("camera")} onManual={() => go("choose")} />}

            {step === "camera" && (
              <CameraStep
                onDetected={(estimate) => {
                  setSession({ ...EMPTY_SESSION, method: "camera", detected: estimate, mood: null });
                  go("confirm");
                }}
                onManual={() => go("choose")}
              />
            )}

            {step === "confirm" && session.detected && (
              <ConfirmStep
                mood={session.detected.mood}
                onYes={() => confirmMood(session.detected!.mood, "camera", session.detected)}
                onChoose={() => go("choose")}
              />
            )}

            {step === "choose" && (
              <MoodPicker
                highlight={session.detected?.ranked.slice(1, 3)}
                onPick={(m) => confirmMood(m, session.detected ? "camera" : "manual", session.detected)}
                onBack={() => go(session.detected ? "confirm" : "welcome")}
              />
            )}

            {step === "recommend" && session.mood && (current ? (
              <RecommendationStep
                mood={session.mood}
                recs={recs}
                index={session.index}
                selection={selection}
                currency={shop.currency}
                onSelection={setSelection}
                onAccept={accept}
                onNext={() => showIndex((session.index + 1) % recs.length)}
                onPickAlternative={showIndex}
                onChangeMood={() => go("choose")}
              />
            ) : (
              <EmptyMenu onBack={startAgain} />
            ))}

            {step === "result" && session.mood && current && (
              <ResultStep
                mood={session.mood}
                rec={current}
                message={recommendationMessage(session.mood, current.item.name, messages)}
                selection={selection}
                currency={shop.currency}
                onSelection={setSelection}
                onAddToCart={() => {
                  addCurrentToCart();
                  cart.setOpen(true);
                }}
                onOrderNow={() => {
                  addCurrentToCart();
                  cart.setOpen(true);
                }}
                onStartAgain={startAgain}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-coffee sm:flex-row sm:px-6">
        <p className="flex items-center gap-1.5">
          <ShieldCheck className="size-4" /> Your camera feed is analysed on this device and never stored or sent.{" "}
          <Link href="/privacy" className="font-semibold underline underline-offset-2">
            Privacy
          </Link>
        </p>
        <Link href="/" className="flex items-center gap-1.5 opacity-80 hover:opacity-100">
          Powered by <BrandMark className="text-xs" />
        </Link>
      </footer>

      <CartDrawer shopId={shop.id} demo={demo} currency={shop.currency} mood={session.mood} interactionId={session.interactionId} />
    </>
  );
}

function EmptyMenu({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <CupSoda className="mx-auto size-12 text-caramel" />
      <h2 className="mt-4 font-display text-3xl font-semibold">The menu is brewing</h2>
      <p className="mt-2 text-coffee">This café hasn&apos;t added any drinks yet. Please ask the barista for today&apos;s favourites.</p>
      <Button className="mt-6" onClick={onBack}>
        Back to start
      </Button>
    </div>
  );
}
