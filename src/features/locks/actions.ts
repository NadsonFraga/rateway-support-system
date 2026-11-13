"use server";

import { prisma } from "@/lib/db";
import { ROLES } from "@/features/auth/permissions";
import { currentMember } from "@/features/settings/server/guard";
import type { LockHolder } from "@/features/realtime/types";
import { acquireLock, releaseLock, takeOverLock } from "./service";

// Trava genérica de registros editáveis em modal (D-65, D-70): cliente, acesso do Cofre e serviço.
// Cada tipo de registro diz quem pode editar.
const EDITORS: Record<string, string[]> = {
  cliente: [ROLES.administrador, ROLES.analistaImplantacao],
  servico: [ROLES.administrador, ROLES.analistaImplantacao],
  acesso: [ROLES.administrador],
  // Os três perfis editam demandas (D-95).
  demanda: [ROLES.administrador, ROLES.analistaImplantacao, ROLES.operadorRotina],
};

export type LockResult = { ok: boolean; holder: LockHolder | null; error?: string };

export async function startEditingRecord(entityType: string, entityId: string): Promise<LockResult> {
  const user = await currentMember();
  if (!user) return { ok: false, holder: null, error: "Sua sessão expirou. Entre novamente." };
  if (!EDITORS[entityType]?.includes(user.role ?? "")) {
    return { ok: false, holder: null, error: "Você não tem permissão para editar." };
  }
  return acquireLock(prisma, entityType, entityId, user.id);
}

export async function stopEditingRecord(entityType: string, entityId: string) {
  const user = await currentMember();
  if (!user) return;
  await releaseLock(prisma, entityType, entityId, user.id);
}

/** Administrador assume a edição (as alterações não salvas de quem editava são descartadas). */
export async function takeOverRecord(entityType: string, entityId: string): Promise<LockResult> {
  const user = await currentMember();
  if (!user || user.role !== ROLES.administrador) return { ok: false, holder: null, error: "Só Administrador assume a edição." };
  const holder = await takeOverLock(prisma, entityType, entityId, user.id);
  return { ok: true, holder };
}

export async function currentHolder(entityType: string, entityId: string): Promise<LockHolder | null> {
  if (!(await currentMember())) return null;
  const lock = await prisma.editLock.findUnique({
    where: { entityType_entityId: { entityType, entityId } },
    select: { userId: true, acquiredAt: true, user: { select: { name: true } } },
  });
  return lock ? { userId: lock.userId, name: lock.user.name, acquiredAt: lock.acquiredAt.toISOString() } : null;
}
