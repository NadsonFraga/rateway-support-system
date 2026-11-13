"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { ROLES } from "@/features/auth/permissions";
import { nextDemandCode } from "@/features/ids/generator";
import { parseCodeQuery } from "@/features/ids/masks";
import { notify } from "@/features/inbox/service";
import { holdsLock, releaseLock } from "@/features/locks/service";
import { publish } from "@/features/realtime/publish";
import { currentMember } from "@/features/settings/server/guard";
import type { SaveResult } from "@/features/settings/topics";
import { docMentions, docText, isEmptyDoc, isValidDoc } from "./editor/doc";
import {
  canConclude,
  DEMAND_PRIORITIES,
  DEMAND_STATUSES,
  DEMAND_STATUS_LABEL,
  diffDemand,
  isClosed,
  type DemandSnapshot,
  type DemandStatus,
} from "./rules";
import { DEMANDS_TOPIC } from "./topics";
import type { DemandDetail, DemandFormOptions, DemandInput, DemandListItem, DemandPreview, PersonRef } from "./types";

// Demandas (demandas-spec.md, D-95 a D-102). Os três perfis criam e editam; ninguém apaga (D-95).

const person = { select: { id: true, name: true, image: true } } as const;

const listInclude = {
  client: { select: { id: true, displayCode: true, name: true, logoUrl: true } },
  platform: { select: { id: true, name: true, logoUrl: true } },
  assignees: { include: { user: person }, orderBy: { user: { name: "asc" as const } } },
};

const detailInclude = {
  ...listInclude,
  subtasks: { orderBy: { position: "asc" as const } },
  attachments: { orderBy: { createdAt: "asc" as const } },
  events: { include: { author: person }, orderBy: { createdAt: "asc" as const } },
  createdBy: person,
  completedBy: person,
};

type ListRow = Prisma.DemandGetPayload<{ include: typeof listInclude }>;
type DetailRow = Prisma.DemandGetPayload<{ include: typeof detailInclude }>;

const iso = (value: Date | null) => value?.toISOString() ?? null;
const day = (value: Date | null) => (value ? value.toISOString().slice(0, 10) : null);

