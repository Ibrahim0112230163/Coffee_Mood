"use client";

import { Button } from "@/components/ui";

export default function ShopError({ retry }: { error: Error; retry: () => void }) {
  return (
    <main className="grain flex min-h-dvh flex-col items-center justify-center bg-cream px-6 text-center">
      <h1 className="font-display text-4xl font-semibold">Something spilled</h1>
      <p className="mt-3 max-w-sm text-coffee">We couldn&apos;t load this café&apos;s menu right now. Please try again in a moment.</p>
      <Button size="lg" className="mt-8" onClick={() => retry()}>
        Try again
      </Button>
    </main>
  );
}
