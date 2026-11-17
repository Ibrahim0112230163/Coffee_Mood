import Link from "next/link";
import { CoffeeArt } from "@/components/coffee-art";
import { buttonClass } from "@/components/ui";

export default function ShopNotFound() {
  return (
    <main className="grain flex min-h-dvh flex-col items-center justify-center bg-cream px-6 text-center">
      <CoffeeArt kind="espresso" className="w-40" steam={false} />
      <h1 className="mt-6 font-display text-4xl font-semibold">We couldn&apos;t find that café</h1>
      <p className="mt-3 max-w-sm text-coffee">The link may be mistyped, or the café may have paused its Coffie Mood experience.</p>
      <Link href="/shop/demo" className={buttonClass("primary", "lg", "mt-8")}>
        Try the demo café
      </Link>
    </main>
  );
}
