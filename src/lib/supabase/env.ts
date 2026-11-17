/** Supabase connection settings. Accepts the new publishable key or the legacy anon key. */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** When false the app runs in demo mode: the /shop/demo experience works, the dashboard explains setup. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

export const STORAGE_BUCKET = "shop-assets";
