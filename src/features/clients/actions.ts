"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { ROLES } from "@/features/auth/permissions";
import { nextClientCode } from "@/features/ids/generator";
import { applyMask, parseCodeQuery, suggestClientCode, validateClientCode } from "@/features/ids/masks";
import { holdsLock, releaseLock } from "@/features/locks/service";
import { publish } from "@/features/realtime/publish";
import { currentMember } from "@/features/settings/server/guard";
import type { SaveResult } from "@/features/settings/topics";
import { billingProblem, clientStatus, hireProblem, phaseProblem } from "./rules";
import { CLIENTS_TOPIC } from "./topics";
import type { ClientDetail, ClientFields, ClientServiceView, ClientSummary, NewServiceInput } from "./types";
import { isGroupLink, isValidPhone, normalizePhone } from "./whatsapp";

// Clientes (clientes-design-v2.md, D-14 a D-40, D-90 a D-93).

const EDITORS: string[] = [ROLES.administrador, ROLES.analistaImplantacao];

const clientInclude = {
  services: { include: { service: true }, orderBy: { startedAt: "asc" as const } },
  channelManager: { select: { id: true, name: true, logoUrl: true } },
  pms: { select: { id: true, name: true, logoUrl: true } },
  _count: { select: { credentials: true, demands: { where: { status: { notIn: ["concluida", "cancelada"] } } } } },
};

type ClientRow = NonNullable<Awaited<ReturnType<typeof findClient>>>;

function findClient(where: { id: string } | { displayCode: string }) {
  return prisma.client.findUnique({ where, include: clientInclude });
}

function toServiceView(item: ClientRow["services"][number]): ClientServiceView {
  return {
    id: item.id,
    serviceId: item.serviceId,
    serviceName: item.service.name,
    kind: item.service.kind as ClientServiceView["kind"],
    phase: item.phase,
    phases: item.service.phases,
    billingDay: item.billingDay,
    dueDate: item.dueDate ? item.dueDate.toISOString().slice(0, 10) : null,
  };
}

