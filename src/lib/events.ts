"use client";

import { getBrowserSupabase } from "./supabase/client";
import type { Mood, Temperature } from "./types";

/**
 * Customer-side events. Only mood *labels* and drink IDs are sent; no images,
 * landmarks or identifiers. In demo mode these are no-ops.
 */

export async function logInteraction(input: {
  shopId: string;
  demo: boolean;
  method: "camera" | "manual";
  detectedMood: Mood | null;
  confirmedMood: Mood;
  recommendedItemId: string | null;
}): Promise<string | null> {
  const supabase = getBrowserSupabase();
  if (input.demo || !supabase) return null;
  const { data, error } = await supabase.rpc("log_interaction", {
    p_shop_id: input.shopId,
    p_method: input.method,
    p_detected_mood: input.detectedMood,
    p_confirmed_mood: input.confirmedMood,
    p_recommended_item_id: input.recommendedItemId,
  });
  if (error) {
    console.warn("[coffie-mood] could not log interaction", error.message);
    return null;
  }
  return data as string;
}

export async function completeInteraction(input: {
  interactionId: string | null;
  selectedItemId: string | null;
  accepted: boolean;
  alternativesViewed: number;
}): Promise<void> {
  const supabase = getBrowserSupabase();
  if (!input.interactionId || !supabase) return;
  const { error } = await supabase.rpc("complete_interaction", {
    p_interaction_id: input.interactionId,
    p_selected_item_id: input.selectedItemId,
    p_accepted: input.accepted,
    p_alternatives_viewed: input.alternativesViewed,
  });
  if (error) console.warn("[coffie-mood] could not complete interaction", error.message);
}

export interface CartLine {
  key: string;
  menuItemId: string;
  name: string;
  imageUrl: string | null;
  size: string;
  temperature: Temperature;
  quantity: number;
  unitPrice: number;
}

export interface PlacedOrder {
  orderCode: string;
  total: number;
  demo: boolean;
}

export async function placeOrder(input: {
  shopId: string;
  demo: boolean;
  lines: CartLine[];
  customerName: string;
  mood: Mood | null;
  interactionId: string | null;
}): Promise<PlacedOrder> {
  const supabase = getBrowserSupabase();
  if (input.demo || !supabase) {
    const total = input.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
    return { orderCode: Math.random().toString(36).slice(2, 8).toUpperCase(), total, demo: true };
  }
  const { data, error } = await supabase.rpc("place_order", {
    p_shop_id: input.shopId,
    p_items: input.lines.map((l) => ({
      menu_item_id: l.menuItemId,
      size: l.size,
      temperature: l.temperature,
      quantity: l.quantity,
    })),
    p_customer_name: input.customerName || null,
    p_mood: input.mood,
    p_interaction_id: input.interactionId,
  });
  if (error) throw new Error(error.message);
  const row = (Array.isArray(data) ? data[0] : data) as { order_code: string; total: number | string };
  return { orderCode: row.order_code, total: Number(row.total), demo: false };
}
