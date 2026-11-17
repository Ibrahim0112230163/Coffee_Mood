import type { Metadata } from "next";
import { OrdersBoard } from "@/components/dashboard/orders-board";
import { getDashboardContext } from "@/lib/data/dashboard";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { Order } from "@/lib/types";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage() {
  const ctx = await getDashboardContext();
  if (!ctx) return null;
  const { shop } = ctx.current;

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("orders")
    .select("id, shop_id, order_code, customer_name, mood, items, total, currency, status, created_at")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw new Error(`Could not load orders: ${error.message}`);

  return <OrdersBoard orders={(data ?? []).map((o) => ({ ...o, total: Number(o.total) })) as Order[]} />;
}
