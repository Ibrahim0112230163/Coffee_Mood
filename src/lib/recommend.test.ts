import { describe, expect, it } from "vitest";
import { rankRecommendations, recommendationMessage } from "./recommend";
import type { MenuItem, MoodRule } from "./types";

const item = (id: string, tags: string[] = [], extra: Partial<MenuItem> = {}): MenuItem => ({
  id,
  shop_id: "s1",
  name: id,
  description: "",
  category: "Coffee",
  image_url: null,
  sizes: [{ label: "Regular", price: 4 }],
  temperatures: ["hot"],
  caffeine_mg: null,
  tags,
  is_available: true,
  sort_order: 0,
  ...extra,
});

const rule = (mood: MoodRule["mood"], menu_item_id: string, rank: number, reason: string | null = null): MoodRule => ({
  id: `${mood}-${menu_item_id}`,
  shop_id: "s1",
  mood,
  menu_item_id,
  rank,
  reason,
});

describe("rankRecommendations", () => {
  const menu = [item("americano", ["classic"]), item("mocha", ["comforting", "chocolate"]), item("espresso", ["energizing", "strong"])];

  it("puts shop rules first, in rank order, with their reasons", () => {
    const ranked = rankRecommendations({
      mood: "tired",
      menu,
      rules: [rule("tired", "americano", 1, "Steady"), rule("tired", "mocha", 0, "Sweet boost")],
    });
    expect(ranked.map((r) => r.item.id)).toEqual(["mocha", "americano", "espresso"]);
    expect(ranked[0]).toMatchObject({ source: "rule", reason: "Sweet boost" });
  });

  it("falls back to tag matching when no rule exists", () => {
    const ranked = rankRecommendations({ mood: "sad", menu, rules: [] });
    expect(ranked[0].item.id).toBe("mocha");
    expect(ranked[0].source).toBe("match");
    expect(ranked[0].reason).toBe("Comforting and chocolate, a lovely fit for your mood.");
  });

  it("skips unavailable items and rules for other moods", () => {
    const ranked = rankRecommendations({
      mood: "tired",
      menu: [...menu.slice(0, 2), item("espresso", ["energizing"], { is_available: false })],
      rules: [rule("happy", "americano", 0), rule("tired", "espresso", 0)],
    });
    expect(ranked.map((r) => r.item.id)).not.toContain("espresso");
    expect(ranked.every((r) => r.source !== "rule")).toBe(true);
  });

  it("returns every available drink so 'show me something else' never dead-ends", () => {
    expect(rankRecommendations({ mood: "calm", menu, rules: [] })).toHaveLength(3);
  });

  it("returns nothing for an empty menu", () => {
    expect(rankRecommendations({ mood: "calm", menu: [], rules: [] })).toEqual([]);
  });
});

describe("recommendationMessage", () => {
  it("uses the shop's custom message with the coffee name", () => {
    const msg = recommendationMessage("happy", "Latte", [{ shop_id: "s1", mood: "happy", message: "Enjoy a {coffee}!" }]);
    expect(msg).toBe("Enjoy a Latte!");
  });

  it("falls back to the default message", () => {
    expect(recommendationMessage("stressed", "Vanilla Latte", [])).toContain("Vanilla Latte");
  });

  it("appends the coffee when a custom message has no placeholder", () => {
    const msg = recommendationMessage("calm", "Cappuccino", [{ shop_id: "s1", mood: "calm", message: "Relax." }]);
    expect(msg).toBe("Relax. We suggest our Cappuccino.");
  });
});
