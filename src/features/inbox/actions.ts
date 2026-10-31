"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/features/auth/session";
import { isPastMaxAge } from "@/features/auth/session-policy";
import { publish } from "@/features/realtime/publish";
import { userTopic } from "@/features/realtime/types";
import { notify, toInboxItem } from "./service";
import type { InboxItem } from "./types";

const PAGE_SIZE = 30;

async function currentUser() {
  const session = await getSession();
  if (!session || isPastMaxAge(session.session.createdAt)) return null;
  if (session.user.mustChangePassword || !session.user.twoFactorEnabled) return null;
  return session.user;
}

export async function listInbox(): Promise<InboxItem[]> {
  const user = await currentUser();
  if (!user) return [];
  const rows = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
  });
  return rows.map(toInboxItem);
}

export async function markAsRead(id: string) {
  const user = await currentUser();
  if (!user) return;
  const { count } = await prisma.notification.updateMany({
    where: { id, userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  // Outras abas e computadores da mesma pessoa também apagam o ponto de não lida.
  if (count > 0) await publish(prisma, userTopic(user.id), "notificacao:lida", { ids: [id] });
}

export async function markAllAsRead() {
  const user = await currentUser();
  if (!user) return;
  await prisma.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  await publish(prisma, userTopic(user.id), "notificacao:todas-lidas", {});
}

/** Só em desenvolvimento: manda uma notificação de teste para todas as pessoas com acesso ativo. */
export async function sendTestNotification() {
  if (process.env.NODE_ENV === "production") return { sent: 0 };
  const user = await currentUser();
  if (!user) return { sent: 0 };
  const people = await prisma.user.findMany({
    where: { twoFactorEnabled: true, mustChangePassword: false, banned: { not: true } },
    select: { id: true },
  });
  await prisma.$transaction(async (tx) => {
    for (const person of people) {
      await notify(tx, person.id, {
        title: "Notificação de teste",
        body: `Enviada por ${user.name} para conferir a caixa de entrada em tempo real.`,
        target: { kind: "inicio" },
      });
    }
  });
  return { sent: people.length };
}
