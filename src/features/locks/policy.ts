// Prazos da trava de edição (D-65, demandas-spec.md 5.2).

/** Sem sinal de vida da conexão de quem edita por 2 minutos: a trava cai. */
export const LOCK_HEARTBEAT_TIMEOUT_MS = 2 * 60 * 1000;

/** Sem atividade de edição por 15 minutos: a trava cai. */
export const LOCK_IDLE_TIMEOUT_MS = 15 * 60 * 1000;

/** Aviso a quem edita 1 minuto antes de encerrar por inatividade. */
export const LOCK_IDLE_WARNING_MS = LOCK_IDLE_TIMEOUT_MS - 60 * 1000;

/** Intervalo do sinal de vida enviado pelo navegador enquanto edita. */
export const LOCK_HEARTBEAT_INTERVAL_MS = 30 * 1000;

export type LockTimes = { lastHeartbeatAt: Date; lastActivityAt: Date };

export function isLockStale(lock: LockTimes, now = new Date()) {
  return (
    now.getTime() - lock.lastHeartbeatAt.getTime() > LOCK_HEARTBEAT_TIMEOUT_MS ||
    now.getTime() - lock.lastActivityAt.getTime() > LOCK_IDLE_TIMEOUT_MS
  );
}
