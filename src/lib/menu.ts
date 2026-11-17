import type { MenuItem } from "./types";

/** Coerces Postgres numerics (which may arrive as strings) into numbers. */
export function normalizeMenuItem(row: Record<string, unknown>): MenuItem {
  const item = row as unknown as MenuItem;
  return {
    ...item,
    sizes: (Array.isArray(item.sizes) ? item.sizes : []).map((s) => ({ label: String(s.label), price: Number(s.price) })),
    temperatures: item.temperatures?.length ? item.temperatures : ["hot"],
    tags: item.tags ?? [],
  };
}

export const MENU_COLUMNS =
  "id, shop_id, name, description, category, image_url, sizes, temperatures, caffeine_mg, tags, is_available, sort_order";
export const SHOP_COLUMNS =
  "id, slug, name, tagline, welcome_message, logo_url, primary_color, accent_color, currency, camera_enabled, is_published";
