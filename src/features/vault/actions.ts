"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { ROLES } from "@/features/auth/permissions";
import { CLIENTS_TOPIC } from "@/features/clients/topics";
import { holdsLock, releaseLock } from "@/features/locks/service";
import { publish } from "@/features/realtime/publish";
import { currentMember } from "@/features/settings/server/guard";
import type { SaveResult } from "@/features/settings/topics";
import { decryptSecret, encryptSecret, type EncryptedSecret } from "./crypto";

// Cofre de acessos (clientes-design-v2.md 04.5, seguranca-e-cofre.md, D-34 a D-37).
// Todos os perfis veem, revelam e copiam; só Administrador adiciona, edita e remove (D-36).
// Sem auditoria e sem limpeza da área de transferência (D-08, D-09).

export type CredentialRow = {
  id: string;
  catalogItemId: string;
  channelName: string;
  channelLogoUrl: string | null;
  label: string | null;
  propertyId: string | null;
  username: string;
  extranetUrl: string | null;
};

function topicFor(clientId: string) {
  return `cofre:${clientId}`;
}

/** Lista dos acessos do cliente: com o usuário, nunca com a senha. Ordem = ordem do catálogo. */
export async function listCredentials(clientId: string): Promise<CredentialRow[] | null> {
  if (!(await currentMember())) return null;
  const rows = await prisma.vaultCredential.findMany({
    where: { clientId },
    include: { catalogItem: { select: { name: true, logoUrl: true, extranetUrl: true, position: true, category: true } } },
  });
  const categoryOrder = ["canal", "channel_manager", "pms", "servico_interno"];
  return rows
    .sort(
      (a, b) =>
        categoryOrder.indexOf(a.catalogItem.category) - categoryOrder.indexOf(b.catalogItem.category) ||
        a.catalogItem.position - b.catalogItem.position ||
        (a.label ?? "").localeCompare(b.label ?? "")
    )
    .map((row) => ({
      id: row.id,
      catalogItemId: row.catalogItemId,
      channelName: row.catalogItem.name,
      channelLogoUrl: row.catalogItem.logoUrl,
      label: row.label,
      propertyId: row.propertyId,
      username: decryptSecret(row.username as unknown as EncryptedSecret),
      extranetUrl: row.extranetUrl ?? row.catalogItem.extranetUrl,
    }));
}

/** Senha em texto, só quando alguém clica para revelar ou copiar. */
export async function revealPassword(credentialId: string): Promise<string | null> {
  if (!(await currentMember())) return null;
  const row = await prisma.vaultCredential.findUnique({ where: { id: credentialId }, select: { password: true } });
  return row ? decryptSecret(row.password as unknown as EncryptedSecret) : null;
}

const credentialSchema = z.object({
  catalogItemId: z.string().min(1, "Escolha o canal."),
  label: z.string().trim().max(40),
  propertyId: z.string().trim().max(60),
  username: z.string().trim().min(1, "Informe o usuário.").max(200),
  /** Vazio ao editar = mantém a senha atual. */
  password: z.string().max(200),
  extranetUrl: z
    .string()
    .trim()
    .max(300)
    .refine((value) => value === "" || /^https:\/\/\S+$/i.test(value), "Use um endereço completo começando com https://"),
});

export type CredentialInput = z.input<typeof credentialSchema>;

/** Para o formulário de edição: dados atuais, sem a senha. */
export async function loadCredential(credentialId: string): Promise<(Omit<CredentialInput, "password"> & { id: string }) | null> {
  const user = await currentMember();
  if (!user || user.role !== ROLES.administrador) return null;
  const row = await prisma.vaultCredential.findUnique({ where: { id: credentialId } });
  if (!row) return null;
  return {
    id: row.id,
    catalogItemId: row.catalogItemId,
    label: row.label ?? "",
    propertyId: row.propertyId ?? "",
    username: decryptSecret(row.username as unknown as EncryptedSecret),
    extranetUrl: row.extranetUrl ?? "",
  };
}

export async function saveCredential(
  clientId: string,
  credentialId: string | null,
  input: CredentialInput
): Promise<SaveResult<null>> {
  const user = await currentMember();
  if (!user || user.role !== ROLES.administrador) return { ok: false, error: "Só o Administrador altera o Cofre." };
  const parsed = credentialSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  if (!credentialId && !parsed.data.password) return { ok: false, error: "Informe a senha." };
  if (credentialId && !(await holdsLock(prisma, "acesso", credentialId, user.id))) {
    return { ok: false, error: "Você não está mais editando. Outra pessoa assumiu ou a edição expirou." };
  }
  const channel = await prisma.catalogItem.findUnique({ where: { id: parsed.data.catalogItemId } });
  if (!channel) return { ok: false, error: "Canal não encontrado no catálogo." };

  const data = {
    catalogItemId: parsed.data.catalogItemId,
    label: parsed.data.label || null,
    propertyId: parsed.data.propertyId || null,
    username: encryptSecret(parsed.data.username),
    // A URL só é guardada quando difere da do catálogo; senão vale sempre a do catálogo.
    extranetUrl: parsed.data.extranetUrl && parsed.data.extranetUrl !== channel.extranetUrl ? parsed.data.extranetUrl : null,
    ...(parsed.data.password ? { password: encryptSecret(parsed.data.password) } : {}),
  };

  if (credentialId) {
    await prisma.vaultCredential.update({ where: { id: credentialId }, data });
    await releaseLock(prisma, "acesso", credentialId, user.id);
  } else {
    await prisma.vaultCredential.create({
      data: { ...data, clientId, password: encryptSecret(parsed.data.password) },
    });
  }
  await publish(prisma, topicFor(clientId), "cofre:salvo", {});
  await publish(prisma, CLIENTS_TOPIC, "cliente:salvo", { id: clientId });
  return { ok: true, value: null };
}

export async function deleteCredential(credentialId: string): Promise<SaveResult<null>> {
  const user = await currentMember();
  if (!user || user.role !== ROLES.administrador) return { ok: false, error: "Só o Administrador altera o Cofre." };
  const row = await prisma.vaultCredential.delete({ where: { id: credentialId }, select: { clientId: true } });
  await publish(prisma, topicFor(row.clientId), "cofre:salvo", {});
  return { ok: true, value: null };
}

/** Canais do catálogo (não arquivados) para o campo "Canal" do formulário. */
export async function listVaultChannels() {
  if (!(await currentMember())) return null;
  return prisma.catalogItem.findMany({
    where: { archivedAt: null },
    orderBy: [{ category: "asc" }, { position: "asc" }],
    select: { id: true, name: true, category: true, logoUrl: true, extranetUrl: true },
  });
}
