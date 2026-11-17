import type { Metadata } from "next";
import { ReadOnlyNotice } from "@/components/dashboard/fields";
import { MenuManager } from "@/components/dashboard/menu-manager";
import { getDashboardContext } from "@/lib/data/dashboard";
import { MENU_COLUMNS, normalizeMenuItem } from "@/lib/menu";
import { createSupabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Menu" };

export default async function MenuPage() {
  const ctx = await getDashboardContext();
  if (!ctx) return null;
  if (!ctx.canManage) return <ReadOnlyNotice />;
  const { shop } = ctx.current;

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("menu_items")
    .select(MENU_COLUMNS)
    .eq("shop_id", shop.id)
    .order("sort_order")
    .order("name");
  if (error) throw new Error(`Could not load the menu: ${error.message}`);

  return <MenuManager shopId={shop.id} currency={shop.currency} initialItems={(data ?? []).map(normalizeMenuItem)} />;
}
