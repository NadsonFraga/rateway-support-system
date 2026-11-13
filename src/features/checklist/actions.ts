"use server";

import { prisma } from "@/lib/db";
import { publish } from "@/features/realtime/publish";
import { currentMember } from "@/features/settings/server/guard";
import { CHECKLIST_MODULES, type ChecklistData, type FieldMetaRecord } from "./types";
import { computeChecklistProgress } from "./rules";
import { CHECKLIST_TOPIC } from "./topics";

export type ChecklistView = {
  id: string;
  clientId: string;
  clientName: string;
  clientCode?: string;
  city?: string | null;
  state?: string | null;
  status: string;
  progressPercent: number;
  data: ChecklistData;
  fieldMeta: FieldMetaRecord;
  updatedAt: string;
};

export async function getChecklist(clientId: string): Promise<ChecklistView | null> {
  await currentMember();
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, name: true, displayCode: true, city: true, state: true, checklist: true },
  });
  if (!client) return null;

  if (!client.checklist) {
    const created = await prisma.clientChecklist.create({
      data: {
        clientId: client.id,
        status: "rascunho",
        progressPercent: 0,
        data: { nomeFantasia: client.name },
        fieldMeta: {},
      },
    });
    return {
      id: created.id,
      clientId: client.id,
      clientName: client.name,
      clientCode: client.displayCode,
      city: client.city,
      state: client.state,
      status: created.status,
      progressPercent: created.progressPercent,
      data: (created.data as ChecklistData) ?? {},
      fieldMeta: (created.fieldMeta as FieldMetaRecord) ?? {},
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  return {
    id: client.checklist.id,
    clientId: client.id,
    clientName: client.name,
    clientCode: client.displayCode,
    city: client.city,
    state: client.state,
    status: client.checklist.status,
    progressPercent: client.checklist.progressPercent,
    data: (client.checklist.data as ChecklistData) ?? {},
    fieldMeta: (client.checklist.fieldMeta as FieldMetaRecord) ?? {},
    updatedAt: client.checklist.updatedAt.toISOString(),
  };
}

export async function saveChecklist(
  clientId: string,
  data: ChecklistData,
  fieldMeta: FieldMetaRecord,
  status?: string
): Promise<{ success: boolean; progressPercent: number; problem?: string }> {
  const member = await currentMember();
  const progressPercent = computeChecklistProgress(data, fieldMeta);

  await prisma.clientChecklist.upsert({
    where: { clientId },
    create: {
      clientId,
      status: status ?? "rascunho",
      progressPercent,
      data: data as any,
      fieldMeta: fieldMeta as any,
    },
    update: {
      status: status ?? undefined,
      progressPercent,
      data: data as any,
      fieldMeta: fieldMeta as any,
    },
  });

  await publish(prisma, CHECKLIST_TOPIC, "checklist:atualizado", {
    clientId,
    progressPercent,
    updatedById: member?.id ?? "",
  });

  return { success: true, progressPercent };
}

export async function updateChecklistStatus(
  clientId: string,
  status: string
): Promise<{ success: boolean }> {
  const member = await currentMember();
  await prisma.clientChecklist.update({
    where: { clientId },
    data: { status },
  });
  await publish(prisma, CHECKLIST_TOPIC, "checklist:atualizado", {
    clientId,
    status,
    updatedById: member?.id ?? "",
  });
  return { success: true };
}

export async function generatePendingWhatsAppMessage(clientId: string): Promise<string> {
  await currentMember();
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { checklist: true },
  });
  if (!client || !client.checklist) return "";

  const data = (client.checklist.data as ChecklistData) ?? {};
  const fieldMeta = (client.checklist.fieldMeta as FieldMetaRecord) ?? {};
  const pendingItems: string[] = [];

  for (const mod of CHECKLIST_MODULES) {
    for (const req of mod.requiredFields) {
      const meta = fieldMeta[req.key as string];
      if (meta?.status === "na") continue;
      const val = data[req.key];
      const isFilled = val !== undefined && val !== null && String(val).trim() !== "";
      if (meta?.status === "pend" || meta?.status === "conf" || !isFilled) {
        const noteSuffix = meta?.note ? ` (${meta.note})` : "";
        pendingItems.push(`• *${req.label}*${noteSuffix}`);
      }
    }
  }

  // Also check non-required fields explicitly marked as "pend" or "conf"
  for (const [key, meta] of Object.entries(fieldMeta)) {
    if (meta.status === "pend" || meta.status === "conf") {
      const isAlreadyIncluded = CHECKLIST_MODULES.some((m) => m.requiredFields.some((r) => r.key === key));
      if (!isAlreadyIncluded) {
        const noteSuffix = meta.note ? ` (${meta.note})` : "";
        pendingItems.push(`• *${key}*${noteSuffix}`);
      }
    }
  }

  const contactName = client.contactName || "prezado cliente";
  const hotelName = client.name;

  if (pendingItems.length === 0) {
    return `Olá, ${contactName}! Informamos que a ficha de implantação do *${hotelName}* está 100% preenchida e validada pela equipe Rateway. Muito obrigado!`;
  }

  return (
    `Olá, ${contactName}! Para darmos andamento na implantação do *${hotelName}* na Rateway, ainda precisamos das seguintes informações:\n\n` +
    pendingItems.join("\n") +
    `\n\nQualquer dúvida, estamos à disposição para ajudar!`
  );
}

export async function exportChecklistJson(clientId: string, hideSensitive: boolean): Promise<string> {
  await currentMember();
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      checklist: true,
      credentials: true,
    },
  });
  if (!client) return "{}";

  const exportObj = {
    exportadoEm: new Date().toISOString(),
    cliente: {
      codigo: client.displayCode,
      nome: client.name,
      sigla: client.sigla,
      cidade: client.city,
      estado: client.state,
    },
    checklist: client.checklist
      ? {
          status: client.checklist.status,
          progresso: client.checklist.progressPercent,
          dados: client.checklist.data,
          metadadosCampos: client.checklist.fieldMeta,
        }
      : null,
    acessos: hideSensitive
      ? "OCULTADO_POR_SEGURANCA"
      : client.credentials.map((c) => ({
          id: c.id,
          canalId: c.catalogItemId,
          rotulo: c.label,
          propriedadeId: c.propertyId,
          extranetUrl: c.extranetUrl,
        })),
  };

  return JSON.stringify(exportObj, null, 2);
}
