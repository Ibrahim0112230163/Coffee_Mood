import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Create your café" };

export default function SignupPage() {
  return (
    <AuthShell title="Bring Coffie Mood to your café" subtitle="Create an account, then set up your shop in under a minute.">
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </AuthShell>
  );
}
