import { Camera, CheckCircle2, Hand, Receipt, RefreshCcw, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BarList, DailyBars, StatCard } from "@/components/dashboard/stats";
import { PageHeader } from "@/components/dashboard/fields";
import { ShareCard } from "@/components/dashboard/share-card";
import { getDashboardContext } from "@/lib/data/dashboard";
import { formatPrice } from "@/lib/format";
import { MOOD_META } from "@/lib/moods";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { ShopAnalytics } from "@/lib/types";

export const metadata: Metadata = { title: "Overview" };

const PERIODS = [7, 30, 90] as const;

const pct = (n: number, d: number) => (d > 0 ? `${Math.round((n / d) * 100)}%` : "–");

export default async function OverviewPage({ searchParams }: PageProps<"/dashboard">) {
  const ctx = await getDashboardContext();
  if (!ctx) return null;
  const { days: rawDays } = await searchParams;
  const days = PERIODS.find((p) => String(p) === rawDays) ?? 30;
  const { shop } = ctx.current;

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc("get_shop_analytics", { p_shop_id: shop.id, p_days: days });
  if (error) throw new Error(`Could not load analytics: ${error.message}`);
  const a = data as ShopAnalytics;

  return (
    <>
      <PageHeader
        title={`Good to see you`}
        description={`Here's how customers at ${shop.name} have been using Coffie Mood.`}
        action={
          <div className="flex rounded-full bg-foam p-1 ring-1 ring-latte" role="tablist" aria-label="Time period">
            {PERIODS.map((p) => (
              <Link
                key={p}
                href={`/dashboard?days=${p}`}
                aria-selected={p === days}
                role="tab"
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${p === days ? "bg-espresso text-foam" : "text-mocha hover:bg-sand"}`}
              >
                {p}d
              </Link>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Customer interactions" value={a.total_interactions.toLocaleString()} hint={`Last ${days} days`} />
        <StatCard
          icon={CheckCircle2}
          label="Recommendation acceptance"
          value={pct(a.accepted, a.total_interactions)}
          hint={`${a.accepted} of ${a.total_interactions} said "Sounds perfect"`}
        />
        <StatCard icon={Camera} label="Used the camera" value={pct(a.camera_interactions, a.total_interactions)} hint={`${a.manual_interactions} picked their mood by hand`} />
        <StatCard icon={Receipt} label="Orders" value={a.orders.toLocaleString()} hint={`${formatPrice(Number(a.revenue), shop.currency)} in orders`} />
      </div>

      {a.total_interactions === 0 ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-3xl bg-foam p-8 ring-1 ring-latte">
            <Hand className="size-8 text-caramel" />
            <h2 className="mt-4 font-display text-2xl font-semibold">No customer interactions yet</h2>
            <p className="mt-2 text-coffee">
              Share your café&apos;s link or print the QR code for your counter. Stats appear here as soon as customers find their mood.
            </p>
          </div>
          <ShareCard slug={shop.slug} name={shop.name} />
        </div>
      ) : (
        <>
          <div className="mt-6 rounded-3xl bg-foam p-6 ring-1 ring-latte">
            <h2 className="font-display text-xl font-semibold">Daily interactions</h2>
            <DailyBars data={a.daily} />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <BarList
              title="Most detected expressions"
              empty="No camera detections yet."
              items={a.detected_moods.map((m) => ({ label: `${MOOD_META[m.mood].emoji} ${MOOD_META[m.mood].label}`, count: m.count }))}
              footer={
                a.camera_interactions > 0 ? (
                  <span className="inline-flex items-center gap-1.5">
                    <RefreshCcw className="size-3.5" /> Customers corrected the suggested mood {pct(a.corrected, a.camera_interactions)} of the time.
                  </span>
                ) : null
              }
            />
            <BarList title="Most recommended coffees" empty="No recommendations yet." items={a.top_recommended.map((r) => ({ label: r.name, count: r.count }))} />
            <BarList title="Most popular selections" empty="No accepted picks yet." items={a.top_selected.map((r) => ({ label: r.name, count: r.count }))} />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
            <BarList
              title="Confirmed moods"
              empty="No moods yet."
              items={a.confirmed_moods.map((m) => ({ label: `${MOOD_META[m.mood].emoji} ${MOOD_META[m.mood].label}`, count: m.count }))}
            />
            <ShareCard slug={shop.slug} name={shop.name} />
          </div>
        </>
      )}
    </>
  );
}
