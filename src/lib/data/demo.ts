import type { MenuItem, Mood, MoodRule, ShopBundle } from "../types";

/**
 * Built-in demo shop served at /shop/demo. It mirrors the starter menu that
 * create_shop() seeds, so the full customer journey works even before Supabase
 * is configured. Demo interactions and orders are not persisted.
 */
const SHOP_ID = "00000000-0000-4000-8000-000000000000";

type Seed = [name: string, description: string, category: string, sizes: [string, number][], temps: MenuItem["temperatures"], caffeine: number, tags: string[]];

const SEEDS: Seed[] = [
  ["Caramel Macchiato", "Velvety steamed milk marked with espresso and finished with a buttery caramel drizzle.", "Espresso Bar", [["Small", 4.25], ["Medium", 4.95], ["Large", 5.55]], ["hot", "iced"], 150, ["sweet", "creamy", "celebratory"]],
  ["Hot Chocolate Mocha", "Rich dark chocolate melted into espresso and steamed milk, crowned with soft cream.", "Espresso Bar", [["Small", 4.45], ["Medium", 5.15], ["Large", 5.75]], ["hot"], 95, ["comforting", "chocolate", "sweet", "creamy"]],
  ["Vanilla Latte", "Smooth espresso and silky milk with a gentle touch of Madagascar vanilla.", "Espresso Bar", [["Small", 4.15], ["Medium", 4.85], ["Large", 5.45]], ["hot", "iced"], 130, ["soothing", "creamy", "mellow"]],
  ["Double Espresso", "Two bold, syrupy shots pulled from our house blend. Short, intense, and bright.", "Espresso Bar", [["Doppio", 3.25]], ["hot"], 130, ["energizing", "strong", "bold"]],
  ["Iced Caramel Latte", "Chilled espresso over ice with cold milk and a ribbon of golden caramel.", "Cold Bar", [["Medium", 5.05], ["Large", 5.65]], ["iced"], 150, ["iced", "sweet", "celebratory", "refreshing"]],
  ["Classic Cappuccino", "Equal parts espresso, steamed milk and airy foam. Balanced and timeless.", "Espresso Bar", [["Small", 3.95], ["Medium", 4.55]], ["hot"], 130, ["balanced", "mellow", "classic"]],
  ["Americano", "Espresso lengthened with hot water for a clean, steady, easy-going cup.", "Espresso Bar", [["Small", 3.25], ["Medium", 3.75], ["Large", 4.25]], ["hot", "iced"], 150, ["classic", "balanced", "light"]],
  ["Chamomile Honey Latte", "Caffeine-free chamomile steeped in steamed milk and sweetened with wildflower honey.", "Tea & More", [["Small", 4.05], ["Medium", 4.65]], ["hot"], 0, ["soothing", "caffeine-free", "comforting"]],
  ["Cold Brew", "Steeped for 18 hours for a smooth, chocolatey, low-acid pick-me-up.", "Cold Bar", [["Medium", 4.45], ["Large", 4.95]], ["iced"], 200, ["energizing", "iced", "refreshing", "strong"]],
];

const idFor = (i: number) => `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`;

const MENU: MenuItem[] = SEEDS.map(([name, description, category, sizes, temperatures, caffeine_mg, tags], i) => ({
  id: idFor(i),
  shop_id: SHOP_ID,
  name,
  description,
  category,
  image_url: null,
  sizes: sizes.map(([label, price]) => ({ label, price })),
  temperatures,
  caffeine_mg,
  tags,
  is_available: true,
  sort_order: i + 1,
}));

const RULES_SPEC: [Mood, string, string][] = [
  ["happy", "Caramel Macchiato", "A sweet, celebratory cup to match the smile."],
  ["happy", "Iced Caramel Latte", "Bright and fun, just like your mood."],
  ["sad", "Hot Chocolate Mocha", "Warm chocolate is a classic little comfort."],
  ["sad", "Chamomile Honey Latte", "Gentle, cosy and caffeine-free."],
  ["stressed", "Vanilla Latte", "Smooth and mellow, to help you slow down for a moment."],
  ["stressed", "Chamomile Honey Latte", "A soothing, caffeine-free pause."],
  ["angry", "Cold Brew", "Cool and smooth, to help you take the heat down a notch."],
  ["angry", "Chamomile Honey Latte", "A calming, caffeine-free breather."],
  ["tired", "Double Espresso", "Bold and concentrated for a quick lift."],
  ["tired", "Cold Brew", "Smooth, strong and long-lasting."],
  ["excited", "Iced Caramel Latte", "Cool, sweet and full of energy."],
  ["excited", "Caramel Macchiato", "A little treat to keep the good vibes going."],
  ["calm", "Classic Cappuccino", "Balanced and unhurried, for a peaceful moment."],
  ["calm", "Vanilla Latte", "Soft and smooth to keep things easy."],
  ["neutral", "Americano", "A clean, dependable cup that fits any moment."],
  ["neutral", "Classic Cappuccino", "A timeless favourite."],
];

const RULES: MoodRule[] = RULES_SPEC.map(([mood, name, reason], i) => ({
  id: `demo-rule-${i}`,
  shop_id: SHOP_ID,
  mood,
  menu_item_id: MENU.find((m) => m.name === name)!.id,
  rank: RULES_SPEC.slice(0, i).filter(([m]) => m === mood).length,
  reason,
}));

export const DEMO_SLUG = "demo";

export const DEMO_BUNDLE: ShopBundle = {
  demo: true,
  shop: {
    id: SHOP_ID,
    slug: DEMO_SLUG,
    name: "Coffie Mood Café",
    tagline: "Your Mood. Your Coffee. Your Moment.",
    welcome_message: null,
    logo_url: null,
    primary_color: "#6f4e37",
    accent_color: "#d9894a",
    currency: "USD",
    camera_enabled: true,
    is_published: true,
  },
  menu: MENU,
  rules: RULES,
  messages: [],
};
