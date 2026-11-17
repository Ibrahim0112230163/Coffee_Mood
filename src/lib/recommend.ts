import { MOOD_META } from "./moods";
import type { MenuItem, Mood, MoodMessage, MoodRule } from "./types";

export interface Recommendation {
  item: MenuItem;
  /** Why this drink suits the mood. */
  reason: string;
  /** "rule" = configured by the shop, "match" = inferred from tags, "fallback" = anything available. */
  source: "rule" | "match" | "fallback";
}

export interface RecommendInput {
  mood: Mood;
  menu: MenuItem[];
  rules: MoodRule[];
}

/**
 * Ranks a shop's available drinks for a mood.
 * 1. Shop-configured rules for the mood, in rank order.
 * 2. Remaining drinks scored by how well their tags match the mood.
 * 3. Everything else, in menu order, so a customer is never left without options.
 */
export function rankRecommendations({ mood, menu, rules }: RecommendInput): Recommendation[] {
  const available = menu.filter((m) => m.is_available);
  const byId = new Map(available.map((m) => [m.id, m]));
  const meta = MOOD_META[mood];
  const seen = new Set<string>();
  const out: Recommendation[] = [];

  const moodRules = rules
    .filter((r) => r.mood === mood && byId.has(r.menu_item_id))
    .sort((a, b) => a.rank - b.rank);

  for (const rule of moodRules) {
    if (seen.has(rule.menu_item_id)) continue;
    seen.add(rule.menu_item_id);
    out.push({
      item: byId.get(rule.menu_item_id)!,
      reason: rule.reason?.trim() || meta.defaultReason,
      source: "rule",
    });
  }

  const rest = available
    .filter((m) => !seen.has(m.id))
    .map((item) => ({ item, score: tagScore(item, meta.preferredTags) }))
    .sort((a, b) => b.score - a.score || a.item.sort_order - b.item.sort_order || a.item.name.localeCompare(b.item.name));

  for (const { item, score } of rest) {
    out.push({
      item,
      reason: score > 0 ? tagReason(item, meta.preferredTags) : "Another favourite from our menu.",
      source: score > 0 ? "match" : "fallback",
    });
  }
  return out;
}

/** e.g. "Creamy and sweet, a lovely fit for your mood." built from the drink's best-matching tags. */
export function tagReason(item: MenuItem, preferred: Record<string, number>): string {
  const matched = item.tags
    .map((t) => t.toLowerCase())
    .filter((t) => (preferred[t] ?? 0) > 0)
    .sort((a, b) => preferred[b] - preferred[a])
    .slice(0, 2)
    .map((t) => t.replace(/-/g, " "));
  if (matched.length === 0) return "A lovely fit for your mood.";
  const phrase = matched.join(" and ");
  return `${phrase[0].toUpperCase()}${phrase.slice(1)}, a lovely fit for your mood.`;
}

export function tagScore(item: MenuItem, preferred: Record<string, number>): number {
  return item.tags.reduce((sum, tag) => sum + (preferred[tag.toLowerCase()] ?? 0), 0);
}

/** The personalised result message, using the shop's custom copy when set. */
export function recommendationMessage(mood: Mood, coffeeName: string, messages: MoodMessage[]): string {
  const custom = messages.find((m) => m.mood === mood)?.message?.trim();
  const template = custom || MOOD_META[mood].defaultMessage;
  return template.includes("{coffee}")
    ? template.replaceAll("{coffee}", coffeeName)
    : `${template} We suggest our ${coffeeName}.`;
}

export function lowestPrice(item: MenuItem): number {
  return Math.min(...item.sizes.map((s) => s.price));
}
