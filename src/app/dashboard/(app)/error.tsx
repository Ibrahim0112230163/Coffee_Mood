"use client";

import { Button } from "@/components/ui";

export default function DashboardError({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="rounded-3xl bg-foam p-10 text-center ring-1 ring-latte">
      <h1 className="font-display text-3xl font-semibold">Something went wrong</h1>
      <p className="mx-auto mt-2 max-w-md text-coffee">{error.message || "We couldn't load this page."}</p>
      <Button className="mt-6" variant="dark" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}
