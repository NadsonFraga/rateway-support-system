import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import {
  acquireLock,
  holdsLock,
  locksNearIdleTimeout,
  releaseLock,
  releaseStaleLocks,
  takeOverLock,
} from "@/features/locks/service";

const ENTITY = "teste_trava";
const ID = "registro-1";
const ANA = "teste-ana";
const BIA = "teste-bia";
const ADM = "teste-adm";

async function ageLock(column: "lastHeartbeatAt" | "lastActivityAt", seconds: number) {
  // Simula o passar do tempo voltando o relógio da trava no banco (UTC, como o Prisma grava).
  if (column === "lastHeartbeatAt") {
    await prisma.$executeRaw`UPDATE edit_locks SET "lastHeartbeatAt" = (now() AT TIME ZONE 'UTC') - (${seconds} * interval '1 second') WHERE "entityType" = ${ENTITY}`;
  } else {
    await prisma.$executeRaw`UPDATE edit_locks SET "lastActivityAt" = (now() AT TIME ZONE 'UTC') - (${seconds} * interval '1 second') WHERE "entityType" = ${ENTITY}`;
  }
}

describe("trava de edição (D-65)", () => {
  beforeAll(async () => {
    for (const [id, name] of [
      [ANA, "Ana Teste"],
      [BIA, "Bia Teste"],
      [ADM, "Adm Teste"],
    ]) {
      await prisma.user.upsert({ where: { id }, update: {}, create: { id, name, email: `${id}@teste.invalid` } });
    }
  });

  beforeEach(async () => {
    await prisma.editLock.deleteMany({ where: { entityType: ENTITY } });
  });

  afterAll(async () => {
    await prisma.editLock.deleteMany({ where: { entityType: ENTITY } });
    await prisma.user.deleteMany({ where: { id: { in: [ANA, BIA, ADM] } } });
    await prisma.$disconnect();
  });

  it("primeira pessoa trava; a segunda vê quem está editando", async () => {
    const ana = await acquireLock(prisma, ENTITY, ID, ANA);
    const bia = await acquireLock(prisma, ENTITY, ID, BIA);
    expect(ana.ok).toBe(true);
    expect(bia.ok).toBe(false);
    expect(bia.holder.name).toBe("Ana Teste");
  });

  it("disputa simultânea: só uma pessoa vence", async () => {
    const results = await Promise.all([
      acquireLock(prisma, ENTITY, ID, ANA),
      acquireLock(prisma, ENTITY, ID, BIA),
      acquireLock(prisma, ENTITY, ID, ADM),
    ]);
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    const winner = results.find((result) => result.ok)!.holder.userId;
    expect(results.every((result) => result.holder.userId === winner)).toBe(true);
  });

  it("liberar só funciona para quem tem a trava", async () => {
    await acquireLock(prisma, ENTITY, ID, ANA);
    expect(await releaseLock(prisma, ENTITY, ID, BIA)).toBe(false);
    expect(await holdsLock(prisma, ENTITY, ID, ANA)).toBe(true);
    expect(await releaseLock(prisma, ENTITY, ID, ANA)).toBe(true);
    expect((await acquireLock(prisma, ENTITY, ID, BIA)).ok).toBe(true);
  });

  it("cai após 2 minutos sem conexão", async () => {
    await acquireLock(prisma, ENTITY, ID, ANA);
    await ageLock("lastHeartbeatAt", 90);
    expect(await releaseStaleLocks(prisma)).toBe(0);
    await ageLock("lastHeartbeatAt", 121);
    expect(await releaseStaleLocks(prisma)).toBe(1);
    expect(await holdsLock(prisma, ENTITY, ID, ANA)).toBe(false);
  });

  it("cai após 15 minutos sem atividade, com aviso no 14º minuto", async () => {
    await acquireLock(prisma, ENTITY, ID, ANA);
    await ageLock("lastActivityAt", 14 * 60 + 5);
    const near = await locksNearIdleTimeout(prisma);
    expect(near.some((lock) => lock.entityType === ENTITY && lock.userId === ANA)).toBe(true);
    expect(await releaseStaleLocks(prisma)).toBe(0);
    await ageLock("lastActivityAt", 15 * 60 + 1);
    expect(await releaseStaleLocks(prisma)).toBe(1);
  });

  it("trava caducada pode ser tomada por outra pessoa sem esperar o vigia", async () => {
    await acquireLock(prisma, ENTITY, ID, ANA);
    await ageLock("lastHeartbeatAt", 121);
    expect((await acquireLock(prisma, ENTITY, ID, BIA)).ok).toBe(true);
  });

  it("Administrador assume a edição", async () => {
    await acquireLock(prisma, ENTITY, ID, ANA);
    const holder = await takeOverLock(prisma, ENTITY, ID, ADM);
    expect(holder?.userId).toBe(ADM);
    expect(await holdsLock(prisma, ENTITY, ID, ANA)).toBe(false);
  });
});
