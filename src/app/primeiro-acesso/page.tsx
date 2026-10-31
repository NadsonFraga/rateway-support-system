import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/features/auth/components/auth-card";
import { FirstAccess } from "@/features/auth/components/first-access";
import { getSession } from "@/features/auth/session";
import { getInstanceIdentity } from "@/features/settings/instance";

export const metadata: Metadata = { title: "Primeiro acesso" };

export default async function Page() {
  const instance = await getInstanceIdentity();
  return (
    <AuthCard instance={instance}>
      <Suspense fallback={<div className="h-[360px] w-full rounded-2xl border border-line-subtle bg-surface" />}>
        <FirstAccessGate />
      </Suspense>
    </AuthCard>
  );
}

async function FirstAccessGate() {
  const session = await getSession();
  if (!session) redirect("/entrar");
  const { user } = session;
  if (!user.mustChangePassword && user.twoFactorEnabled) redirect("/");
  return <FirstAccess email={user.email} needsPassword={!!user.mustChangePassword} />;
}
