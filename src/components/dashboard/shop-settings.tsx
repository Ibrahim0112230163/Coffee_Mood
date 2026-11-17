"use client";

import { CupSoda, ImagePlus, Trash2, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui";
import { contrastText, SLUG_PATTERN } from "@/lib/format";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { MemberRole, Shop } from "@/lib/types";
import { uploadShopImage } from "@/lib/upload";
import { Field, inputClass, textareaClass } from "./fields";

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "INR", "JPY", "SGD", "AED", "BRL", "MXN", "ZAR", "NZD", "CHF", "SEK"];

function Section({ title, children, description }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-foam p-6 ring-1 ring-latte">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-coffee">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl bg-cream p-4 ring-1 ring-latte/70">
      <span>
        <span className="block font-semibold">{label}</span>
        <span className="text-sm text-coffee">{hint}</span>
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className="relative mt-1 h-6 w-11 shrink-0 rounded-full bg-latte transition peer-checked:bg-espresso peer-focus-visible:ring-2 peer-focus-visible:ring-caramel after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" />
    </label>
  );
}

export function ShopSettingsForm({ shop }: { shop: Shop }) {
  const router = useRouter();
  const [form, setForm] = useState(shop);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof Shop>(k: K, v: Shop[K]) => {
    setStatus(null);
    setForm((f) => ({ ...f, [k]: v }));
  };

  async function onLogo(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      set("logo_url", await uploadShopImage(shop.id, file, "logo"));
    } catch (e) {
      setStatus({ ok: false, text: e instanceof Error ? e.message : "Upload failed." });
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!SLUG_PATTERN.test(form.slug)) return setStatus({ ok: false, text: "The web address needs 3 to 48 lowercase letters, numbers or dashes." });
    setSaving(true);
    const { error } = await getBrowserSupabase()!
      .from("shops")
      .update({
        name: form.name.trim(),
        slug: form.slug,
        tagline: form.tagline?.trim() || null,
        welcome_message: form.welcome_message?.trim() || null,
        logo_url: form.logo_url,
        primary_color: form.primary_color,
        accent_color: form.accent_color,
        currency: form.currency,
        camera_enabled: form.camera_enabled,
        is_published: form.is_published,
      })
      .eq("id", shop.id);
    setSaving(false);
    if (error) {
      return setStatus({ ok: false, text: error.code === "23505" ? "That web address is already taken." : error.message });
    }
    setStatus({ ok: true, text: "Settings saved." });
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Section title="Branding" description="How your café looks to customers.">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              {form.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- tenant logo from storage
                <img src={form.logo_url} alt="Shop logo" className="size-20 rounded-full object-cover ring-1 ring-latte" />
              ) : (
                <span className="flex size-20 items-center justify-center rounded-full" style={{ background: form.primary_color, color: contrastText(form.primary_color) }}>
                  <CupSoda className="size-8" />
                </span>
              )}
              {form.logo_url && (
                <button type="button" onClick={() => set("logo_url", null)} className="absolute -right-1 -top-1 rounded-full bg-foam p-1 shadow-soft ring-1 ring-latte" aria-label="Remove logo">
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => onLogo(e.target.files?.[0])} />
            <Button type="button" size="sm" variant="secondary" loading={uploading} icon={<ImagePlus className="size-4" />} onClick={() => fileRef.current?.click()}>
              {form.logo_url ? "Replace logo" : "Upload logo"}
            </Button>
          </div>

          <Field label="Café name">
            <input required minLength={2} maxLength={80} value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Tagline">
            <input maxLength={140} value={form.tagline ?? ""} onChange={(e) => set("tagline", e.target.value)} className={inputClass} placeholder="Slow mornings, warm cups." />
          </Field>
          <Field label="Welcome message" hint="Shown under the headline on your welcome screen.">
            <textarea maxLength={280} rows={2} value={form.welcome_message ?? ""} onChange={(e) => set("welcome_message", e.target.value)} className={textareaClass} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            {(
              [
                ["primary_color", "Primary colour"],
                ["accent_color", "Accent colour"],
              ] as const
            ).map(([key, label]) => (
              <Field key={key} label={label}>
                <div className="flex h-11 items-center gap-2 rounded-xl bg-foam px-2 ring-1 ring-latte">
                  <input type="color" value={form[key]} onChange={(e) => set(key, e.target.value)} className="size-8 cursor-pointer rounded-lg border-0 bg-transparent" aria-label={label} />
                  <input
                    value={form[key]}
                    onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && set(key, e.target.value)}
                    className="min-w-0 flex-1 bg-transparent font-mono text-sm outline-none"
                    aria-label={`${label} hex`}
                  />
                </div>
              </Field>
            ))}
            <Field label="Currency">
              <select value={form.currency} onChange={(e) => set("currency", e.target.value)} className={inputClass}>
                {CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-cream p-4 ring-1 ring-latte/70">
            <span className="rounded-full px-4 py-2 text-sm font-semibold" style={{ background: form.primary_color, color: contrastText(form.primary_color) }}>
              Discover My Mood
            </span>
            <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: form.accent_color }}>
              Accent
            </span>
            <span className="text-xs text-coffee">Preview</span>
          </div>
        </div>
      </Section>

      <Section title="Public page">
        <div className="space-y-4">
          <Field label="Web address" hint="Changing this breaks links and QR codes you've already printed.">
            <div className="flex items-center rounded-xl bg-foam ring-1 ring-latte focus-within:ring-2 focus-within:ring-caramel">
              <span className="pl-4 text-sm text-coffee">/shop/</span>
              <input
                required
                value={form.slug}
                onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="h-11 min-w-0 flex-1 bg-transparent pr-4 outline-none"
              />
            </div>
          </Field>
          <Toggle checked={form.is_published} onChange={(v) => set("is_published", v)} label="Published" hint="When off, your public page shows 'not found' and accepts no orders." />
          <Toggle checked={form.camera_enabled} onChange={(v) => set("camera_enabled", v)} label="Camera mood detection" hint="Turn off to let customers pick their mood by hand only." />
        </div>
      </Section>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="dark" loading={saving} disabled={uploading}>
          Save settings
        </Button>
        {status && (
          <p role="status" className={`text-sm font-semibold ${status.ok ? "text-green-700" : "text-red-700"}`}>
            {status.text}
          </p>
        )}
      </div>
    </form>
  );
}

