"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui";
import { getBrowserSupabase } from "@/lib/supabase/client";

const inputClass =
  "mt-1.5 h-12 w-full rounded-xl bg-foam px-4 ring-1 ring-latte outline-none transition focus:ring-2 focus:ring-caramel";

/** Only allow same-site relative redirects. */
function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(params.get("error"));
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase isn't configured yet. Add your project keys to .env.local (see the README).");
      return;
    }
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace(next);
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
        });
        if (error) throw error;
        if (data.session) {
          router.replace("/dashboard");
          router.refresh();
        } else {
          setNotice("Almost there! Check your inbox and click the confirmation link to open your dashboard.");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="text-sm font-semibold text-mocha">Email</span>
        <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-mocha">Password</span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
        {mode === "signup" && <span className="mt-1 block text-xs text-coffee">At least 8 characters.</span>}
      </label>
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-xl bg-sand px-3 py-2 text-sm text-mocha">
          {notice}
        </p>
      )}
      <Button type="submit" variant="dark" size="lg" className="w-full" loading={loading}>
        {mode === "login" ? "Sign in" : "Create account"}
      </Button>
      <p className="text-center text-sm text-coffee">
        {mode === "login" ? (
          <>
            New to Coffie Mood?{" "}
            <Link href="/signup" className="font-semibold text-espresso underline underline-offset-2">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-espresso underline underline-offset-2">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
