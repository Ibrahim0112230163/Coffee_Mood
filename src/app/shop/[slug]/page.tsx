import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Experience } from "@/components/experience/experience";
import { Spinner } from "@/components/ui";
import { getShopBundle } from "@/lib/data/shop";

export async function generateMetadata({ params }: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const bundle = await getShopBundle(slug).catch(() => null);
  if (!bundle) return { title: "Shop not found" };
  return {
    title: bundle.shop.name,
    description: `${bundle.shop.name} on Coffie Mood: let your mood choose your coffee.`,
  };
}

async function ShopExperience({ params }: { params: PageProps<"/shop/[slug]">["params"] }) {
  const { slug } = await params;
  const bundle = await getShopBundle(slug);
  if (!bundle) notFound();
  return <Experience bundle={bundle} />;
}

export default function ShopPage({ params }: PageProps<"/shop/[slug]">) {
  return (
    <Suspense
      fallback={
        <div className="grain flex min-h-dvh items-center justify-center bg-cream">
          <Spinner label="Brewing your experience…" />
        </div>
      }
    >
      <ShopExperience params={params} />
    </Suspense>
  );
}
