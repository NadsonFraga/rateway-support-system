// Regras de tempo da sessão e da senha temporária (D-73, D-62). Um único lugar para os números.

/** Sem uso por 2 horas: a sessão expira. */
export const SESSION_IDLE_SECONDS = 2 * 60 * 60;

/** Com uso contínuo, a sessão dura no máximo 12 horas desde o login. */
export const SESSION_MAX_SECONDS = 12 * 60 * 60;

/** A cada uso, a validade é renovada se a última renovação tiver mais de 5 minutos. */
export const SESSION_REFRESH_SECONDS = 5 * 60;

/** Senha temporária vale 48 horas. */
export const TEMP_PASSWORD_TTL_MS = 48 * 60 * 60 * 1000;

export function isPastMaxAge(sessionCreatedAt: Date, now = new Date()) {
  return now.getTime() - sessionCreatedAt.getTime() > SESSION_MAX_SECONDS * 1000;
}

export function isTempPasswordExpired(expiresAt: Date | null | undefined, now = new Date()) {
  return !!expiresAt && expiresAt.getTime() < now.getTime();
}
