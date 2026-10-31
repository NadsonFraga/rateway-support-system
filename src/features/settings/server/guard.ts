import "server-only";
import { getSession } from "@/features/auth/session";
import { isPastMaxAge } from "@/features/auth/session-policy";
import { ROLES } from "@/features/auth/permissions";

/** Pessoa logada com acesso completo (primeiro acesso concluído), ou null. */
export async function currentMember() {
  const session = await getSession();
  if (!session || isPastMaxAge(session.session.createdAt)) return null;
  if (session.user.mustChangePassword || !session.user.twoFactorEnabled) return null;
  return session.user;
}

/** Só Administrador acessa Configurações do Sistema; o servidor confere a cada chamada. */
export async function currentAdmin() {
  const user = await currentMember();
  return user && user.role === ROLES.administrador ? user : null;
}

export const NOT_ALLOWED = { ok: false as const, error: "Você não tem permissão para fazer isso." };
