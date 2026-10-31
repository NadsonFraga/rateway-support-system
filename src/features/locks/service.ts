import type { PrismaClient } from "@/generated/prisma/client";
import { publish } from "@/features/realtime/publish";
import { recordTopic, userTopic, type LockHolder } from "@/features/realtime/types";
import { LOCK_HEARTBEAT_TIMEOUT_MS, LOCK_IDLE_TIMEOUT_MS, LOCK_IDLE_WARNING_MS } from "./policy";

// Trava de edição (D-65): uma pessoa por registro. A disputa é resolvida pelo banco numa única
// instrução atômica — se duas pessoas clicarem em Editar ao mesmo tempo, a primeira gravação vence.

const HEARTBEAT_SECONDS = LOCK_HEARTBEAT_TIMEOUT_MS / 1000;
const IDLE_SECONDS = LOCK_IDLE_TIMEOUT_MS / 1000;

export type AcquireResult = { ok: true; holder: LockHolder } | { ok: false; holder: LockHolder };

async function getHolder(db: PrismaClient, entityType: string, entityId: string): Promise<LockHolder | null> {
  const lock = await db.editLock.findUnique({
    where: { entityType_entityId: { entityType, entityId } },
    select: { userId: true, acquiredAt: true, user: { select: { name: true } } },
  });
  return lock ? { userId: lock.userId, name: lock.user.name, acquiredAt: lock.acquiredAt.toISOString() } : null;
}

export async function acquireLock(
  db: PrismaClient,
  entityType: string,
  entityId: string,
  userId: string
): Promise<AcquireResult> {
  // Cria a trava; se já existir, só toma posse quando ela é do próprio usuário ou já caducou.
  const rows = await db.$queryRaw<{ userId: string }[]>`
    INSERT INTO edit_locks ("entityType", "entityId", "userId", "acquiredAt", "lastHeartbeatAt", "lastActivityAt")
    VALUES (${entityType}, ${entityId}, ${userId}, (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC'))
    ON CONFLICT ("entityType", "entityId") DO UPDATE
      SET "userId" = EXCLUDED."userId", "acquiredAt" = (now() AT TIME ZONE 'UTC'), "lastHeartbeatAt" = (now() AT TIME ZONE 'UTC'), "lastActivityAt" = (now() AT TIME ZONE 'UTC')
      WHERE edit_locks."userId" = EXCLUDED."userId"
         OR edit_locks."lastHeartbeatAt" < (now() AT TIME ZONE 'UTC') - (${HEARTBEAT_SECONDS} * interval '1 second')
         OR edit_locks."lastActivityAt" < (now() AT TIME ZONE 'UTC') - (${IDLE_SECONDS} * interval '1 second')
    RETURNING "userId"`;

  const holder = await getHolder(db, entityType, entityId);
  if (!holder) throw new Error("Trava não encontrada logo após a gravação.");

  if (rows.length === 0) return { ok: false, holder };

  await publish(db, recordTopic(entityType, entityId), "trava:adquirida", { holder });
  return { ok: true, holder };
}

/** Libera a trava de quem está editando (Salvar ou Esc). Não faz nada se a trava for de outra pessoa. */
export async function releaseLock(db: PrismaClient, entityType: string, entityId: string, userId: string) {
  const { count } = await db.editLock.deleteMany({ where: { entityType, entityId, userId } });
  if (count > 0) {
    await publish(db, recordTopic(entityType, entityId), "trava:liberada", { reason: "salvo-ou-descartado" });
  }
  return count > 0;
}

/** Confere se o usuário ainda é dono da trava (antes de salvar). */
export async function holdsLock(db: PrismaClient, entityType: string, entityId: string, userId: string) {
  const lock = await db.editLock.findUnique({ where: { entityType_entityId: { entityType, entityId } } });
  return lock?.userId === userId;
}

