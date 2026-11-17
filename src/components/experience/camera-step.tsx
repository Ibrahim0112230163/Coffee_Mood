"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Camera, CameraOff, EyeOff, Hand, Lock, RefreshCw, ScanFace, ServerOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui";
import type { ExpressionEstimate } from "@/lib/expression/classify";
import { NoFaceError, useFaceExpression } from "@/lib/expression/use-face-expression";

const VIBE_LINES = ["Analyzing your vibe…", "Reading the room…", "Steaming the milk…", "Almost there…"];

export function CameraStep({ onDetected, onManual }: { onDetected: (e: ExpressionEstimate) => void; onManual: () => void }) {
  const { videoRef, state, error, start, stop, analyze } = useFaceExpression();
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  async function runDetection() {
    setAnalysisError(null);
    setAnalyzing(true);
    setProgress(0);
    try {
      const estimate = await analyze(3200, setProgress);
      stop(); // release the camera the moment we have an estimate
      onDetected(estimate);
    } catch (e) {
      setAnalysisError(
        e instanceof NoFaceError
          ? e.message
          : "The mood model couldn't run on this device. You can still pick your mood yourself.",
      );
    } finally {
      setAnalyzing(false);
    }
  }

  const live = state === "live";
  const vibeLine = VIBE_LINES[Math.min(VIBE_LINES.length - 1, Math.floor(progress * VIBE_LINES.length))];

  return (
    <div className="mx-auto grid max-w-5xl items-start gap-8 py-6 md:grid-cols-[1fr_0.9fr] md:py-10">
      {/* Preview */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] bg-espresso shadow-lift ring-1 ring-mocha">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`size-full -scale-x-100 object-cover transition-opacity duration-500 ${live ? "opacity-100" : "opacity-0"}`}
        />

        {!live && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-latte">
            {state === "requesting" ? (
              <>
                <Camera className="size-10 animate-pulse" />
                <p className="font-medium">Waiting for your permission…</p>
                <p className="text-sm text-latte/70">Your browser will ask whether to allow the camera.</p>
              </>
            ) : (
              <>
                <CameraOff className="size-10 opacity-70" />
                <p className="font-medium">Camera is off</p>
              </>
            )}
          </div>
        )}

        {/* Face guide */}
        {live && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className={`h-[72%] aspect-[3/4] rounded-[50%] border-2 border-dashed transition-colors ${analyzing ? "border-honey" : "border-foam/60"}`} />
          </div>
        )}

        {/* Analyzing overlay */}
        <AnimatePresence>
          {analyzing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0">
              <motion.div
                className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-honey/35 to-transparent"
                animate={{ top: ["-20%", "100%"] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-espresso/90 to-transparent p-5 pt-16 text-center">
                <AnimatePresence mode="wait">
                  <motion.p key={vibeLine} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="font-display text-2xl text-foam">
                    {vibeLine}
                  </motion.p>
                </AnimatePresence>
                <div className="mx-auto mt-3 h-1.5 max-w-xs overflow-hidden rounded-full bg-foam/20">
                  <div className="h-full rounded-full bg-honey transition-[width] duration-150" style={{ width: `${progress * 100}%` }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Always-visible camera indicator + stop */}
        {live && !analyzing && (
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-espresso/70 px-3 py-1.5 text-xs font-semibold text-foam backdrop-blur">
              <span className="size-2 animate-pulse rounded-full bg-red-500" /> Camera on
            </span>
          </div>
        )}
        {live && (
          <button
            onClick={stop}
            className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-foam/90 px-3 py-1.5 text-xs font-bold text-espresso shadow-soft backdrop-blur hover:bg-white"
          >
            <CameraOff className="size-3.5" /> Stop camera
          </button>
        )}
      </div>

      {/* Explanation & controls */}
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {live ? "Ready when you are" : "A quick look at your vibe"}
          </h2>
          <p className="mt-3 text-lg leading-relaxed text-coffee">
            {live
              ? "Look at the camera and relax your face naturally. We'll take about three seconds."
              : "With your permission, we use your camera to estimate the expression on your face, then suggest a coffee to match. It's a fun guess, not mind reading: you'll always get to confirm or change it."}
          </p>
        </div>

        {!live && (
          <ul className="space-y-3 text-[15px]">
            {[
              { icon: Lock, text: "Analysed entirely on this device, in your browser." },
              { icon: ServerOff, text: "No photos or video are saved or uploaded. Ever." },
              { icon: EyeOff, text: "We don't identify you or keep any face data." },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-sand text-brand">
                  <Icon className="size-4" />
                </span>
                <span className="text-mocha">{text}</span>
              </li>
            ))}
          </ul>
        )}

        {(error || analysisError) && (
          <p role="alert" className="rounded-2xl bg-sand px-4 py-3 text-[15px] text-mocha ring-1 ring-latte">
            {analysisError ?? error}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {live ? (
            <Button size="lg" onClick={runDetection} loading={analyzing} icon={analysisError ? <RefreshCw className="size-5" /> : <ScanFace className="size-5" />}>
              {analyzing ? "Analyzing…" : analysisError ? "Try again" : "Start Mood Detection"}
            </Button>
          ) : (
            state !== "denied" &&
            state !== "unavailable" && (
              <Button size="lg" onClick={start} loading={state === "requesting"} icon={<Camera className="size-5" />}>
                Allow camera
              </Button>
            )
          )}
          <Button size="lg" variant="secondary" onClick={() => { stop(); onManual(); }} icon={<Hand className="size-5" />}>
            Continue without camera
          </Button>
        </div>
      </div>
    </div>
  );
}
