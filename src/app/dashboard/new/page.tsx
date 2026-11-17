import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BrandMark } from "@/components/brand";
import { CreateShopForm } from "@/components/dashboard/create-shop-form";
import { SetupNotice } from "@/components/dashboard/setup-notice";
import { Spinner } from "@/components/ui";
import { getSessionMemberships } from "@/lib/data/dashboard";

export const metadata: Metadata = { title: "Create your café" };

export default function NewShopPage() {
  return (
    <main className="grain min-h-dvh bg-cream px-4 py-8 sm:px-6">
      <Suspense fallback={<Spinner />}>
        <NewShop />
      </Suspense>
    </main>
  );
}

async function NewShop() {
  const session = await getSessionMemberships();
  if (!session) return <SetupNotice />;
  const first = session.memberships.length === 0;

  return (
    <div className="mx-auto max-w-lg">
      <div className="flex items-center justify-between">
        <BrandMark className="text-xl" />
        {!first && (
          <Link href="/dashboard" className="text-sm font-semibold text-mocha hover:text-espresso">
            Back to dashboard
          </Link>
        )}
      </div>
      <h1 className="mt-12 font-display text-4xl font-semibold tracking-tight">
        {first ? "Let's set up your café" : "Add another café"}
      </h1>
      <p className="mt-2 text-coffee">You can change everything later: branding, menu, prices and mood rules.</p>
      <div className="mt-8 rounded-3xl bg-foam p-6 shadow-soft ring-1 ring-latte sm:p-8">
        <CreateShopForm />
      </div>
    </div>
  );
}