export interface TeamMember {
  user_id: string;
  email: string;
  role: MemberRole;
}

export function TeamManager({ shopId, isOwner, currentUserId, members }: { shopId: string; isOwner: boolean; currentUserId: string; members: TeamMember[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("staff");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = () => getBrowserSupabase()!;

  async function add(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase().rpc("add_shop_member", { p_shop_id: shopId, p_email: email, p_role: role });
    setBusy(false);
    if (error) return setError(error.message);
    setEmail("");
    router.refresh();
  }

  async function changeRole(userId: string, next: MemberRole) {
    const { error } = await supabase().from("shop_members").update({ role: next }).eq("shop_id", shopId).eq("user_id", userId);
    if (error) return setError(error.message);
    router.refresh();
  }

  async function removeMember(m: TeamMember) {
    if (!confirm(`Remove ${m.email} from this café?`)) return;
    const { error } = await supabase().from("shop_members").delete().eq("shop_id", shopId).eq("user_id", m.user_id);
    if (error) return setError(error.message);
    router.refresh();
  }

  return (
    <Section title="Team" description="Owners manage everything. Managers edit menu, moods and settings. Staff see stats and orders.">
      <ul className="space-y-2">
        {members.map((m) => (
          <li key={m.user_id} className="flex items-center justify-between gap-3 rounded-2xl bg-cream px-4 py-2.5 ring-1 ring-latte/70">
            <span className="min-w-0 truncate text-sm font-medium">
              {m.email} {m.user_id === currentUserId && <span className="text-coffee">(you)</span>}
            </span>
            {isOwner && m.user_id !== currentUserId ? (
              <span className="flex shrink-0 items-center gap-1">
                <select value={m.role} onChange={(e) => changeRole(m.user_id, e.target.value as MemberRole)} className="rounded-lg bg-foam px-2 py-1 text-xs font-semibold ring-1 ring-latte" aria-label={`Role for ${m.email}`}>
                  <option value="owner">Owner</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                </select>
                <button onClick={() => removeMember(m)} className="rounded-full p-1.5 text-red-700 hover:bg-red-50" aria-label={`Remove ${m.email}`}>
                  <Trash2 className="size-4" />
                </button>
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-sand px-2.5 py-0.5 text-xs font-semibold capitalize">{m.role}</span>
            )}
          </li>
        ))}
      </ul>
      {isOwner && (
        <form onSubmit={add} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@example.com" className={inputClass} aria-label="Teammate email" />
          <select value={role} onChange={(e) => setRole(e.target.value as MemberRole)} className={`${inputClass} sm:w-32`} aria-label="Role">
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
            <option value="owner">Owner</option>
          </select>
          <Button type="submit" variant="dark" loading={busy} icon={<UserPlus className="size-4" />}>
            Add
          </Button>
        </form>
      )}
      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </Section>
  );
}

export function DangerZone({ shopId, shopName }: { shopId: string; shopName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function del() {
    const typed = prompt(`This permanently deletes ${shopName}, its menu, mood rules, stats and orders.\n\nType the café name to confirm:`);
    if (typed?.trim() !== shopName) return;
    setBusy(true);
    const { error } = await getBrowserSupabase()!.from("shops").delete().eq("id", shopId);
    setBusy(false);
    if (error) return setError(error.message);
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <section className="rounded-3xl bg-red-50/60 p-6 ring-1 ring-red-200">
      <h2 className="font-display text-xl font-semibold text-red-900">Delete café</h2>
      <p className="mt-1 text-sm text-red-800">Permanently remove this café and all of its data. This can&apos;t be undone.</p>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <Button variant="danger" className="mt-4" onClick={del} loading={busy} icon={<Trash2 className="size-4" />}>
        Delete café
      </Button>
    </section>
  );
}
