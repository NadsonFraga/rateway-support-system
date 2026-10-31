// Contrato das mensagens de tempo real, compartilhado entre servidor e navegador.

/** Canal único do PostgreSQL por onde passam todas as alterações salvas. */
export const PG_CHANNEL = "realtime";

/** Mensagem publicada quando algo é salvo. `topic` define quem recebe (ex.: "registro:realtime_probe:teste"). */
export type RealtimeMessage<T = unknown> = {
  topic: string;
  event: string;
  data: T;
  /** Momento (ms) em que o servidor publicou a mensagem, para medir o atraso de entrega. */
  at: number;
};

export type PresenceUser = { userId: string; name: string };

export type PresenceMessage = { topic: string; users: PresenceUser[] };

export type LockHolder = { userId: string; name: string; acquiredAt: string };

/** Tópico de um registro editável: avisos de alteração, presença e trava usam o mesmo tópico. */
export function recordTopic(entityType: string, entityId: string) {
  return `registro:${entityType}:${entityId}`;
}

/** Tópico particular de cada usuário (avisos da trava, notificações). */
export function userTopic(userId: string) {
  return `usuario:${userId}`;
}