function toSummary(row: ClientRow): ClientSummary {
  return {
    id: row.id,
    code: row.displayCode,
    name: row.name,
    logoUrl: row.logoUrl,
    city: row.city,
    state: row.state,
    status: clientStatus(row.services.map((item) => item.phase)),
    services: row.services.map((item) => ({ serviceId: item.serviceId, name: item.service.name, phase: item.phase })),
    channelManager: row.channelManager,
    pms: row.pms,
    openDemands: row._count.demands,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toDetail(row: ClientRow): ClientDetail {
  return {
    ...toSummary(row),
    services: row.services.map(toServiceView),
    sigla: row.sigla,
    website: row.website ?? "",
    channelManagerId: row.channelManagerId,
    pmsId: row.pmsId,
    contactType: (row.contactType as ClientFields["contactType"]) ?? null,
    contactName: row.contactName ?? "",
    contactPhone: row.contactPhone ?? "",
    contactLink: row.contactLink ?? "",
    financeName: row.financeName ?? "",
    financePhone: row.financePhone ?? "",
    notice: row.notice ?? "",
    city: row.city ?? "",
    state: row.state ?? "",
    hasCredentials: row._count.credentials > 0,
  };
}

async function announce(clientId: string, code: string) {
  await publish(prisma, CLIENTS_TOPIC, "cliente:salvo", { id: clientId, code });
}

// ---- Leitura (todos os perfis) ----

export async function listClients(): Promise<ClientSummary[] | null> {
  if (!(await currentMember())) return null;
  const rows = await prisma.client.findMany({ include: clientInclude, orderBy: { name: "asc" } });
  return rows.map(toSummary);
}

export async function getClient(code: string): Promise<ClientDetail | null> {
  if (!(await currentMember())) return null;
  const row = await findClient({ displayCode: code.toUpperCase() });
  return row ? toDetail(row) : null;
}

/** Busca por nome ou código para o Ctrl+K: aceita com ou sem # e sem zeros (hfi1 → HFI-001). */
export async function searchClients(query: string): Promise<{ code: string; name: string; logoUrl: string | null }[]> {
  if (!(await currentMember())) return [];
  const text = query.trim();
  if (text.length < 2) return [];
  const parsed = parseCodeQuery(text);
  const rows = await prisma.client.findMany({
    where: { OR: [{ name: { contains: text, mode: "insensitive" } }, { displayCode: { startsWith: text.replace(/^#/, "").toUpperCase() } }] },
    select: { displayCode: true, name: true, logoUrl: true },
    take: 20,
    orderBy: { name: "asc" },
  });
  const byCode = parsed
    ? await prisma.client.findMany({
        where: { sigla: parsed.letters || undefined },
        select: { displayCode: true, name: true, logoUrl: true },
        take: 50,
      })
    : [];
  const codeMatches = byCode.filter((row) => Number(row.displayCode.replace(/\D/g, "")) === parsed?.number);
  const seen = new Set<string>();
  return [...codeMatches, ...rows]
    .filter((row) => (seen.has(row.displayCode) ? false : (seen.add(row.displayCode), true)))
    .slice(0, 8)
    .map((row) => ({ code: row.displayCode, name: row.name, logoUrl: row.logoUrl }));
}

/** Sigla sugerida pelo nome e prévia do código que será gerado. */
export async function suggestCode(name: string): Promise<{ sigla: string; preview: string } | null> {
  if (!(await currentMember())) return null;
  const settings = await prisma.instanceSettings.findFirst();
  const sigla = suggestClientCode(name, settings?.ignoredWords ?? []);
  return { sigla, preview: await previewCode(sigla, settings?.clientCodeMask ?? "{SIGLA}-{SEQ:3}") };
}

async function previewCode(sigla: string, mask: string) {
  const sequence = await prisma.idSequence.findUnique({ where: { entityType_scope: { entityType: "cliente", scope: sigla } } });
  return applyMask(mask, { sigla, seq: (sequence?.lastValue ?? 0) + 1 }, () => 0);
}

export async function previewClientCode(sigla: string): Promise<string | null> {
  if (!(await currentMember())) return null;
  const settings = await prisma.instanceSettings.findFirst();
  return previewCode(sigla.toUpperCase(), settings?.clientCodeMask ?? "{SIGLA}-{SEQ:3}");
}

// ---- Validação dos campos ----

const optionalText = (max: number) => z.string().trim().max(max);

const fieldsSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome fantasia.").max(120),
    sigla: z.string().trim().toUpperCase(),
    logoUrl: z.string().regex(/^\/arquivos\/[a-z0-9]{20,40}$/).nullable(),
    city: optionalText(80),
    state: z
      .string()
      .trim()
      .toUpperCase()
      .refine((value) => value === "" || /^[A-Z]{2}$/.test(value), "Use a sigla do estado com 2 letras (ex.: SP)."),
    website: z
      .string()
      .trim()
      .max(300)
      .refine((value) => value === "" || /^https?:\/\/\S+$/i.test(value), "Use o endereço completo do site, começando com https://"),
    channelManagerId: z.string().nullable(),
    pmsId: z.string().nullable(),
    contactType: z.enum(["pessoa", "grupo"]).nullable(),
    contactName: optionalText(80),
    contactPhone: optionalText(30),
    contactLink: optionalText(200),
    financeName: optionalText(80),
    financePhone: optionalText(30),
    notice: optionalText(300),
  })
  .superRefine((data, ctx) => {
    if (data.contactType === "pessoa" && data.contactPhone && !isValidPhone(data.contactPhone)) {
      ctx.addIssue({ code: "custom", message: "Telefone do contato principal inválido. Use DDD + número." });
    }
    if (data.contactType === "grupo" && data.contactLink && !isGroupLink(data.contactLink)) {
      ctx.addIssue({ code: "custom", message: "Use o link de convite do grupo (https://chat.whatsapp.com/...)." });
    }
    if (data.financePhone && !isValidPhone(data.financePhone)) {
      ctx.addIssue({ code: "custom", message: "WhatsApp do contato financeiro inválido. Use DDD + número." });
    }
  });

function toData(fields: z.output<typeof fieldsSchema>) {
  return {
    name: fields.name,
    logoUrl: fields.logoUrl,
    city: fields.city || null,
    state: fields.state || null,
    website: fields.website || null,
    channelManagerId: fields.channelManagerId,
    pmsId: fields.pmsId,
    contactType: fields.contactType,
    contactName: fields.contactName || null,
    contactPhone: fields.contactType === "pessoa" && fields.contactPhone ? normalizePhone(fields.contactPhone) : null,
    contactLink: fields.contactType === "grupo" && fields.contactLink ? fields.contactLink : null,
    financeName: fields.financeName || null,
    financePhone: fields.financePhone ? normalizePhone(fields.financePhone) : null,
    notice: fields.notice || null,
  };
}

async function checkCatalogRefs(fields: { channelManagerId: string | null; pmsId: string | null }) {
  for (const [id, category] of [
    [fields.channelManagerId, "channel_manager"],
    [fields.pmsId, "pms"],
  ] as const) {
    if (!id) continue;
    const item = await prisma.catalogItem.findFirst({ where: { id, categories: { some: { category } } } });
    if (!item) return "Escolha um item do catálogo.";
  }
  return null;
}

// ---- Criar (Administrador e Analista, D-91) ----

export async function createClient(
  fields: ClientFields,
  services: NewServiceInput[]
): Promise<SaveResult<{ code: string }>> {
  const user = await currentMember();
  if (!user || !EDITORS.includes(user.role ?? "")) return { ok: false, error: "Você não tem permissão para cadastrar clientes." };
  const parsed = fieldsSchema.safeParse(fields);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const settings = await prisma.instanceSettings.findFirst();
  const codeProblem = validateClientCode(parsed.data.sigla, settings?.demandPrefix ?? "DEM");
  if (codeProblem) {
    return {
      ok: false,
      error:
        codeProblem === "prefixo-reservado"
          ? "Essa sigla é o prefixo das demandas. Escolha outra."
          : "A sigla precisa ter de 3 a 4 letras, sem acento (D-74).",
    };
  }
  if (services.length === 0) return { ok: false, error: "Adicione pelo menos um serviço contratado." };
  const refProblem = await checkCatalogRefs(parsed.data);
  if (refProblem) return { ok: false, error: refProblem };

  const catalog = await prisma.service.findMany();
  const accepted: { serviceId: string; phase: string }[] = [];
  for (const item of services) {
    const service = catalog.find((entry) => entry.id === item.serviceId);
    if (!service) return { ok: false, error: "Serviço inválido." };
    const problem =
      phaseProblem(service.phases, item.phase) ??
      billingProblem(service.kind as "pontual" | "continuo", item.billingDay, item.dueDate) ??
      hireProblem(item.serviceId, accepted);
    if (problem) return { ok: false, error: `${service.name}: ${problem}` };
    accepted.push(item);
  }

  const created = await prisma.$transaction(async (tx) => {
    const displayCode = await nextClientCode(tx, parsed.data.sigla, settings?.clientCodeMask ?? "{SIGLA}-{SEQ:3}");
    return tx.client.create({
      data: {
        ...toData(parsed.data),
        displayCode,
        sigla: parsed.data.sigla,
        services: {
          create: services.map((item) => ({
            serviceId: item.serviceId,
            phase: item.phase,
            billingDay: item.billingDay,
            dueDate: item.dueDate ? new Date(`${item.dueDate}T00:00:00Z`) : null,
          })),
        },
      },
    });
  });
  await announce(created.id, created.displayCode);
  return { ok: true, value: { code: created.displayCode } };
}

// ---- Editar (exige a trava do registro, D-70) ----

export async function updateClient(clientId: string, fields: ClientFields): Promise<SaveResult<ClientDetail>> {
  const user = await currentMember();
  if (!user || !EDITORS.includes(user.role ?? "")) return { ok: false, error: "Você não tem permissão para editar clientes." };
  if (!(await holdsLock(prisma, "cliente", clientId, user.id))) {
    return { ok: false, error: "Você não está mais editando. Outra pessoa assumiu ou a edição expirou." };
  }
  const parsed = fieldsSchema.safeParse(fields);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const refProblem = await checkCatalogRefs(parsed.data);
  if (refProblem) return { ok: false, error: refProblem };

  await prisma.client.update({ where: { id: clientId }, data: toData(parsed.data) });
  await releaseLock(prisma, "cliente", clientId, user.id);
  const row = await findClient({ id: clientId });
  if (!row) return { ok: false, error: "Cliente não encontrado." };
  await announce(row.id, row.displayCode);
  return { ok: true, value: toDetail(row) };
}

// ---- Serviços do cliente ----

/** Contratar serviço: só Administrador (D-40). */
export async function addClientService(clientId: string, input: NewServiceInput): Promise<SaveResult<null>> {
  const user = await currentMember();
  if (!user || user.role !== ROLES.administrador) return { ok: false, error: "Só o Administrador contrata serviços." };
  const [service, current] = await Promise.all([
    prisma.service.findUnique({ where: { id: input.serviceId } }),
    prisma.clientService.findMany({ where: { clientId }, select: { serviceId: true, phase: true } }),
  ]);
  if (!service) return { ok: false, error: "Serviço inválido." };
  const problem =
    phaseProblem(service.phases, input.phase) ??
    billingProblem(service.kind as "pontual" | "continuo", input.billingDay, input.dueDate) ??
    hireProblem(input.serviceId, current);
  if (problem) return { ok: false, error: problem };
  const created = await prisma.clientService.create({
    data: {
      clientId,
      serviceId: input.serviceId,
      phase: input.phase,
      billingDay: input.billingDay,
      dueDate: input.dueDate ? new Date(`${input.dueDate}T00:00:00Z`) : null,
    },
    include: { client: { select: { displayCode: true } } },
  });
  await announce(clientId, created.client.displayCode);
  return { ok: true, value: null };
}

/**
 * Editar serviço do cliente (com trava "servico"): fase por Administrador e Analista (D-90);
 * vencimento só pelo Administrador (D-40).
 */
export async function updateClientService(
  clientServiceId: string,
  input: { phase: string; billingDay: number | null; dueDate: string | null }
): Promise<SaveResult<null>> {
  const user = await currentMember();
  if (!user || !EDITORS.includes(user.role ?? "")) return { ok: false, error: "Você não tem permissão para editar serviços." };
  if (!(await holdsLock(prisma, "servico", clientServiceId, user.id))) {
    return { ok: false, error: "Você não está mais editando. Outra pessoa assumiu ou a edição expirou." };
  }
  const current = await prisma.clientService.findUnique({
    where: { id: clientServiceId },
    include: { service: true, client: { select: { id: true, displayCode: true } } },
  });
  if (!current) return { ok: false, error: "Serviço não encontrado." };
  const phase = phaseProblem(current.service.phases, input.phase);
  if (phase) return { ok: false, error: phase };

  const currentDue = current.dueDate ? current.dueDate.toISOString().slice(0, 10) : null;
  const billingChanged = input.billingDay !== current.billingDay || input.dueDate !== currentDue;
  if (billingChanged && user.role !== ROLES.administrador) return { ok: false, error: "Só o Administrador muda o vencimento." };
  const billing = billingProblem(current.service.kind as "pontual" | "continuo", input.billingDay, input.dueDate);
  if (billing) return { ok: false, error: billing };

  await prisma.clientService.update({
    where: { id: clientServiceId },
    data: {
      phase: input.phase,
      billingDay: input.billingDay,
      dueDate: input.dueDate ? new Date(`${input.dueDate}T00:00:00Z`) : null,
    },
  });
  await releaseLock(prisma, "servico", clientServiceId, user.id);
  await announce(current.client.id, current.client.displayCode);
  return { ok: true, value: null };
}

// ---- Excluir (D-93) ----

export async function deleteClient(clientId: string): Promise<SaveResult<null>> {
  const user = await currentMember();
  if (!user || user.role !== ROLES.administrador) return { ok: false, error: "Só o Administrador exclui clientes." };
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { displayCode: true, _count: { select: { credentials: true, demands: true } } },
  });
  if (!client) return { ok: false, error: "Cliente não encontrado." };
  if (client._count.demands > 0) {
    return { ok: false, error: "Este cliente tem demandas e não pode ser excluído. Encerre os serviços para ele ficar Inativo." };
  }
  if (client._count.credentials > 0) {
    return { ok: false, error: "Este cliente tem acessos no Cofre e não pode ser excluído. Encerre os serviços para ele ficar Inativo." };
  }
  await prisma.client.delete({ where: { id: clientId } });
  await publish(prisma, CLIENTS_TOPIC, "cliente:excluido", { id: clientId, code: client.displayCode });
  return { ok: true, value: null };
}

/** Lista de serviços e catálogo para os formulários. */
export async function loadClientFormOptions() {
  if (!(await currentMember())) return null;
  const [services, catalog] = await Promise.all([
    prisma.service.findMany({ orderBy: { position: "asc" } }),
    prisma.catalogItemCategory.findMany({
      where: { category: { in: ["channel_manager", "pms"] }, item: { archivedAt: null } },
      orderBy: { position: "asc" },
      select: { category: true, item: { select: { id: true, name: true, logoUrl: true } } },
    }),
  ]);
  return {
    services: services.map((service) => ({
      id: service.id,
      name: service.name,
      kind: service.kind as "pontual" | "continuo",
      phases: service.phases,
    })),
    // Um item pode ser Channel Manager e PMS ao mesmo tempo (D-103).
    channelManagers: catalog.filter((entry) => entry.category === "channel_manager").map((entry) => entry.item),
    pmsList: catalog.filter((entry) => entry.category === "pms").map((entry) => entry.item),
  };
}

/** Modelo da mensagem de cobrança e nome da instância (Contrato & Cobrança, D-38). */
export async function loadBillingContext(): Promise<{ template: string; instanceName: string } | null> {
  if (!(await currentMember())) return null;
  const settings = await prisma.instanceSettings.findUnique({ where: { id: "instancia" } });
  return { template: settings?.billingMessageTemplate ?? "", instanceName: settings?.name ?? "" };
}
