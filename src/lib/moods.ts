import type { Mood } from "./types";

export interface MoodMeta {
  label: string;
  emoji: string;
  /** Friendly, non-judgemental phrasing used in "We think you're feeling…" */
  phrase: string;
  /** Default personalised message; {coffee} is replaced with the drink name. */
  defaultMessage: string;
  /** Tags that suit this mood when a shop has no explicit rule. Weight 0..1. */
  preferredTags: Record<string, number>;
  /** Fallback "why it matches" copy. */
  defaultReason: string;
  /** Background tint for mood visuals. */
  tint: string;
}

export const MOOD_META: Record<Mood, MoodMeta> = {
  happy: {
    label: "Happy",
    emoji: "😊",
    phrase: "in a happy mood",
    defaultMessage: "That smile deserves a treat. A {coffee} feels just right for today!",
    preferredTags: { sweet: 1, celebratory: 1, creamy: 0.5, iced: 0.3 },
    defaultReason: "Sweet and joyful, to match your good mood.",
    tint: "#f5c26b",
  },
  sad: {
    label: "A bit down",
    emoji: "🥺",
    phrase: "a little down",
    defaultMessage: "Looks like you could use a little comfort today. Our {coffee} is here for you.",
    preferredTags: { comforting: 1, chocolate: 0.9, creamy: 0.5, sweet: 0.4 },
    defaultReason: "Warm and comforting, like a hug in a cup.",
    tint: "#9db4d1",
  },
  stressed: {
    label: "Stressed",
    emoji: "😣",
    phrase: "a bit stressed",
    defaultMessage: "Take a breath. A smooth {coffee} might be your perfect companion right now.",
    preferredTags: { soothing: 1, mellow: 0.8, "caffeine-free": 0.6, creamy: 0.4 },
    defaultReason: "Smooth and mellow, to help you slow down.",
    tint: "#c9a7d8",
  },
  angry: {
    label: "Angry",
    emoji: "😠",
    phrase: "a bit frustrated",
    defaultMessage: "Rough moment? Let's cool things down with a {coffee}. You've got this.",
    preferredTags: { refreshing: 0.9, soothing: 1, iced: 0.7, "caffeine-free": 0.6, mellow: 0.5 },
    defaultReason: "Cool and smooth, to help you take the heat down a notch.",
    tint: "#e59a8c",
  },
  tired: {
    label: "Tired",
    emoji: "😴",
    phrase: "a little tired",
    defaultMessage: "Running low on energy? A {coffee} should bring you back to life.",
    preferredTags: { energizing: 1, strong: 0.9, bold: 0.7 },
    defaultReason: "Bold and energising for a well-earned lift.",
    tint: "#b8a48f",
  },
  excited: {
    label: "Excited",
    emoji: "🤩",
    phrase: "excited",
    defaultMessage: "Love that energy! Keep the good vibes flowing with a {coffee}.",
    preferredTags: { iced: 0.9, celebratory: 1, sweet: 0.6, refreshing: 0.7 },
    defaultReason: "Cool, fun and full of energy, just like you.",
    tint: "#f29e6b",
  },
  calm: {
    label: "Calm",
    emoji: "😌",
    phrase: "calm and relaxed",
    defaultMessage: "You seem nicely relaxed. Savour the moment with a {coffee}.",
    preferredTags: { balanced: 1, mellow: 0.8, classic: 0.6 },
    defaultReason: "Balanced and unhurried, for a peaceful moment.",
    tint: "#a9c9a4",
  },
  neutral: {
    label: "Neutral",
    emoji: "🙂",
    phrase: "pretty neutral",
    defaultMessage: "A steady day calls for a dependable cup. How about a {coffee}?",
    preferredTags: { classic: 1, balanced: 0.8, light: 0.5 },
    defaultReason: "A dependable classic that fits any moment.",
    tint: "#d8c3a5",
  },
};

export function isMood(value: unknown): value is Mood {
  return typeof value === "string" && value in MOOD_META;
}
