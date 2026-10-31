import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { PG_CHANNEL, type RealtimeMessage } from "./types";

type Db = PrismaClient | Prisma.TransactionClient;

// O PostgreSQL só entrega o aviso quando a transação é confirmada: quem recebe nunca vê dado não salvo.
// Mensagens pequenas (limite do NOTIFY: 8 KB): mande ids e o mínimo necessário para a tela.
export async function publish<T>(db: Db, topic: string, event: string, data: T) {
  const message: RealtimeMessage<T> = { topic, event, data, at: Date.now() };
  await db.$executeRaw`SELECT pg_notify(${PG_CHANNEL}, ${JSON.stringify(message)})`;
}
