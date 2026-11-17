"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { selectShopAfterCreate } from "@/app/dashboard/actions";
import { Button } from "@/components/ui";
import { SLUG_PATTERN, slugify } from "@/lib/format";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Field, inputClass } from "./fields";

export function CreateShopForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [starter, setStarter] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveSlug = slugTouched ? slug : slugify(name);
  const slugValid = SLUG_PATTERN.test(effectiveSlug);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    if (!slugValid) {
      setError("The web address needs 3 to 48 lowercase letters, numbers or dashes.");
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.rpc("create_shop", {
      p_name: name.trim(),
      p_slug: effectiveSlug,
      p_with_starter_menu: starter,
    });
    if (error) {
      setLoading(false);
      setError(error.code === "23505" ? "That web address is taken. Try another one." : error.message);
      return;
    }
    await selectShopAfterCreate((data as { id: string }).id);
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field label="Café name">
        <input required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Urban Brews" />
      </Field>
      <Field label="Public web address" hint={`Customers will visit /shop/${effectiveSlug || "your-cafe"}`}>
        <div className="flex items-center rounded-xl bg-foam ring-1 ring-latte focus-within:ring-2 focus-within:ring-caramel">
          <span className="pl-4 text-sm text-coffee">/shop/</span>
          <input
            required
            value={effectiveSlug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
            }}
            className="h-11 min-w-0 flex-1 bg-transparent pr-4 outline-none"
            placeholder="urban-brews"
          />
        </div>
      </Field>
      <label className="flex items-start gap-3 rounded-2xl bg-sand/60 p-4">
        <input type="checkbox" checked={starter} onChange={(e) => setStarter(e.target.checked)} className="mt-1 size-4 accent-[#6f4e37]" />
        <span>
          <span className="block font-semibold">Start with our sample menu</span>
          <span className="text-sm text-coffee">Nine popular drinks with mood rules already set up. Edit or delete them anytime.</span>
        </span>
      </label>
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <Button type="submit" variant="dark" size="lg" className="w-full" loading={loading}>
        Create my café
      </Button>
    </form>
  );
}
