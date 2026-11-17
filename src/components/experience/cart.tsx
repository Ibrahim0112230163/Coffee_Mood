"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { CoffeeImage } from "@/components/coffee-art";
import { Button } from "@/components/ui";
import { placeOrder, type CartLine, type PlacedOrder } from "@/lib/events";
import { formatPrice } from "@/lib/format";
import type { Mood } from "@/lib/types";

interface CartContextValue {
  lines: CartLine[];
  count: number;
  total: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (line: Omit<CartLine, "key" | "quantity">, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

export function CartProvider({ shopId, children }: { shopId: string; children: ReactNode }) {
  const storageKey = `coffie-mood:cart:${shopId}`;
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);

  // Restore the cart for this tab only (sessionStorage); it never leaves the device.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from browser storage
      if (saved) setLines(JSON.parse(saved));
    } catch {}
  }, [storageKey]);
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(lines));
    } catch {}
  }, [lines, storageKey]);

  const add = useCallback<CartContextValue["add"]>((line, quantity = 1) => {
    const key = `${line.menuItemId}|${line.size}|${line.temperature}`;
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) return prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(20, l.quantity + quantity) } : l));
      return [...prev, { ...line, key, quantity }];
    });
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setLines((prev) => (quantity <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(20, quantity) } : l))));
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      total: lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0),
      open,
      setOpen,
      add,
      setQuantity,
      clear: () => setLines([]),
    }),
    [lines, open, add, setQuantity],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function CartButton() {
  const { count, setOpen } = useCart();
  return (
    <button
      onClick={() => setOpen(true)}
      className="relative inline-flex size-11 items-center justify-center rounded-full bg-foam ring-1 ring-latte transition hover:ring-caramel"
      aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
    >
      <ShoppingBag className="size-5 text-mocha" />
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0.4 }}
            animate={{ scale: 1 }}
            className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-brand-accent text-[11px] font-bold text-white"
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

export function CartDrawer({
  shopId,
  demo,
  currency,
  mood,
  interactionId,
}: {
  shopId: string;
  demo: boolean;
  currency: string;
  mood: Mood | null;
  interactionId: string | null;
}) {
  const { lines, total, open, setOpen, setQuantity, clear } = useCart();
  const [name, setName] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  async function submit() {
    setPlacing(true);
    setError(null);
    try {
      const order = await placeOrder({ shopId, demo, lines, customerName: name.trim(), mood, interactionId });
      setPlaced(order);
      clear();
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't place your order. Please try again.");
    } finally {
      setPlacing(false);
    }
  }

  function close() {
    setOpen(false);
    if (placed) setTimeout(() => setPlaced(null), 300);
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Your order">
          <motion.div className="absolute inset-0 bg-espresso/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-cream shadow-lift"
          >
            <header className="flex items-center justify-between border-b border-latte px-6 py-5">
              <h2 className="font-display text-2xl font-semibold">{placed ? "Order placed" : "Your order"}</h2>
              <button onClick={close} className="rounded-full p-2 hover:bg-sand" aria-label="Close">
                <X className="size-5" />
              </button>
            </header>

            {placed ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}>
                  <CheckCircle2 className="size-16 text-brand-accent" />
                </motion.div>
                <p className="text-sm uppercase tracking-[0.2em] text-coffee">Order number</p>
                <p className="font-display text-5xl font-semibold tracking-wider">#{placed.orderCode}</p>
                <p className="text-coffee">
                  Total {formatPrice(placed.total, currency)}. Show this number at the counter and enjoy your moment.
                </p>
                {placed.demo && (
                  <p className="rounded-2xl bg-sand px-4 py-3 text-sm text-mocha">
                    This is the demo café, so the order wasn&apos;t sent anywhere.
                  </p>
                )}
                <Button onClick={close} className="mt-2">Done</Button>
              </div>
            ) : lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center text-coffee">
                <ShoppingBag className="size-10 opacity-60" />
                <p className="font-display text-xl text-espresso">Your cart is empty</p>
                <p className="text-sm">Find your mood and we&apos;ll find your coffee.</p>
              </div>
            ) : (
              <>
                <ul className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
                  {lines.map((l) => (
                    <li key={l.key} className="flex gap-3 rounded-2xl bg-foam p-3 ring-1 ring-latte/70">
                      <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-sand">
                        <CoffeeImage item={{ name: l.name, image_url: l.imageUrl }} temperature={l.temperature} className="size-full" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{l.name}</p>
                        <p className="text-sm text-coffee">
                          {l.size} · {l.temperature === "iced" ? "Iced" : "Hot"}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1 rounded-full bg-sand p-1">
                            <button className="rounded-full p-1 hover:bg-latte" onClick={() => setQuantity(l.key, l.quantity - 1)} aria-label={`Remove one ${l.name}`}>
                              {l.quantity === 1 ? <Trash2 className="size-3.5" /> : <Minus className="size-3.5" />}
                            </button>
                            <span className="w-6 text-center text-sm font-semibold">{l.quantity}</span>
                            <button className="rounded-full p-1 hover:bg-latte" onClick={() => setQuantity(l.key, l.quantity + 1)} aria-label={`Add one ${l.name}`}>
                              <Plus className="size-3.5" />
                            </button>
                          </div>
                          <span className="font-semibold">{formatPrice(l.unitPrice * l.quantity, currency)}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <footer className="space-y-4 border-t border-latte px-6 py-5">
                  <label className="block">
                    <span className="text-sm font-medium text-mocha">Name for the order (optional)</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={60}
                      placeholder="So the barista can call you"
                      className="mt-1.5 h-11 w-full rounded-xl bg-foam px-4 ring-1 ring-latte outline-none focus:ring-2 focus:ring-brand-accent"
                    />
                  </label>
                  <div className="flex items-center justify-between text-lg">
                    <span className="text-coffee">Total</span>
                    <span className="font-display text-2xl font-semibold">{formatPrice(total, currency)}</span>
                  </div>
                  {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
                  <Button size="lg" className="w-full" onClick={submit} loading={placing}>
                    Place order
                  </Button>
                  <p className="text-center text-xs text-coffee">Pay at the counter when you pick up.</p>
                </footer>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
