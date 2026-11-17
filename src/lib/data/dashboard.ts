import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { SHOP_COLUMNS } from "../menu";
import { isSupabaseConfigured } from "../supabase/env";
import { createSupabaseServer } from "../supabase/server";
import type { MemberRole, Shop } from "../types";

export const CURRENT_SHOP_COOKIE = "cm_shop";

export interface Membership {
  role: MemberRole;
  shop: Shop;
}

export interface DashboardContext {
  userId: string;
  email: string;
  memberships: Membership[];
  current: Membership;
  canManage: boolean;
}

/** Signed-in user plus their shops. Redirects to /login when signed out. Deduped per request. */
export const getSessionMemberships = cache(async () => {
  await connection(); // always per-request: depends on the signed-in user
  if (!isSupabaseConfigured) return null;
  const supabase = await createSupabaseServer();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");

  const { data, error } = await supabase
    .from("shop_members")
    .select(`role, shop:shops (${SHOP_COLUMNS})`)
    .eq("user_id", userId)
    .order("created_at");
  if (error) throw new Error(`Could not load your shops: ${error.message}`);

  const memberships = (data ?? [])
    .map((row) => ({ role: row.role as MemberRole, shop: row.shop as unknown as Shop }))
    .filter((m) => m.shop);
  return { userId, email: String(claims?.claims?.email ?? ""), memberships };
});

/**
 * Full dashboard context for pages inside the dashboard shell.
 * Sends users without a shop to onboarding.
 */
export const getDashboardContext = cache(async (): Promise<DashboardContext | null> => {
  const session = await getSessionMemberships();
  if (!session) return null;
  if (session.memberships.length === 0) redirect("/dashboard/new");

  const wanted = (await cookies()).get(CURRENT_SHOP_COOKIE)?.value;
  const current = session.memberships.find((m) => m.shop.id === wanted) ?? session.memberships[0];
  return { ...session, current, canManage: current.role !== "staff" };
});
