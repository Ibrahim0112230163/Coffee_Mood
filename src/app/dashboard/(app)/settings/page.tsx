import type { Metadata } from "next";
import { ReadOnlyNotice } from "@/components/dashboard/fields";
import { PageHeader } from "@/components/dashboard/fields";
import { ShareCard } from "@/components/dashboard/share-card";
import { DangerZone, ShopSettingsForm, TeamManager, type TeamMember } from "@/components/dashboard/shop-settings";
import { getDashboardContext } from "@/lib/data/dashboard";
import { createSupabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Shop settings" };

export default async function SettingsPage() {
  const ctx = await getDashboardContext();
  if (!ctx) return null;
  if (!ctx.canManage) return <ReadOnlyNotice />;
  const { shop, role } = ctx.current;

  const supabase = await createSupabaseServer();
  const { data: members, error } = await supabase.rpc("list_shop_members", { p_shop_id: shop.id });
  if (error) throw new Error(`Could not load team: ${error.message}`);

  return (
    <>
      <PageHeader title="Shop settings" description="Branding, public link and team for this café." />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <ShopSettingsForm key={shop.id} shop={shop} />
        <div className="space-y-6">
          <ShareCard slug={shop.slug} name={shop.name} large />
          <TeamManager shopId={shop.id} isOwner={role === "owner"} currentUserId={ctx.userId} members={(members ?? []) as TeamMember[]} />
          {role === "owner" && <DangerZone shopId={shop.id} shopName={shop.name} />}
        </div>
      </div>
    </>
  );
}
