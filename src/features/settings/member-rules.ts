// Proteções da tela de Membros (Etapa 1.2). Função pura para testar sem banco.

export type MemberChange =
  | { type: "perfil"; newRole: string }
  | { type: "desativar" }
  | { type: "nova-senha" };

export type MemberChangeContext = {
  actorId: string;
  targetId: string;
  targetIsAdmin: boolean;
  /** Administradores ativos (sem contar desativados). */
  activeAdmins: number;
  adminRole: string;
};

/** Devolve o motivo para bloquear a mudança, ou null se pode seguir. */
export function memberChangeProblem(change: MemberChange, context: MemberChangeContext): string | null {
  const self = context.actorId === context.targetId;
  if (change.type === "desativar" && self) return "Você não pode desativar a própria conta.";
  if (change.type === "nova-senha" && self) return "Para trocar a sua senha, use Minha Conta.";
  if (change.type === "perfil" && self && change.newRole !== context.adminRole) {
    return "Você não pode tirar o próprio perfil de Administrador.";
  }
  const removesAdmin =
    context.targetIsAdmin &&
    (change.type === "desativar" || (change.type === "perfil" && change.newRole !== context.adminRole));
  if (removesAdmin && context.activeAdmins <= 1) return "É preciso manter pelo menos um Administrador ativo.";
  return null;
}
