import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { publish } from "@/features/realtime/publish";
import { userTopic } from "@/features/realtime/types";
import type { InboxItem, NotificationTarget } from "./types";

type Db = PrismaClient | Prisma.TransactionClient;

export function toInboxItem(row: {
  id: string;
  title: string;
  body: string | null;
  target: unknown;
  readAt: Date | null;
  createdAt: Date;
}): InboxItem {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    target: (row.target as NotificationTarget | null) ?? null,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Cria uma notificação para uma pessoa. Use dentro da mesma transação da ação que a gerou:
 * o aviso em tempo real só sai quando a transação é confirmada.
 */
export async function notify(
  db: Db,
  userId: string,
  input: { title: string; body?: string; target?: NotificationTarget }
) {
  const row = await db.notification.create({
    data: {
      userId,
      title: input.title,
      body: input.body ?? null,
      target: input.target ?? undefined,
    },
  });
  const item = toInboxItem(row);
  await publish(db, userTopic(userId), "notificacao:nova", item);
  return item;
}
