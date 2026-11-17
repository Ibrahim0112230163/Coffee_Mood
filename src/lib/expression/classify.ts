import type { Mood } from "../types";

/**
 * Maps MediaPipe Face Landmarker *blendshapes* (52 facial muscle-movement
 * coefficients in 0..1, see ARKit naming) to one of our mood labels.
 *
 * This is an expression heuristic, not an emotion detector: it describes what
 * the face is visibly doing (smiling, frowning, eyes half-closed…) and picks the
 * closest label. The resulting scores are relative evidence, NOT calibrated
 * probabilities, which is why the UI never shows them as a confidence %.
 */

export type Blendshapes = Record<string, number>;

/** Linear ramp: 0 below lo, 1 above hi. */
const ramp = (x: number, lo: number, hi: number) => Math.min(1, Math.max(0, (x - lo) / (hi - lo)));
const avg = (b: Blendshapes, ...keys: string[]) => keys.reduce((s, k) => s + (b[k] ?? 0), 0) / keys.length;

export interface ExpressionFeatures {
  smile: number;
  frown: number;
  browDown: number;
  browInnerUp: number;
  browOuterUp: number;
  eyeWide: number;
  eyeBlink: number;
  eyeSquint: number;
  eyeLookDown: number;
  jawOpen: number;
  mouthPress: number;
  noseSneer: number;
  cheekSquint: number;
  mouthShrugLower: number;
  mouthUpperUp: number;
  mouthStretch: number;
}

export function extractFeatures(b: Blendshapes): ExpressionFeatures {
  return {
    smile: avg(b, "mouthSmileLeft", "mouthSmileRight"),
    frown: avg(b, "mouthFrownLeft", "mouthFrownRight"),
    browDown: avg(b, "browDownLeft", "browDownRight"),
    browInnerUp: b.browInnerUp ?? 0,
    browOuterUp: avg(b, "browOuterUpLeft", "browOuterUpRight"),
    eyeWide: avg(b, "eyeWideLeft", "eyeWideRight"),
    eyeBlink: avg(b, "eyeBlinkLeft", "eyeBlinkRight"),
    eyeSquint: avg(b, "eyeSquintLeft", "eyeSquintRight"),
    eyeLookDown: avg(b, "eyeLookDownLeft", "eyeLookDownRight"),
    jawOpen: b.jawOpen ?? 0,
    mouthPress: avg(b, "mouthPressLeft", "mouthPressRight"),
    noseSneer: avg(b, "noseSneerLeft", "noseSneerRight"),
    cheekSquint: avg(b, "cheekSquintLeft", "cheekSquintRight"),
    mouthShrugLower: b.mouthShrugLower ?? 0,
    mouthUpperUp: avg(b, "mouthUpperUpLeft", "mouthUpperUpRight"),
    mouthStretch: avg(b, "mouthStretchLeft", "mouthStretchRight"),
  };
}

/** Baseline evidence for "neutral": any other label must beat this to win. */
export const NEUTRAL_BASELINE = 0.28;

export function scoreMoods(f: ExpressionFeatures): Record<Mood, number> {
  const smiling = ramp(f.smile, 0.25, 0.7);
  const notSmiling = 1 - ramp(f.smile, 0.2, 0.5);
  const arousal = Math.max(ramp(f.eyeWide, 0.15, 0.45), ramp(f.jawOpen, 0.15, 0.5), ramp(f.browOuterUp, 0.2, 0.5));

  const excited = ramp(f.smile, 0.3, 0.7) * (0.25 + 0.75 * arousal);
  const happy = Math.max(0, smiling * (0.85 + 0.15 * ramp(f.cheekSquint, 0.1, 0.4)) - excited * 0.4);

  const sad =
    notSmiling *
    (0.6 * ramp(f.frown, 0.08, 0.35) + 0.25 * ramp(f.browInnerUp, 0.15, 0.5) + 0.15 * ramp(f.mouthShrugLower, 0.15, 0.45));

  // Stressed: tense and worried. Lowered brows, often pulled up in the middle, with tight or stretched lips.
  const stressed =
    notSmiling *
    (0.35 * ramp(f.browDown, 0.15, 0.45) +
      0.25 * ramp(f.browInnerUp, 0.15, 0.45) +
      0.25 * ramp(f.mouthPress, 0.1, 0.4) +
      0.15 * ramp(f.mouthStretch, 0.1, 0.4));

  // Angry: a hard scowl. Strongly lowered brows plus a nose wrinkle and a raised upper lip or clamped lips.
  const angry =
    notSmiling *
    (0.4 * ramp(f.browDown, 0.3, 0.65) +
      0.3 * ramp(f.noseSneer, 0.15, 0.45) +
      0.3 * Math.max(ramp(f.mouthUpperUp, 0.15, 0.45), ramp(f.mouthPress, 0.25, 0.55)));

  // Sustained half-closed eyes (median over the window filters out normal blinks),
  // or a yawn: wide-open jaw with squinting eyes.
  const droopy = ramp(f.eyeBlink, 0.3, 0.6) * (0.85 + 0.15 * ramp(f.eyeLookDown, 0.1, 0.4));
  const yawn = ramp(f.jawOpen, 0.5, 0.8) * ramp(f.eyeSquint + f.eyeBlink, 0.3, 0.8) * notSmiling;
  const tired = Math.max(droopy, yawn);

  // A gentle, relaxed face: a soft smile with little tension anywhere else.
  const tension = Math.max(ramp(f.browDown, 0.15, 0.5), ramp(f.frown, 0.1, 0.35), arousal, ramp(f.eyeBlink, 0.3, 0.6));
  const softSmile = ramp(f.smile, 0.06, 0.18) * (1 - ramp(f.smile, 0.3, 0.5));
  const calm = softSmile * (1 - tension) * 0.9;

  return { happy, excited, sad, stressed, angry, tired, calm, neutral: NEUTRAL_BASELINE };
}

export function topMood(scores: Record<Mood, number>): Mood {
  let best: Mood = "neutral";
  for (const [mood, score] of Object.entries(scores) as [Mood, number][]) {
    if (score > scores[best]) best = mood;
  }
  return best;
}

/** Element-wise median over many frames: robust to blinks and momentary twitches. */
export function medianBlendshapes(frames: Blendshapes[]): Blendshapes {
  if (frames.length === 0) return {};
  const keys = new Set(frames.flatMap((f) => Object.keys(f)));
  const out: Blendshapes = {};
  for (const k of keys) {
    const vals = frames.map((f) => f[k] ?? 0).sort((a, b) => a - b);
    const mid = Math.floor(vals.length / 2);
    out[k] = vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
  }
  return out;
}

export interface ExpressionEstimate {
  mood: Mood;
  /** Moods ordered by relative evidence (for "did you mean" suggestions). */
  ranked: Mood[];
  frames: number;
}

export function estimateFromFrames(frames: Blendshapes[]): ExpressionEstimate {
  const scores = scoreMoods(extractFeatures(medianBlendshapes(frames)));
  const ranked = (Object.keys(scores) as Mood[]).sort((a, b) => scores[b] - scores[a]);
  return { mood: topMood(scores), ranked, frames: frames.length };
}
