import type { Prisma } from "@/generated/prisma/client";
import { applyMask } from "./masks";

// Gerador de códigos legíveis (D-07). Sempre chamado DENTRO da transação que cria a entidade:
// o contador é travado com SELECT … FOR UPDATE, então duas criações simultâneas nunca repetem número.

export type EntityType = "cliente" | "demanda";

type Tx = Prisma.TransactionClient;

async function nextSequence(tx: Tx, entityType: EntityType, scope: string) {
  // Garante a linha do contador; se outra transação criar ao mesmo tempo, a unicidade resolve.
  await tx.$executeRaw`
    INSERT INTO id_sequences ("entityType", scope, "lastValue")
    VALUES (${entityType}, ${scope}, 0)
    ON CONFLICT ("entityType", scope) DO NOTHING`;

  const rows = await tx.$queryRaw<{ lastValue: number }[]>`
    SELECT "lastValue" FROM id_sequences
    WHERE "entityType" = ${entityType} AND scope = ${scope}
    FOR UPDATE`;

  const next = rows[0].lastValue + 1;
  await tx.$executeRaw`
    UPDATE id_sequences SET "lastValue" = ${next}
    WHERE "entityType" = ${entityType} AND scope = ${scope}`;
  return next;
}

/** Próximo código de cliente: contador separado por sigla (HFI-001, HFI-002…). */
export async function nextClientCode(tx: Tx, sigla: string, mask: string) {
  const seq = await nextSequence(tx, "cliente", sigla);
  return applyMask(mask, { sigla, seq });
}

/** Próximo código de demanda: contador global da instância (DEM-0042…). */
export async function nextDemandCode(tx: Tx, prefixo: string, mask: string) {
  const seq = await nextSequence(tx, "demanda", "global");
  return applyMask(mask, { prefixo, seq });
}
