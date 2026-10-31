"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/features/auth/session";
import { isPastMaxAge } from "@/features/auth/session-policy";
import { ROLES } from "@/features/auth/permissions";
import { acquireLock, holdsLock, releaseLock, takeOverLock } from "@/features/locks/service";
import { publish } from "@/features/realtime/publish";
import { recordTopic, type LockHolder } from "@/features/realtime/types";

// Ações da tela de teste da Etapa 1.0: o mesmo ciclo Editar → Salvar/Esc que os módulos vão usar.
const ENTITY = "realtime_probe";
const ID = "teste";

async function currentUser() {
  // Tela de teste: não existe em produção.
  if (process.env.NODE_ENV === "production") return null;
  const session = await getSession();
  if (!session || isPastMaxAge(session.session.createdAt)) return null;
  if (session.user.mustChangePassword || !session.user.twoFactorEnabled) return null;
  return session.user;
}

export async function startEditing(): Promise<{ ok: boolean; holder: LockHolder | null }> {
  const user = await currentUser();
  if (!user) return { ok: false, holder: null };
  return acquireLock(prisma, ENTITY, ID, user.id);
}

export async function discardEditing() {
  const user = await currentUser();
  if (!user) return;
  await releaseLock(prisma, ENTITY, ID, user.id);
}

export async function takeOverEditing() {
  const user = await currentUser();
  if (!user || user.role !== ROLES.administrador) return { ok: false };
  await takeOverLock(prisma, ENTITY, ID, user.id);
  return { ok: true };
}

const textSchema = z.string().max(2000, "Texto muito longo para o teste (máximo 2.000 caracteres).");

export async function saveProbe(text: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Sua sessão expirou. Entre novamente." };

  const parsed = textSchema.safeParse(text);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  // Só quem tem a trava salva (D-65).
  if (!(await holdsLock(prisma, ENTITY, ID, user.id))) {
    return { ok: false, error: "Você não está mais editando. Outra pessoa assumiu ou a edição expirou." };
  }

  await prisma.$transaction(async (tx) => {
    const saved = await tx.realtimeProbe.upsert({
      where: { id: ID },
      update: { text: parsed.data, updatedById: user.id },
      create: { id: ID, text: parsed.data, updatedById: user.id },
    });
    await publish(tx, recordTopic(ENTITY, ID), "registro:salvo", {
      text: saved.text,
      updatedBy: user.name,
      updatedAt: saved.updatedAt.toISOString(),
    });
  });
  await releaseLock(prisma, ENTITY, ID, user.id);
  return { ok: true };
}
