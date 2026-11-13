"use server";

import { prisma } from "@/lib/db";
import { publish } from "@/features/realtime/publish";
import { currentMember } from "@/features/settings/server/guard";
import { CADASTROS_TOPIC } from "./topics";
import type { DeploymentStatus, MatrixChannelHeader, MatrixRow, PriorityItem } from "./types";

export async function loadCadastrosData(showCompleted = false): Promise<{
  channels: MatrixChannelHeader[];
  matrix: MatrixRow[];
  priorities: PriorityItem[];
}> {
  await currentMember();

  // 1. Get all active catalog items categorized as "canal"
  const catalogChannels = await prisma.catalogItem.findMany({
    where: {
      archivedAt: null,
      categories: { some: { category: "canal" } },
    },
    select: { id: true, name: true, logoUrl: true },
    orderBy: { createdAt: "asc" },
  });

  // 2. Get clients with active services
  const clients = await prisma.client.findMany({
    include: {
      services: { include: { service: true } },
      deployments: true,
    },
    orderBy: { name: "asc" },
  });

  const matrix: MatrixRow[] = [];
  const priorities: PriorityItem[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const client of clients) {
    const activeService = client.services.find(
      (s) =>
        s.serviceId === "cadastro_revisao" ||
        (s.serviceId === "assessoria" && s.phase === "Implantacao") ||
        (showCompleted && s.serviceId === "assessoria")
    ) ?? client.services[0];

    if (!activeService && !showCompleted) continue;

    const channelMap: MatrixRow["channels"] = {};
    let liveCount = 0;
    let contractedCount = 0;

    for (const ch of catalogChannels) {
      const dep = client.deployments.find((d) => d.catalogItemId === ch.id);
      const st = (dep?.status as DeploymentStatus) ?? "nao_contratado";
      channelMap[ch.id] = {
        status: st,
        deploymentId: dep?.id,
        notes: dep?.notes ?? undefined,
        bottleneck: dep?.bottleneck,
      };

      if (st !== "nao_contratado") {
        contractedCount++;
        if (st === "no_ar" || st === "feito_pelo_channel_manager") {
          liveCount++;
        }
      }
    }

    const row: MatrixRow = {
      clientId: client.id,
      clientCode: client.displayCode,
      clientName: client.name,
      clientLogoUrl: client.logoUrl,
      serviceName: activeService?.service.name ?? "Cadastro / Revisão",
      servicePhase: activeService?.phase ?? "Em andamento",
      channels: channelMap,
      liveCount,
      contractedCount,
    };
    matrix.push(row);

    // Build Priority Item if not finished
    const isCompleted = contractedCount > 0 && liveCount === contractedCount;
    if (!isCompleted || showCompleted) {
      const firstDep = client.deployments.find((d) => d.deadline) ?? client.deployments[0];
      const deadline = firstDep?.deadline ? new Date(firstDep.deadline) : null;
      let urgency: PriorityItem["urgency"] = "normal";
      let deadlineText = "No prazo";

      if (deadline) {
        const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          urgency = "atrasado";
          deadlineText = `Atrasado há ${Math.abs(diffDays)} dia${Math.abs(diffDays) > 1 ? "s" : ""}`;
        } else if (diffDays <= 3) {
          urgency = "perto";
          deadlineText = diffDays === 0 ? "Vence hoje" : `Vence em ${diffDays} dia${diffDays > 1 ? "s" : ""}`;
        } else {
          deadlineText = `${deadline.toLocaleDateString("pt-BR")}`;
        }
      }

      priorities.push({
        deploymentId: firstDep?.id,
        clientId: client.id,
        clientCode: client.displayCode,
        clientName: client.name,
        clientLogoUrl: client.logoUrl,
        serviceName: row.serviceName,
        priority: (firstDep?.priority as any) ?? "normal",
        deadline: deadline ? deadline.toISOString().split("T")[0] : null,
        deadlineText,
        urgency,
        liveCount,
        contractedCount,
        bottleneck: firstDep?.bottleneck ?? null,
      });
    }
  }

  // Sort priorities: atrasado first, then perto, then normal
  priorities.sort((a, b) => {
    const weight = { atrasado: 0, perto: 1, normal: 2 };
    if (weight[a.urgency] !== weight[b.urgency]) {
      return weight[a.urgency] - weight[b.urgency];
    }
    return (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999");
  });

  return {
    channels: catalogChannels,
    matrix,
    priorities,
  };
}

export async function setChannelStatus(
  clientId: string,
  catalogItemId: string,
  status: DeploymentStatus,
  bottleneck?: string
): Promise<{ success: boolean }> {
  const member = await currentMember();

  await prisma.channelDeployment.upsert({
    where: {
      clientId_catalogItemId: { clientId, catalogItemId },
    },
    create: {
      clientId,
      catalogItemId,
      status,
      bottleneck: bottleneck ?? null,
      liveAt: status === "no_ar" ? new Date() : null,
    },
    update: {
      status,
      bottleneck: bottleneck !== undefined ? bottleneck : undefined,
      liveAt: status === "no_ar" ? new Date() : undefined,
    },
  });

  await publish(prisma, CADASTROS_TOPIC, "cadastros:atualizado", {
    clientId,
    catalogItemId,
    status,
    updatedById: member?.id ?? "",
  });

  return { success: true };
}

export async function updatePriorityMeta(
  clientId: string,
  priority: "normal" | "alta" | "critica",
  deadlineDate?: string,
  bottleneck?: string
): Promise<{ success: boolean }> {
  const member = await currentMember();
  const deadline = deadlineDate ? new Date(deadlineDate) : null;

  // Update all client's deployments with the deadline/priority
  await prisma.channelDeployment.updateMany({
    where: { clientId },
    data: {
      priority,
      deadline,
      bottleneck: bottleneck !== undefined ? bottleneck : undefined,
    },
  });

  await publish(prisma, CADASTROS_TOPIC, "cadastros:atualizado", {
    clientId,
    updatedById: member?.id ?? "",
  });

  return { success: true };
}

export async function getClientDeployments(clientId: string): Promise<
  Array<{
    catalogItemId: string;
    channelName: string;
    logoUrl: string | null;
    status: DeploymentStatus;
    bottleneck: string | null;
    deadline: string | null;
  }>
> {
  await currentMember();
  const deployments = await prisma.channelDeployment.findMany({
    where: { clientId },
    include: { catalogItem: { select: { id: true, name: true, logoUrl: true } } },
    orderBy: { catalogItem: { name: "asc" } },
  });
  return deployments.map((d) => ({
    catalogItemId: d.catalogItemId,
    channelName: d.catalogItem.name,
    logoUrl: d.catalogItem.logoUrl,
    status: d.status as DeploymentStatus,
    bottleneck: d.bottleneck,
    deadline: d.deadline ? d.deadline.toISOString().split("T")[0] : null,
  }));
}
