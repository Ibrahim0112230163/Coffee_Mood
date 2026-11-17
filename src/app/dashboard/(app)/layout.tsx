import { ExternalLink, LogOut } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { BrandMark } from "@/components/brand";
import { DashboardNav } from "@/components/dashboard/nav";
import { SetupNotice } from "@/components/dashboard/setup-notice";
import { Spinner } from "@/components/ui";
import { getDashboardContext } from "@/lib/data/dashboard";
import { switchShop } from "../actions";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="min-h-dvh bg-cream">
      <Suspense fallback={<Spinner label="Opening your dashboard…" />}>
        <Frame>{children}</Frame>
      </Suspense>
    </div>
  );
}

async function Frame({ children }: { children: React.ReactNode }) {
  const ctx = await getDashboardContext();
  if (!ctx) return <SetupNotice />;
  const { current, memberships, email, canManage } = ctx;

  return (
    <div className="mx-auto flex max-w-7xl flex-col md:flex-row">
      <aside className="border-b border-latte bg-foam/70 p-4 md:sticky md:top-0 md:h-dvh md:w-64 md:shrink-0 md:border-b-0 md:border-r md:p-5">
        <div className="flex items-center justify-between md:block">
          <Link href="/dashboard">
            <BrandMark className="text-lg" />
          </Link>
          <form action="/auth/signout" method="post" className="md:hidden">
            <button className="rounded-full p-2 text-mocha hover:bg-sand" aria-label="Sign out">
              <LogOut className="size-5" />
            </button>
          </form>
        </div>

        <div className="my-4 rounded-2xl bg-sand/70 p-3 md:my-6">
          {memberships.length > 1 ? (
            <form action={switchShop} className="flex gap-2">
              <label className="sr-only" htmlFor="shop-switcher">
                Current shop
              </label>
              <select
                id="shop-switcher"
                name="shopId"
                defaultValue={current.shop.id}
                className="min-w-0 flex-1 rounded-lg bg-foam px-2 py-1.5 text-sm font-semibold ring-1 ring-latte"
              >
                {memberships.map((m) => (
                  <option key={m.shop.id} value={m.shop.id}>
                    {m.shop.name}
                  </option>
                ))}
              </select>
              <button className="rounded-lg bg-espresso px-2.5 text-xs font-semibold text-foam">Go</button>
            </form>
          ) : (
            <p className="truncate font-display text-lg font-semibold">{current.shop.name}</p>
          )}
          <div className="mt-2 flex items-center justify-between text-xs text-coffee">
            <span className="rounded-full bg-foam px-2 py-0.5 font-semibold capitalize">{current.role}</span>
            <Link href={`/shop/${current.shop.slug}`} target="_blank" className="inline-flex items-center gap-1 font-semibold hover:text-espresso">
              View live <ExternalLink className="size-3" />
            </Link>
          </div>
        </div>

        <DashboardNav canManage={canManage} />

        <div className="mt-6 hidden border-t border-latte pt-4 md:block">
          <p className="truncate text-xs text-coffee" title={email}>
            {email}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <Link href="/dashboard/new" className="text-xs font-semibold text-mocha hover:text-espresso">
              + New shop
            </Link>
            <form action="/auth/signout" method="post">
              <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-mocha hover:text-espresso">
                <LogOut className="size-3.5" /> Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 md:py-10">{children}</main>
    </div>
  );
}