/** Administrador assume a edição: as alterações não salvas de quem editava são descartadas. */
export async function takeOverLock(db: PrismaClient, entityType: string, entityId: string, adminId: string) {
  const previous = await getHolder(db, entityType, entityId);
  await db.$executeRaw`
    INSERT INTO edit_locks ("entityType", "entityId", "userId", "acquiredAt", "lastHeartbeatAt", "lastActivityAt")
    VALUES (${entityType}, ${entityId}, ${adminId}, (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC'), (now() AT TIME ZONE 'UTC'))
    ON CONFLICT ("entityType", "entityId") DO UPDATE
      SET "userId" = EXCLUDED."userId", "acquiredAt" = (now() AT TIME ZONE 'UTC'), "lastHeartbeatAt" = (now() AT TIME ZONE 'UTC'), "lastActivityAt" = (now() AT TIME ZONE 'UTC')`;
  const holder = await getHolder(db, entityType, entityId);
  await publish(db, recordTopic(entityType, entityId), "trava:assumida", {
    holder,
    previousUserId: previous?.userId ?? null,
  });
  if (previous && previous.userId !== adminId) {
    await publish(db, userTopic(previous.userId), "trava:perdida", { entityType, entityId, holder });
  }
  return holder;
}

/** Sinal de vida (conexão) e, opcionalmente, atividade de edição (digitação). */
export async function touchLock(
  db: PrismaClient,
  entityType: string,
  entityId: string,
  userId: string,
  activity: boolean
) {
  // Hora do próprio banco (em UTC, como o Prisma grava), para comparar sempre no mesmo relógio.
  if (activity) {
    await db.$executeRaw`
      UPDATE edit_locks SET "lastHeartbeatAt" = (now() AT TIME ZONE 'UTC'), "lastActivityAt" = (now() AT TIME ZONE 'UTC')
      WHERE "entityType" = ${entityType} AND "entityId" = ${entityId} AND "userId" = ${userId}`;
  } else {
    await db.$executeRaw`
      UPDATE edit_locks SET "lastHeartbeatAt" = (now() AT TIME ZONE 'UTC')
      WHERE "entityType" = ${entityType} AND "entityId" = ${entityId} AND "userId" = ${userId}`;
  }
}

type StaleLock = { entityType: string; entityId: string; userId: string; idle: boolean };

/** Vigia: derruba travas sem conexão há 2 min ou sem atividade há 15 min, e avisa todos. */
export async function releaseStaleLocks(db: PrismaClient) {
  const released = await db.$queryRaw<StaleLock[]>`
    DELETE FROM edit_locks
    WHERE "lastHeartbeatAt" < (now() AT TIME ZONE 'UTC') - (${HEARTBEAT_SECONDS} * interval '1 second')
       OR "lastActivityAt" < (now() AT TIME ZONE 'UTC') - (${IDLE_SECONDS} * interval '1 second')
    RETURNING "entityType", "entityId", "userId",
      ("lastActivityAt" < (now() AT TIME ZONE 'UTC') - (${IDLE_SECONDS} * interval '1 second')) AS idle`;

  for (const lock of released) {
    const reason = lock.idle ? "inatividade" : "desconexao";
    await publish(db, recordTopic(lock.entityType, lock.entityId), "trava:liberada", { reason });
    await publish(db, userTopic(lock.userId), "trava:encerrada", {
      entityType: lock.entityType,
      entityId: lock.entityId,
      reason,
    });
  }
  return released.length;
}

/** Travas a 1 minuto de cair por inatividade (para avisar quem edita). */
export async function locksNearIdleTimeout(db: PrismaClient) {
  const warningSeconds = LOCK_IDLE_WARNING_MS / 1000;
  return db.$queryRaw<{ entityType: string; entityId: string; userId: string; acquiredAt: Date }[]>`
    SELECT "entityType", "entityId", "userId", "acquiredAt" FROM edit_locks
    WHERE "lastActivityAt" < (now() AT TIME ZONE 'UTC') - (${warningSeconds} * interval '1 second')`;
}
