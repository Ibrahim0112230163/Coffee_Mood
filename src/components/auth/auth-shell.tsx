import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand";
import { CoffeeArt } from "@/components/coffee-art";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="grain grid min-h-dvh bg-cream md:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link href="/">
          <BrandMark className="text-xl" />
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="font-display text-4xl font-semibold tracking-tight">{title}</h1>
          <p className="mb-8 mt-2 text-coffee">{subtitle}</p>
          {children}
        </div>
      </div>
      <div className="relative hidden items-center justify-center overflow-hidden bg-espresso md:flex">
        <div className="absolute size-96 rounded-full bg-caramel/30 blur-3xl" aria-hidden />
        <div className="relative w-80 animate-float">
          <CoffeeArt kind="latte" className="w-full" />
        </div>
        <p className="absolute bottom-10 px-10 text-center font-display text-2xl italic text-latte">
          &ldquo;Detect. Understand. Recommend. Enjoy.&rdquo;
        </p>
      </div>
    </main>
  );
}
