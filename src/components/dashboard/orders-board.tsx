"use client";

import { ClipboardList, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { MOOD_META } from "@/lib/moods";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Order, OrderStatus } from "@/lib/types";
import { PageHeader } from "./fields";

const NEXT: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  new: { to: "preparing", label: "Start preparing" },
  preparing: { to: "ready", label: "Mark ready" },
  ready: { to: "completed", label: "Picked up" },
};

const STATUS_STYLE: Record<OrderStatus, string> = {
  new: "bg-ember text-white",
  preparing: "bg-honey text-espresso",
  ready: "bg-green-600 text-white",
  completed: "bg-sand text-mocha",
  cancelled: "bg-red-100 text-red-800",
};

const FILTERS = [
  { key: "active", label: "Active" },
  { key: "done", label: "Done" },
] as const;

export function OrdersBoard({ orders: initial }: { orders: Order[] }) {
  const router = useRouter();
  const [orders, setOrders] = useState(initial);
  const [filter, setFilter] = useState<"active" | "done">("active");
  const [error, setError] = useState<string | null>(null);
  const [refreshing, startRefresh] = useTransition();

  // eslint-disable-next-line react-hooks/set-state-in-effect -- sync with fresh server data after router.refresh()
  useEffect(() => setOrders(initial), [initial]);

  // Gentle polling so new orders appear without a manual reload.
  useEffect(() => {
    const id = setInterval(() => startRefresh(() => router.refresh()), 20000);
    return () => clearInterval(id);
  }, [router]);

  async function setStatus(order: Order, status: OrderStatus) {
    setError(null);
    setOrders((xs) => xs.map((o) => (o.id === order.id ? { ...o, status } : o)));
    const { error } = await getBrowserSupabase()!.from("orders").update({ status }).eq("id", order.id);
    if (error) {
      setError(error.message);
      setOrders((xs) => xs.map((o) => (o.id === order.id ? order : o)));
    }
  }

  const visible = orders.filter((o) => (filter === "active" ? ["new", "preparing", "ready"].includes(o.status) : ["completed", "cancelled"].includes(o.status)));

  return (
    <>
      <PageHeader
        title="Orders"
        description="Orders placed from your Coffie Mood page. Customers pay at the counter."
        action={
          <div className="flex items-center gap-2">
            <div className="flex rounded-full bg-foam p-1 ring-1 ring-latte">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${filter === f.key ? "bg-espresso text-foam" : "text-mocha hover:bg-sand"}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <Button size="sm" variant="secondary" onClick={() => startRefresh(() => router.refresh())} icon={<RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />}>
              Refresh
            </Button>
          </div>
        }
      />
      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {visible.length === 0 ? (
        <div className="rounded-3xl bg-foam p-10 text-center ring-1 ring-latte">
          <ClipboardList className="mx-auto size-10 text-caramel" />
          <p className="mt-4 font-display text-2xl font-semibold">{filter === "active" ? "No open orders" : "No finished orders yet"}</p>
          <p className="mt-2 text-coffee">New orders show up here automatically.</p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((o) => (
            <li key={o.id} className="flex flex-col rounded-3xl bg-foam p-5 ring-1 ring-latte">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-2xl font-semibold tracking-wide">#{o.order_code}</p>
                  <p className="text-sm text-coffee">
                    {o.customer_name || "Guest"} · {new Date(o.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    {o.mood && ` · ${MOOD_META[o.mood].emoji}`}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${STATUS_STYLE[o.status]}`}>{o.status}</span>
              </div>
              <ul className="mt-4 flex-1 space-y-1.5 text-sm">
                {o.items.map((l, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span>
                      <span className="font-semibold">{l.quantity}×</span> {l.name}{" "}
                      <span className="text-coffee">
                        ({l.size}, {l.temperature})
                      </span>
                    </span>
                    <span className="tabular-nums text-coffee">{formatPrice(l.unit_price * l.quantity, o.currency)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-latte/70 pt-3">
                <span className="font-semibold">{formatPrice(o.total, o.currency)}</span>
                <div className="flex gap-2">
                  {["new", "preparing"].includes(o.status) && (
                    <Button size="sm" variant="ghost" onClick={() => setStatus(o, "cancelled")}>
                      Cancel
                    </Button>
                  )}
                  {NEXT[o.status] && (
                    <Button size="sm" variant="dark" onClick={() => setStatus(o, NEXT[o.status]!.to)}>
                      {NEXT[o.status]!.label}
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
