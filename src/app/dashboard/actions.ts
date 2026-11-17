"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CURRENT_SHOP_COOKIE } from "@/lib/data/dashboard";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * The cookie only selects which of *your* shops the dashboard shows.
 * Access is still enforced by RLS and by getDashboardContext(), which ignores
 * a cookie pointing at a shop you don't belong to.
 */
async function setCurrentShop(shopId: string) {
  if (!UUID.test(shopId)) return;
  (await cookies()).set(CURRENT_SHOP_COOKIE, shopId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function switchShop(formData: FormData) {
  await setCurrentShop(String(formData.get("shopId") ?? ""));
  redirect("/dashboard");
}

export async function selectShopAfterCreate(shopId: string) {
  await setCurrentShop(shopId);
}
