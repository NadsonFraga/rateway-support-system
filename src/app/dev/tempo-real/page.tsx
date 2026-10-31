import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/features/auth/session";
import { prisma } from "@/lib/db";
import { ProbeEditor } from "./probe-editor";

export const metadata: Metadata = { title: "Teste de tempo real" };

export default function Page() {
  return (
    <main className="flex min-h-screen items-start justify-center bg-canvas px-6 py-12">
      <Suspense fallback={<Skeleton className="h-80 w-full max-w-2xl rounded-2xl" />}>
        <ProbeLoader />
      </Suspense>
    </main>
  );
}

async function ProbeLoader() {
  const user = await requireUser();
  const [probe, lock] = await Promise.all([
    prisma.realtimeProbe.findUnique({ where: { id: "teste" } }),
    prisma.editLock.findUnique({
      where: { entityType_entityId: { entityType: "realtime_probe", entityId: "teste" } },
      select: { userId: true, acquiredAt: true, user: { select: { name: true } } },
    }),
  ]);
  return (
    <ProbeEditor
      currentUser={user}
      initialText={probe?.text ?? ""}
      initialHolder={
        lock ? { userId: lock.userId, name: lock.user.name, acquiredAt: lock.acquiredAt.toISOString() } : null
      }
    />
  );
}
