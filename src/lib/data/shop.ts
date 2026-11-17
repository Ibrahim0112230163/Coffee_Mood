import "server-only";

import { isSupabaseConfigured } from "../supabase/env";
import { createSupabasePublic } from "../supabase/server";
import { MENU_COLUMNS, SHOP_COLUMNS, normalizeMenuItem } from "../menu";
import type { MoodMessage, MoodRule, Shop, ShopBundle } from "../types";
import { DEMO_BUNDLE, DEMO_SLUG } from "./demo";

/**
 * Loads one shop's public customer bundle. Uses the anonymous client, so RLS
 * guarantees only published shops and available items are returned.
 * Returns null when the shop doesn't exist (or isn't published).
 */
export async function getShopBundle(slug: string): Promise<ShopBundle | null> {
  if (!isSupabaseConfigured) return slug === DEMO_SLUG ? DEMO_BUNDLE : null;

  const supabase = createSupabasePublic();
  const { data: shop, error } = await supabase.from("shops").select(SHOP_COLUMNS).eq("slug", slug).maybeSingle<Shop>();
  if (error) throw new Error(`Could not load shop: ${error.message}`);
  if (!shop) return slug === DEMO_SLUG ? DEMO_BUNDLE : null;

  const [menu, rules, messages] = await Promise.all([
    supabase.from("menu_items").select(MENU_COLUMNS).eq("shop_id", shop.id).eq("is_available", true).order("sort_order"),
    supabase.from("mood_rules").select("id, shop_id, mood, menu_item_id, rank, reason").eq("shop_id", shop.id),
    supabase.from("mood_messages").select("shop_id, mood, message").eq("shop_id", shop.id),
  ]);
  const failed = menu.error ?? rules.error ?? messages.error;
  if (failed) throw new Error(`Could not load menu: ${failed.message}`);

  return {
    demo: false,
    shop,
    menu: (menu.data ?? []).map(normalizeMenuItem),
    rules: (rules.data ?? []) as MoodRule[],
    messages: (messages.data ?? []) as MoodMessage[],
  };
}
