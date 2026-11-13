"use server";

import { prisma } from "@/lib/db";
import { currentMember } from "@/features/settings/server/guard";
import { ROLES } from "@/features/auth/permissions";
import { decryptSecret, type EncryptedSecret } from "@/features/vault/crypto";

export interface BackupExportOptions {
  includeClients?: boolean;
  includeChecklists?: boolean;
  includeDemands?: boolean;
  includeVault?: boolean;
  includeCatalog?: boolean;
}

export async function exportFullSystemBackup(
  options: BackupExportOptions = {}
): Promise<{ ok: boolean; json?: string; error?: string }> {
  const member = await currentMember();
  if (!member || member.role !== ROLES.administrador) {
    return { ok: false, error: "Acesso negado: apenas administradores podem exportar backup geral." };
  }

  const {
    includeClients = true,
    includeChecklists = true,
    includeDemands = true,
    includeVault = true,
    includeCatalog = true,
  } = options;

  try {
    const backupData: Record<string, unknown> = {
      versao: "1.0",
      exportadoEm: new Date().toISOString(),
      exportadoPor: {
        id: member.id,
        nome: member.name,
        email: member.email,
      },
    };

    if (includeCatalog) {
      const [instanceSettings, catalogItems, services] = await Promise.all([
        prisma.instanceSettings.findFirst(),
        prisma.catalogItem.findMany({
          include: { categories: true },
          orderBy: { createdAt: "asc" },
        }),
        prisma.service.findMany({ orderBy: { position: "asc" } }),
      ]);
      backupData.configuracoes = instanceSettings;
      backupData.catalogo = catalogItems;
      backupData.servicos = services;
    }

    if (includeClients) {
      const clients = await prisma.client.findMany({
        include: {
          services: {
            include: { service: true },
          },
          deployments: {
            include: { catalogItem: true },
          },
        },
        orderBy: { name: "asc" },
      });
      backupData.clientes = clients;
    }

    if (includeChecklists) {
      const checklists = await prisma.clientChecklist.findMany({
        include: {
          client: {
            select: { id: true, name: true, displayCode: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      });
      backupData.checklists = checklists;
    }

    if (includeDemands) {
      const demands = await prisma.demand.findMany({
        include: {
          client: { select: { id: true, name: true, displayCode: true } },
          platform: { select: { id: true, name: true } },
          assignees: { include: { user: { select: { id: true, name: true } } } },
          subtasks: true,
          events: true,
        },
        orderBy: { createdAt: "desc" },
      });
      backupData.demandas = demands;
    }

    if (includeVault) {
      const credentials = await prisma.vaultCredential.findMany({
        include: {
          client: { select: { id: true, name: true, displayCode: true } },
          catalogItem: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      });

      backupData.cofreCredenciais = credentials.map((c: (typeof credentials)[number]) => {
        let decUser = "";
        let decPass = "";
        try {
          if (c.username) decUser = decryptSecret(c.username as unknown as EncryptedSecret);
        } catch {
          decUser = "[ERRO_AO_DESCRIPTOGRAFAR]";
        }
        try {
          if (c.password) decPass = decryptSecret(c.password as unknown as EncryptedSecret);
        } catch {
          decPass = "[ERRO_AO_DESCRIPTOGRAFAR]";
        }

        return {
          id: c.id,
          cliente: c.client.name,
          codigoCliente: c.client.displayCode,
          canal: c.catalogItem.name,
          rotulo: c.label,
          propriedadeId: c.propertyId,
          usuario: decUser,
          senha: decPass,
          extranetUrl: c.extranetUrl,
          atualizadoEm: c.updatedAt.toISOString(),
        };
      });
    }

    return { ok: true, json: JSON.stringify(backupData, null, 2) };
  } catch (err) {
    console.error("Backup export error:", err);
    return { ok: false, error: "Falha ao gerar arquivo de backup geral." };
  }
}
