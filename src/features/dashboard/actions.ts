"use server";

import { prisma } from "@/lib/db";
import { publish } from "@/features/realtime/publish";
import { currentMember, currentAdmin } from "@/features/settings/server/guard";
import { getMyDemands } from "@/features/demands/actions";
import { DASHBOARD_TOPIC } from "./topics";
import type { DemandListItem } from "@/features/demands/types";

export type DashboardNotice = {
  id: string;
  text: string;
  authorName: string;
  createdAt: string;
  expiresAt: string | null;
  isRead: boolean;
};

export type DashboardKpis = {
  activeOnboardingClients: number;
  overdueCount: number;
  channelsLive: number;
  channelsContracted: number;
  openDemandsTotal: number;
  completedThisWeek: number;
};

export type DashboardData = {
  notices: DashboardNotice[];
  myDemands: DemandListItem[];
  kpis: DashboardKpis;
  canCreateNotice: boolean;
};

export async function getDashboardData(): Promise<DashboardData | null> {
  const member = await currentMember();
  if (!member) return null;

  const now = new Date();

  // 1. Fetch active notices
  const noticesRaw = await prisma.instanceNotice.findMany({
    where: {
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    include: {
      reads: {
        where: { userId: member.id },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const notices: DashboardNotice[] = noticesRaw.map((n) => ({
    id: n.id,
    text: n.text,
    authorName: n.authorName,
    createdAt: n.createdAt.toISOString(),
    expiresAt: n.expiresAt ? n.expiresAt.toISOString() : null,
    isRead: n.reads.length > 0,
  }));

  // 2. Fetch My Demands
  const myDemands = await getMyDemands();

  // 3. Compute Onboarding KPIs
  const deployments = await prisma.channelDeployment.findMany({
    select: {
      clientId: true,
      status: true,
      deadline: true,
      priority: true,
    },
  });

  let channelsLive = 0;
  let channelsContracted = 0;
  let overdueCount = 0;
  const clientDeploymentCounts = new Map<string, { contracted: number; live: number }>();

  todayZero(now);

  for (const dep of deployments) {
    if (dep.status !== "nao_contratado") {
      channelsContracted++;
      if (dep.status === "no_ar") {
        channelsLive++;
      }

      if (dep.deadline && dep.status !== "no_ar" && new Date(dep.deadline).getTime() < now.getTime()) {
        overdueCount++;
      }

      const clientStat = clientDeploymentCounts.get(dep.clientId) ?? { contracted: 0, live: 0 };
      clientStat.contracted++;
      if (dep.status === "no_ar") {
        clientStat.live++;
      }
      clientDeploymentCounts.set(dep.clientId, clientStat);
    }
  }

  let activeOnboardingClients = 0;
  for (const [, stat] of clientDeploymentCounts) {
    if (stat.contracted > 0 && stat.live < stat.contracted) {
      activeOnboardingClients++;
    }
  }

  const openDemandsTotal = await prisma.demand.count({
    where: { status: { notIn: ["concluida", "cancelada"] } },
  });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const completedThisWeek = await prisma.demand.count({
    where: {
      status: "concluida",
      completedAt: { gte: sevenDaysAgo },
    },
  });

  return {
    notices,
    myDemands,
    kpis: {
      activeOnboardingClients,
      overdueCount,
      channelsLive,
      channelsContracted,
      openDemandsTotal,
      completedThisWeek,
    },
    canCreateNotice: member.role === "administrador",
  };
}

function todayZero(d: Date) {
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function markNoticeAsRead(noticeId: string): Promise<{ success: boolean }> {
  const member = await currentMember();
  if (!member) return { success: false };

  await prisma.instanceNoticeRead.upsert({
    where: {
      noticeId_userId: { noticeId, userId: member.id },
    },
    create: {
      noticeId,
      userId: member.id,
    },
    update: {},
  });

  return { success: true };
}

export async function createNotice(
  text: string,
  expiresAtDate?: string
): Promise<{ success: boolean; error?: string }> {
  const admin = await currentAdmin();
  if (!admin) {
    return { success: false, error: "Apenas administradores podem publicar avisos no mural." };
  }

  if (!text.trim()) {
    return { success: false, error: "O texto do aviso não pode ser vazio." };
  }

  const expiresAt = expiresAtDate ? new Date(expiresAtDate) : null;

  await prisma.instanceNotice.create({
    data: {
      text: text.trim(),
      authorId: admin.id,
      authorName: admin.name,
      expiresAt,
    },
  });

  await publish(prisma, DASHBOARD_TOPIC, "dashboard:atualizado", {
    authorId: admin.id,
  });

  return { success: true };
}

export async function deleteNotice(noticeId: string): Promise<{ success: boolean }> {
  const admin = await currentAdmin();
  if (!admin) return { success: false };

  await prisma.instanceNotice.delete({
    where: { id: noticeId },
  });

  await publish(prisma, DASHBOARD_TOPIC, "dashboard:atualizado", {
    noticeId,
  });

  return { success: true };
}
