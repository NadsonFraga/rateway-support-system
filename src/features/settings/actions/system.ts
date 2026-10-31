"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { publish } from "@/features/realtime/publish";
import { INSTANCE_CACHE_TAG } from "@/features/settings/instance";
import { CLIENT_CODE_MASKS } from "@/features/ids/masks";
import { currentAdmin, NOT_ALLOWED } from "../server/guard";
import { INSTANCE_TOPIC, settingsTopic, type SaveResult, type SettingsSection } from "../topics";

// Configurações do Sistema (configuracoes-design-v2.md §2). Toda ação confere se é Administrador.

const INSTANCE_ID = "instancia";

async function announce(section: SettingsSection, by: { id: string; name: string }) {
  await publish(prisma, settingsTopic(section), "secao:salva", { byId: by.id, byName: by.name });
}

const assetUrl = z
  .string()
  .regex(/^\/arquivos\/[a-z0-9]{20,40}$/)
  .nullable();

// ---- Identidade ----

export type IdentityValues = {
  name: string;
  logoDarkUrl: string | null;
  logoLightUrl: string | null;
  faviconUrl: string | null;
};

const identitySchema = z.object({
  name: z.string().trim().min(2, "O nome precisa ter pelo menos 2 caracteres.").max(60, "Use até 60 caracteres."),
  logoDarkUrl: assetUrl,
  logoLightUrl: assetUrl,
  faviconUrl: assetUrl,
});

export async function loadIdentity(): Promise<IdentityValues | null> {
  if (!(await currentAdmin())) return null;
  const settings = await prisma.instanceSettings.findUnique({ where: { id: INSTANCE_ID } });
  return {
    name: settings?.name ?? "",
    logoDarkUrl: settings?.logoDarkUrl ?? null,
    logoLightUrl: settings?.logoLightUrl ?? null,
    faviconUrl: settings?.faviconUrl ?? null,
  };
}

export async function saveIdentity(input: IdentityValues): Promise<SaveResult<IdentityValues>> {
  const admin = await currentAdmin();
  if (!admin) return NOT_ALLOWED;
  const parsed = identitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  await prisma.instanceSettings.upsert({
    where: { id: INSTANCE_ID },
    update: parsed.data,
    create: { id: INSTANCE_ID, ...parsed.data },
  });
  // Login, barra superior e aba do navegador passam a mostrar o nome novo na hora.
  updateTag(INSTANCE_CACHE_TAG);
  await announce("identidade", admin);
  await publish(prisma, INSTANCE_TOPIC, "instancia:salva", {});
  return { ok: true, value: parsed.data };
}

// ---- Identificadores ----

export type IdentifierValues = { clientCodeMask: string; ignoredWords: string[]; demandPrefix: string };

const identifierSchema = z.object({
  clientCodeMask: z.enum(CLIENT_CODE_MASKS, { message: "Escolha uma das máscaras da lista." }),
  ignoredWords: z
    .array(z.string().trim().min(1).max(30))
    .max(40, "Use até 40 palavras.")
    .transform((words) => [...new Set(words)]),
  demandPrefix: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2,5}$/, "O prefixo precisa ter de 2 a 5 letras, sem acento."),
});

export async function loadIdentifiers(): Promise<(IdentifierValues & { nextDemandNumber: number }) | null> {
  if (!(await currentAdmin())) return null;
  const [settings, sequence] = await Promise.all([
    prisma.instanceSettings.findUnique({ where: { id: INSTANCE_ID } }),
    prisma.idSequence.findUnique({ where: { entityType_scope: { entityType: "demanda", scope: "global" } } }),
  ]);
  return {
    clientCodeMask: settings?.clientCodeMask ?? CLIENT_CODE_MASKS[0],
    ignoredWords: settings?.ignoredWords ?? [],
    demandPrefix: settings?.demandPrefix ?? "DEM",
    nextDemandNumber: (sequence?.lastValue ?? 0) + 1,
  };
}

export async function saveIdentifiers(input: IdentifierValues): Promise<SaveResult<IdentifierValues>> {
  const admin = await currentAdmin();
  if (!admin) return NOT_ALLOWED;
  const parsed = identifierSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  await prisma.instanceSettings.update({ where: { id: INSTANCE_ID }, data: parsed.data });
  await announce("identificadores", admin);
  return { ok: true, value: parsed.data };
}

// ---- Serviços ----

export type ServiceValue = { id: string; name: string; kind: "pontual" | "continuo"; phases: string[] };

export async function loadServices(): Promise<ServiceValue[] | null> {
  if (!(await currentAdmin())) return null;
  const services = await prisma.service.findMany({ orderBy: { position: "asc" } });
  return services.map((service) => ({
    id: service.id,
    name: service.name,
    kind: service.kind as ServiceValue["kind"],
    phases: service.phases,
  }));
}

const servicesSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string().trim().min(2, "O nome do serviço precisa ter pelo menos 2 caracteres.").max(40, "Use até 40 caracteres."),
  })
);

/** Só o nome muda; tipo e fases são regras do produto na Fase 1. */
export async function saveServices(input: ServiceValue[]): Promise<SaveResult<ServiceValue[]>> {
  const admin = await currentAdmin();
  if (!admin) return NOT_ALLOWED;
  const parsed = servicesSchema.safeParse(input.map(({ id, name }) => ({ id, name })));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  await prisma.$transaction(
    parsed.data.map((service) => prisma.service.update({ where: { id: service.id }, data: { name: service.name } }))
  );
  await announce("servicos", admin);
  return { ok: true, value: (await loadServices()) ?? [] };
}

// ---- Mensagens ----

export type MessageValues = { template: string };

export async function loadMessages(): Promise<(MessageValues & { instanceName: string }) | null> {
  if (!(await currentAdmin())) return null;
  const settings = await prisma.instanceSettings.findUnique({ where: { id: INSTANCE_ID } });
  return { template: settings?.billingMessageTemplate ?? "", instanceName: settings?.name ?? "" };
}

export async function saveMessages(input: MessageValues): Promise<SaveResult<MessageValues>> {
  const admin = await currentAdmin();
  if (!admin) return NOT_ALLOWED;
  const parsed = z
    .object({ template: z.string().trim().min(10, "A mensagem está curta demais.").max(1000, "Use até 1.000 caracteres.") })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  await prisma.instanceSettings.update({
    where: { id: INSTANCE_ID },
    data: { billingMessageTemplate: parsed.data.template },
  });
  await announce("mensagens", admin);
  return { ok: true, value: parsed.data };
}
