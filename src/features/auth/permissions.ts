import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

// Três perfis (D-54). As permissões de cada módulo entram aqui conforme as etapas avançam
// (matriz em seguranca-e-cofre.md e nas specs v2).
export const ROLES = {
  administrador: "administrador",
  analistaImplantacao: "analista_implantacao",
  operadorRotina: "operador_rotina",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABEL: Record<Role, string> = {
  administrador: "Administrador",
  analista_implantacao: "Analista de Implantação",
  operador_rotina: "Operador de Rotina",
};

export const ac = createAccessControl({
  ...defaultStatements,
  edicao: ["assumir"],
});

export const roles = {
  [ROLES.administrador]: ac.newRole({ ...adminAc.statements, edicao: ["assumir"] }),
  [ROLES.analistaImplantacao]: ac.newRole({ edicao: [] }),
  [ROLES.operadorRotina]: ac.newRole({ edicao: [] }),
};
