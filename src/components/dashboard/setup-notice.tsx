import { Database } from "lucide-react";
import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { buttonClass } from "@/components/ui";

/** Shown in demo mode, when Supabase environment variables are missing. */
export function SetupNotice() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <BrandMark className="text-xl" />
      <div className="mt-10 rounded-3xl bg-foam p-8 shadow-soft ring-1 ring-latte">
        <Database className="size-8 text-caramel" />
        <h1 className="mt-4 font-display text-3xl font-semibold">Connect Supabase to open the dashboard</h1>
        <p className="mt-3 text-coffee">
          The café dashboard stores menus, mood rules and analytics in Supabase. Add your project URL and publishable key to
          <code className="mx-1 rounded bg-sand px-1.5 py-0.5 text-sm">.env.local</code>, run the migration, and restart the dev server.
        </p>
        <pre className="mt-5 overflow-x-auto rounded-2xl bg-espresso p-4 text-sm text-latte">
{`NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`}
        </pre>
        <p className="mt-4 text-sm text-coffee">The README has the full setup steps. Meanwhile, the customer experience works with the demo café.</p>
        <Link href="/shop/demo" className={buttonClass("dark", "md", "mt-6")}>
          Open the demo café
        </Link>
      </div>
    </main>
  );
}
