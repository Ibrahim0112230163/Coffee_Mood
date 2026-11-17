"use client";

import { getBrowserSupabase } from "./supabase/client";
import { STORAGE_BUCKET } from "./supabase/env";

const ALLOWED = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Uploads an image into the shop's own folder ("<shopId>/<kind>/<uuid>.<ext>").
 * Storage RLS only lets owners/managers of that shop write there.
 */
export async function uploadShopImage(shopId: string, file: File, kind: "menu" | "logo"): Promise<string> {
  if (!ALLOWED.includes(file.type)) throw new Error("Please choose a PNG, JPG or WebP image.");
  if (file.size > MAX_BYTES) throw new Error("Images must be 5 MB or smaller.");
  const supabase = getBrowserSupabase();
  if (!supabase) throw new Error("Storage is not configured.");

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${shopId}/${kind}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}
