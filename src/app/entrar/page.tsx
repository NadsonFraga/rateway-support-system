import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthCard } from "@/features/auth/components/auth-card";
import { LoginForm } from "@/features/auth/components/login-form";
import { getInstanceIdentity } from "@/features/settings/instance";

export const metadata: Metadata = { title: "Entrar" };

export default async function Page() {
  const instance = await getInstanceIdentity();
  return (
    <AuthCard instance={instance}>
      <Suspense fallback={<div className="h-[318px] w-full rounded-2xl border border-line-subtle bg-surface" />}>
        <LoginForm instanceName={instance.name} />
      </Suspense>
    </AuthCard>
  );
}
