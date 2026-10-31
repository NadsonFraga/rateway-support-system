import "server-only";
import { headers } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { isPastMaxAge } from "./session-policy";
import type { Role } from "./permissions";

export type CurrentUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: Role;
  image: string | null;
};

/** Lê a sessão da requisição. Nunca confiar só no cookie: a validade é conferida no banco. */
export async function getSession() {
  // Sessão é sempre da requisição atual (usa a hora e números aleatórios): nunca pré-renderizada.
  await connection();
  return auth.api.getSession({ headers: await headers() });
}

/**
 * Exige um usuário com acesso completo. Sem sessão → login; sessão com mais de 12h → sai;
 * primeiro acesso pendente (troca de senha ou autenticador) → /primeiro-acesso.
 */
export async function requireUser(): Promise<CurrentUser> {
  const session = await getSession();
  if (!session) redirect("/entrar");
  if (isPastMaxAge(session.session.createdAt)) redirect("/sair?motivo=expirada");

  const { user } = session;
  if (user.mustChangePassword || !user.twoFactorEnabled) redirect("/primeiro-acesso");

  return {
    id: user.id,
    name: user.name,
    username: user.username ?? "",
    email: user.email,
    role: user.role as Role,
    image: user.image ?? null,
  };
}