function toListItem(row: ListRow): DemandListItem {
  return {
    id: row.id,
    code: row.displayCode,
    title: row.title,
    status: row.status as DemandStatus,
    priority: row.priority as DemandListItem["priority"],
    dueDate: day(row.dueDate),
    dueTime: row.dueTime,
    client: row.client ? { id: row.client.id, code: row.client.displayCode, name: row.client.name, logoUrl: row.client.logoUrl } : null,
    platform: row.platform,
    assignees: row.assignees.map((item) => ({ ...item.user, seenAt: iso(item.seenAt), confirmedAt: iso(item.confirmedAt) })),
    requireAllConfirm: row.requireAllConfirm,
    completedAt: iso(row.completedAt),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toDetail(row: DetailRow): DemandDetail {
  return {
    ...toListItem(row),
    description: row.description ?? null,
    subtasks: row.subtasks.map((item) => ({ id: item.id, text: item.text, done: item.done })),
    attachments: row.attachments.map((item) => ({ id: item.id, url: item.url, name: item.name, mimeType: item.mimeType })),
    events: row.events.map((item) => ({
      id: item.id,
      kind: item.kind as DemandDetail["events"][number]["kind"],
      author: item.author,
      body: item.body ?? null,
      changes: (item.changes as DemandDetail["events"][number]["changes"]) ?? null,
      createdAt: item.createdAt.toISOString(),
    })),
    createdBy: row.createdBy,
    completedBy: row.completedBy,
    createdAt: row.createdAt.toISOString(),
  };
}

function snapshotOf(row: DetailRow): DemandSnapshot {
  return {
    title: row.title,
    status: row.status as DemandStatus,
    priority: row.priority as DemandSnapshot["priority"],
    dueDate: day(row.dueDate),
    dueTime: row.dueTime,
    clientName: row.client?.name ?? null,
    platformName: row.platform?.name ?? null,
    assigneeNames: row.assignees.map((item) => item.user.name),
    requireAllConfirm: row.requireAllConfirm,
    descriptionText: docText(row.description),
    subtasks: row.subtasks.map((item) => ({ text: item.text, done: item.done })),
    attachmentNames: row.attachments.map((item) => item.name),
  };
}

async function announce(db: Prisma.TransactionClient | typeof prisma, demand: { id: string; displayCode: string; clientId: string | null }) {
  await publish(db, DEMANDS_TOPIC, "demanda:salva", { id: demand.id, code: demand.displayCode, clientId: demand.clientId });
}

function editingLock(id: string) {
  return prisma.editLock.findUnique({
    where: { entityType_entityId: { entityType: "demanda", entityId: id } },
    include: { user: { select: { name: true } } },
  });
}

const target = (code: string) => ({ kind: "demandas" as const, demanda: code });

// ---- Leitura ----

/** "ativas": abertas; "concluidas": concluídas e canceladas; "quadro": abertas + concluídas nos últimos 7 dias. */
export async function listDemands(scope: "ativas" | "concluidas" | "quadro"): Promise<DemandListItem[] | null> {
  if (!(await currentMember())) return null;
  const closed = ["concluida", "cancelada"];
  const where: Prisma.DemandWhereInput =
    scope === "ativas"
      ? { status: { notIn: closed } }
      : scope === "concluidas"
        ? { status: { in: closed } }
        : {
            OR: [
              { status: { notIn: closed } },
              { status: "concluida", completedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
            ],
          };
  const rows = await prisma.demand.findMany({
    where,
    include: listInclude,
    orderBy: scope === "concluidas" ? { completedAt: "desc" } : { createdAt: "asc" },
    take: scope === "concluidas" ? 500 : undefined,
  });
  return rows.map(toListItem);
}

export async function listDemandsForClient(clientId: string): Promise<DemandListItem[]> {
  if (!(await currentMember())) return [];
  const rows = await prisma.demand.findMany({
    where: { clientId, status: { notIn: ["concluida", "cancelada"] } },
    include: listInclude,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toListItem);
}

export async function getMyDemands(): Promise<DemandListItem[]> {
  const member = await currentMember();
  if (!member) return [];
  const rows = await prisma.demand.findMany({
    where: {
      assignees: { some: { userId: member.id } },
      status: { notIn: ["concluida", "cancelada"] },
    },
    include: listInclude,
    orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
    take: 5,
  });
  return rows.map(toListItem);
}

export async function countDemands(): Promise<{ ativas: number; concluidas: number } | null> {
  if (!(await currentMember())) return null;
  const [ativas, concluidas] = await Promise.all([
    prisma.demand.count({ where: { status: { notIn: ["concluida", "cancelada"] } } }),
    prisma.demand.count({ where: { status: { in: ["concluida", "cancelada"] } } }),
  ]);
  return { ativas, concluidas };
}

/** Abre a demanda; se quem abre é atribuído e ainda não tinha visto, registra o "visto às". */
export async function openDemand(code: string): Promise<DemandDetail | null> {
  const user = await currentMember();
  if (!user) return null;
  const row = await prisma.demand.findUnique({ where: { displayCode: code.toUpperCase() }, include: detailInclude });
  if (!row) return null;
  const mine = row.assignees.find((item) => item.userId === user.id);
  if (mine && !mine.seenAt) {
    await prisma.demandAssignee.update({ where: { demandId_userId: { demandId: row.id, userId: user.id } }, data: { seenAt: new Date() } });
    await announce(prisma, row);
    return openDemand(code);
  }
  return toDetail(row);
}

/** Prévia da linha (D-108): só leitura, não marca "visto". */
export async function previewDemand(code: string): Promise<DemandPreview | null> {
  if (!(await currentMember())) return null;
  const row = await prisma.demand.findUnique({
    where: { displayCode: code.toUpperCase() },
    select: { id: true, description: true, subtasks: { orderBy: { position: "asc" } } },
  });
  if (!row) return null;
  const lock = await editingLock(row.id);
  return {
    id: row.id,
    description: row.description ?? null,
    subtasks: row.subtasks.map((item) => ({ id: item.id, text: item.text, done: item.done })),
    editingBy: lock?.user.name ?? null,
  };
}

export async function loadDemandFormOptions(): Promise<DemandFormOptions | null> {
  if (!(await currentMember())) return null;
  const [people, clients, platforms] = await Promise.all([
    prisma.user.findMany({ where: { NOT: { banned: true } }, select: { id: true, name: true, image: true }, orderBy: { name: "asc" } }),
    prisma.client.findMany({ select: { id: true, displayCode: true, name: true, logoUrl: true }, orderBy: { name: "asc" } }),
    prisma.catalogItem.findMany({ where: { archivedAt: null }, select: { id: true, name: true, logoUrl: true }, orderBy: { name: "asc" } }),
  ]);
  return {
    people,
    clients: clients.map((client) => ({ id: client.id, code: client.displayCode, name: client.name, logoUrl: client.logoUrl })),
    platforms,
  };
}

/** Busca do Ctrl+K: código com ou sem zeros (dem42 → DEM-0042) e título. */
export async function searchDemands(query: string): Promise<{ code: string; title: string; status: DemandStatus }[]> {
  if (!(await currentMember())) return [];
  const text = query.trim();
  if (text.length < 2) return [];
  const parsed = parseCodeQuery(text);
  const byCode = parsed
    ? (await prisma.demand.findMany({ where: { displayCode: { contains: String(parsed.number) } }, select: { displayCode: true, title: true, status: true }, take: 50 })).filter(
        (row) =>
          Number(row.displayCode.replace(/\D/g, "")) === parsed.number &&
          (!parsed.letters || row.displayCode.replace(/[^A-Z]/g, "").startsWith(parsed.letters))
      )
    : [];
  const byTitle = await prisma.demand.findMany({
    where: { title: { contains: text, mode: "insensitive" } },
    select: { displayCode: true, title: true, status: true },
    orderBy: { updatedAt: "desc" },
    take: 8,
  });
  const seen = new Set<string>();
  return [...byCode, ...byTitle]
    .filter((row) => (seen.has(row.displayCode) ? false : (seen.add(row.displayCode), true)))
    .slice(0, 8)
    .map((row) => ({ code: row.displayCode, title: row.title, status: row.status as DemandStatus }));
}

// ---- Criar e salvar ----

const driveUrl = z
  .string()
  .trim()
  .max(500)
  .refine((value) => /^https:\/\/(drive|docs)\.google\.com\/\S+$/i.test(value), "Use um link do Google Drive (https://drive.google.com/… ou https://docs.google.com/…).");

const inputSchema = z.object({
  title: z.string().trim().min(1, "Dê um título à demanda.").max(200, "Use até 200 caracteres no título."),
  description: z.unknown().refine(isValidDoc, "Descrição inválida ou longa demais."),
  status: z.enum(DEMAND_STATUSES),
  priority: z.enum(DEMAND_PRIORITIES),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  dueTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .nullable(),
  clientId: z.string().min(1).nullable(),
  platformId: z.string().min(1).nullable(),
  requireAllConfirm: z.boolean(),
  assigneeIds: z.array(z.string().min(1)).max(30),
  subtasks: z.array(z.object({ id: z.string().optional(), text: z.string().trim().min(1).max(300), done: z.boolean() })).max(100),
  attachments: z
    .array(z.object({ id: z.string().optional(), url: driveUrl, name: z.string().trim().min(1).max(200), mimeType: z.string().max(120).nullable() }))
    .max(50),
});

type ParsedInput = z.output<typeof inputSchema>;

function parse(input: DemandInput): { ok: true; data: ParsedInput } | { ok: false; error: string } {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  if (parsed.data.dueTime && !parsed.data.dueDate) return { ok: false, error: "Escolha a data do prazo antes da hora." };
  return { ok: true, data: { ...parsed.data, description: isEmptyDoc(parsed.data.description) ? null : parsed.data.description } };
}

const toDate = (value: string | null) => (value ? new Date(`${value}T00:00:00Z`) : null);

async function notifyPeople(
  tx: Prisma.TransactionClient,
  ids: string[],
  author: { id: string; name: string },
  code: string,
  title: string,
  body: string
) {
  for (const userId of new Set(ids)) {
    if (userId === author.id) continue;
    await notify(tx, userId, { title, body: `${code} · ${body}`, target: target(code) });
  }
}

export async function createDemand(input: DemandInput): Promise<SaveResult<{ code: string }>> {
  const user = await currentMember();
  if (!user) return { ok: false, error: "Você não tem permissão para criar demandas." };
  const parsed = parse(input);
  if (!parsed.ok) return parsed;
  const data = parsed.data;
  if (data.status === "concluida" && data.requireAllConfirm && data.assigneeIds.length > 0) {
    return { ok: false, error: "Com aprovação coletiva, a demanda só é concluída depois que todos confirmarem a parte." };
  }

  const created = await prisma.$transaction(async (tx) => {
    const settings = await tx.instanceSettings.findFirst();
    const code = await nextDemandCode(tx, settings?.demandPrefix ?? "DEM", settings?.demandCodeMask ?? "{PREFIXO}-{SEQ:4}");
    const demand = await tx.demand.create({
      data: {
        displayCode: code,
        title: data.title,
        description: data.description === null ? Prisma.DbNull : (data.description as Prisma.InputJsonValue),
        status: data.status,
        priority: data.priority,
        dueDate: toDate(data.dueDate),
        dueTime: data.dueTime,
        clientId: data.clientId,
        platformId: data.platformId,
        requireAllConfirm: data.requireAllConfirm,
        createdById: user.id,
        completedAt: isClosed(data.status) ? new Date() : null,
        completedById: isClosed(data.status) ? user.id : null,
        assignees: { create: [...new Set(data.assigneeIds)].map((userId) => ({ userId })) },
        subtasks: { create: data.subtasks.map((item, index) => ({ text: item.text, done: item.done, position: index + 1 })) },
        attachments: { create: data.attachments.map((item) => ({ url: item.url, name: item.name, mimeType: item.mimeType, addedById: user.id })) },
        events: { create: { kind: "criacao", authorId: user.id } },
      },
    });
    await notifyPeople(tx, data.assigneeIds, user, code, `${user.name} atribuiu uma demanda a você`, data.title);
    await notifyPeople(tx, docMentions(data.description).people, user, code, `${user.name} mencionou você`, data.title);
    await announce(tx, demand);
    return demand;
  });
  return { ok: true, value: { code: created.displayCode } };
}

/** Salvar (com a trava "demanda", D-65): grava tudo de uma vez e gera a linha do histórico (D-69). */
export async function saveDemand(id: string, input: DemandInput, options: { force?: boolean } = {}): Promise<SaveResult<DemandDetail>> {
  const user = await currentMember();
  if (!user) return { ok: false, error: "Você não tem permissão para editar demandas." };
  if (!(await holdsLock(prisma, "demanda", id, user.id))) {
    return { ok: false, error: "Você não está mais editando. Outra pessoa assumiu ou a edição expirou." };
  }
  const parsed = parse(input);
  if (!parsed.ok) return parsed;
  const data = parsed.data;
  const before = await prisma.demand.findUnique({ where: { id }, include: detailInclude });
  if (!before) return { ok: false, error: "Demanda não encontrada." };

  const assigneeIds = [...new Set(data.assigneeIds)];
  const kept = before.assignees.filter((item) => assigneeIds.includes(item.userId));
  const added = assigneeIds.filter((userId) => !before.assignees.some((item) => item.userId === userId));
  const concluding = data.status === "concluida" && before.status !== "concluida";
  const confirmations = [...kept.map((item) => ({ confirmedAt: iso(item.confirmedAt) })), ...added.map(() => ({ confirmedAt: null }))];
  if (concluding && !canConclude({ requireAllConfirm: data.requireAllConfirm, assignees: confirmations })) {
    if (!(options.force && user.role === ROLES.administrador)) {
      return { ok: false, error: "Ainda falta confirmação de alguém. Só o Administrador pode forçar a conclusão." };
    }
  }

  const saved = await prisma.$transaction(async (tx) => {
    const closing = isClosed(data.status) && !isClosed(before.status as DemandStatus);
    const reopening = !isClosed(data.status) && isClosed(before.status as DemandStatus);
    await tx.demandAssignee.deleteMany({ where: { demandId: id, userId: { notIn: assigneeIds } } });
    if (added.length) await tx.demandAssignee.createMany({ data: added.map((userId) => ({ demandId: id, userId })) });
    await tx.demandSubtask.deleteMany({ where: { demandId: id } });
    await tx.demandAttachment.deleteMany({ where: { demandId: id, id: { notIn: data.attachments.flatMap((item) => (item.id ? [item.id] : [])) } } });
    const row = await tx.demand.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description === null ? Prisma.DbNull : (data.description as Prisma.InputJsonValue),
        status: data.status,
        priority: data.priority,
        dueDate: toDate(data.dueDate),
        dueTime: data.dueTime,
        clientId: data.clientId,
        platformId: data.platformId,
        requireAllConfirm: data.requireAllConfirm,
        ...(closing ? { completedAt: new Date(), completedById: user.id } : {}),
        ...(reopening ? { completedAt: null, completedById: null } : {}),
        subtasks: { create: data.subtasks.map((item, index) => ({ text: item.text, done: item.done, position: index + 1 })) },
        attachments: {
          create: data.attachments.filter((item) => !item.id).map((item) => ({ url: item.url, name: item.name, mimeType: item.mimeType, addedById: user.id })),
        },
      },
      include: detailInclude,
    });
    const changes = diffDemand(snapshotOf(before), snapshotOf(row));
    if (changes.length) await tx.demandEvent.create({ data: { demandId: id, kind: "alteracao", authorId: user.id, changes } });
    await notifyPeople(tx, added, user, row.displayCode, `${user.name} atribuiu uma demanda a você`, row.title);
    const mentionedBefore = docMentions(before.description).people;
    await notifyPeople(
      tx,
      docMentions(row.description).people.filter((userId) => !mentionedBefore.includes(userId)),
      user,
      row.displayCode,
      `${user.name} mencionou você`,
      row.title
    );
    await announce(tx, row);
    return row;
  });
  await releaseLock(prisma, "demanda", id, user.id);
  const fresh = await prisma.demand.findUniqueOrThrow({ where: { id: saved.id }, include: detailInclude });
  return { ok: true, value: toDetail(fresh) };
}

// ---- Ações de um clique (sem Editar/Salvar) ----

/** Kanban: muda a situação na hora (D-66), se ninguém estiver editando a demanda. */
export async function moveDemand(id: string, status: DemandStatus): Promise<SaveResult<null>> {
  const user = await currentMember();
  if (!user) return { ok: false, error: "Você não tem permissão para mover demandas." };
  if (!DEMAND_STATUSES.includes(status)) return { ok: false, error: "Situação inválida." };
  const lock = await editingLock(id);
  if (lock && lock.userId !== user.id) return { ok: false, error: `${lock.user.name} está editando esta demanda.` };
  const before = await prisma.demand.findUnique({ where: { id }, include: { assignees: true } });
  if (!before) return { ok: false, error: "Demanda não encontrada." };
  if (before.status === status) return { ok: true, value: null };
  if (
    status === "concluida" &&
    !canConclude({ requireAllConfirm: before.requireAllConfirm, assignees: before.assignees.map((item) => ({ confirmedAt: iso(item.confirmedAt) })) })
  ) {
    return { ok: false, error: "Ainda falta confirmação de alguém para concluir esta demanda." };
  }
  await prisma.$transaction(async (tx) => {
    const closing = isClosed(status) && !isClosed(before.status as DemandStatus);
    const reopening = !isClosed(status) && isClosed(before.status as DemandStatus);
    const row = await tx.demand.update({
      where: { id },
      data: {
        status,
        ...(closing ? { completedAt: new Date(), completedById: user.id } : {}),
        ...(reopening ? { completedAt: null, completedById: null } : {}),
      },
    });
    await tx.demandEvent.create({
      data: {
        demandId: id,
        kind: "alteracao",
        authorId: user.id,
        changes: [{ field: "situação", from: DEMAND_STATUS_LABEL[before.status as DemandStatus], to: DEMAND_STATUS_LABEL[status] }],
      },
    });
    await announce(tx, row);
  });
  return { ok: true, value: null };
}

/**
 * Marcar subtarefa com um clique (D-106). Bloqueado enquanto alguém edita a demanda, inclusive quem marca:
 * o Salvar da edição regrava as subtarefas e apagaria a marcação.
 */
export async function toggleSubtask(subtaskId: string, done: boolean): Promise<SaveResult<null>> {
  const user = await currentMember();
  if (!user) return { ok: false, error: "Você não tem permissão para isso." };
  const subtask = await prisma.demandSubtask.findUnique({ where: { id: subtaskId } });
  if (!subtask) return { ok: false, error: "Esta subtarefa mudou. Abra a demanda de novo." };
  const lock = await editingLock(subtask.demandId);
  if (lock) {
    return { ok: false, error: lock.userId === user.id ? "Você está editando esta demanda: marque pelo painel e salve." : `${lock.user.name} está editando esta demanda.` };
  }
  if (subtask.done === done) return { ok: true, value: null };
  await prisma.$transaction(async (tx) => {
    await tx.demandSubtask.update({ where: { id: subtaskId }, data: { done } });
    const row = await tx.demand.update({ where: { id: subtask.demandId }, data: { updatedAt: new Date() } });
    await tx.demandEvent.create({
      data: { demandId: row.id, kind: "alteracao", authorId: user.id, changes: [{ field: "subtarefa", from: subtask.text, to: done ? "feita" : "aberta" }] },
    });
    await announce(tx, row);
  });
  return { ok: true, value: null };
}

/** Aprovação coletiva: "Confirmar minha parte" (livre mesmo com a demanda travada, D-66). */
export async function confirmMyPart(id: string, confirmed: boolean): Promise<SaveResult<null>> {
  const user = await currentMember();
  if (!user) return { ok: false, error: "Você não tem permissão para isso." };
  const assignee = await prisma.demandAssignee.findUnique({ where: { demandId_userId: { demandId: id, userId: user.id } } });
  if (!assignee) return { ok: false, error: "Só quem está atribuído confirma a própria parte." };
  await prisma.$transaction(async (tx) => {
    await tx.demandAssignee.update({ where: { demandId_userId: { demandId: id, userId: user.id } }, data: { confirmedAt: confirmed ? new Date() : null } });
    const row = await tx.demand.findUniqueOrThrow({ where: { id } });
    await tx.demandEvent.create({
      data: {
        demandId: id,
        kind: "alteracao",
        authorId: user.id,
        changes: [{ field: "confirmação", from: null, to: confirmed ? "confirmou a parte" : "desfez a confirmação" }],
      },
    });
    await announce(tx, row);
  });
  return { ok: true, value: null };
}

/** Comentário (livre mesmo com a demanda travada, D-66). Menções notificam (D-97). */
export async function addComment(id: string, body: unknown): Promise<SaveResult<null>> {
  const user = await currentMember();
  if (!user) return { ok: false, error: "Você não tem permissão para comentar." };
  if (!isValidDoc(body) || isEmptyDoc(body)) return { ok: false, error: "Escreva o comentário antes de enviar." };
  await prisma.$transaction(async (tx) => {
    const row = await tx.demand.findUniqueOrThrow({ where: { id } });
    await tx.demandEvent.create({ data: { demandId: id, kind: "comentario", authorId: user.id, body: body as Prisma.InputJsonValue } });
    await notifyPeople(tx, docMentions(body).people, user, row.displayCode, `${user.name} mencionou você`, docText(body).slice(0, 140));
    await announce(tx, row);
  });
  return { ok: true, value: null };
}

/** Pessoas para o @ e para os atribuídos. */
export async function listPeople(): Promise<PersonRef[]> {
  if (!(await currentMember())) return [];
  return prisma.user.findMany({ where: { NOT: { banned: true } }, select: { id: true, name: true, image: true }, orderBy: { name: "asc" } });
}
