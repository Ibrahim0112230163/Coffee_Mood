import type { Metadata } from "next";
import { ReadOnlyNotice } from "@/components/dashboard/fields";
import { MoodConfigurator } from "@/components/dashboard/mood-configurator";
import { getDashboardContext } from "@/lib/data/dashboard";
import { MENU_COLUMNS, normalizeMenuItem } from "@/lib/menu";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { MoodMessage, MoodRule } from "@/lib/types";

export const metadata: Metadata = { title: "Mood rules" };

export default async function MoodsPage() {
  const ctx = await getDashboardContext();
  if (!ctx) return null;
  if (!ctx.canManage) return <ReadOnlyNotice />;
  const { shop } = ctx.current;

  const supabase = await createSupabaseServer();
  const [menu, rules, messages] = await Promise.all([
    supabase.from("menu_items").select(MENU_COLUMNS).eq("shop_id", shop.id).order("sort_order"),
    supabase.from("mood_rules").select("id, shop_id, mood, menu_item_id, rank, reason").eq("shop_id", shop.id).order("rank"),
    supabase.from("mood_messages").select("shop_id, mood, message").eq("shop_id", shop.id),
  ]);
  const failed = menu.error ?? rules.error ?? messages.error;
  if (failed) throw new Error(`Could not load mood rules: ${failed.message}`);

  return (
    <MoodConfigurator
      shopId={shop.id}
      menu={(menu.data ?? []).map(normalizeMenuItem)}
      initialRules={(rules.data ?? []) as MoodRule[]}
      initialMessages={(messages.data ?? []) as MoodMessage[]}
    />
  );
}
