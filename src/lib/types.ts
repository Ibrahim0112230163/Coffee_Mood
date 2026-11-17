export const MOODS = ["happy", "sad", "stressed", "angry", "tired", "excited", "calm", "neutral"] as const;
export type Mood = (typeof MOODS)[number];

export type MemberRole = "owner" | "manager" | "staff";
export type Temperature = "hot" | "iced";
export type OrderStatus = "new" | "preparing" | "ready" | "completed" | "cancelled";

export interface SizeOption {
  label: string;
  price: number;
}

export interface Shop {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  welcome_message: string | null;
  logo_url: string | null;
  primary_color: string;
  accent_color: string;
  currency: string;
  camera_enabled: boolean;
  is_published: boolean;
}

export interface MenuItem {
  id: string;
  shop_id: string;
  name: string;
  description: string;
  category: string;
  image_url: string | null;
  sizes: SizeOption[];
  temperatures: Temperature[];
  caffeine_mg: number | null;
  tags: string[];
  is_available: boolean;
  sort_order: number;
}

export interface MoodRule {
  id: string;
  shop_id: string;
  mood: Mood;
  menu_item_id: string;
  rank: number;
  reason: string | null;
}

export interface MoodMessage {
  shop_id: string;
  mood: Mood;
  message: string;
}

/** Everything the customer experience needs for one shop. */
export interface ShopBundle {
  shop: Shop;
  menu: MenuItem[];
  rules: MoodRule[];
  messages: MoodMessage[];
  /** true when served from built-in demo data instead of the database */
  demo: boolean;
}

export interface OrderLine {
  menu_item_id: string;
  name: string;
  size: string;
  temperature: Temperature;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: string;
  shop_id: string;
  order_code: string;
  customer_name: string | null;
  mood: Mood | null;
  items: OrderLine[];
  total: number;
  currency: string;
  status: OrderStatus;
  created_at: string;
}

export interface ShopAnalytics {
  total_interactions: number;
  camera_interactions: number;
  manual_interactions: number;
  completed: number;
  accepted: number;
  corrected: number;
  detected_moods: { mood: Mood; count: number }[];
  confirmed_moods: { mood: Mood; count: number }[];
  top_recommended: { name: string; count: number }[];
  top_selected: { name: string; count: number }[];
  daily: { day: string; count: number }[];
  orders: number;
  revenue: number;
}
