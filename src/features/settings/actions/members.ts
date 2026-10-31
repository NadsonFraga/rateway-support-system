"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/features/auth/auth";
import { ROLES, type Role } from "@/features/auth/permissions";
import { generateTempPassword, tempPasswordExpiry } from "@/features/auth/temp-password";
import { normalizeUsername, USERNAME_PROBLEM_MESSAGE, validateUsername } from "@/features/auth/username";
import { publish } from "@/features/realtime/publish";
import { userTopic } from "@/features/realtime/types";
import { currentAdmin, NOT_ALLOWED } from "../server/guard";
import { memberChangeProblem, type MemberChange } from "../member-rules";
import { settingsTopic, type SaveResult } from "../topics";

// Membros (configuracoes-design-v2.md §2.6, D-62, D-85).

export type MemberRow = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: Role;
  image: string | null;
  active: boolean;
  /** "ativo" | "pendente" | "aguardando-primeiro-acesso" */
  twoFactor: "ativo" | "pendente" | "aguardando-primeiro-acesso";
};

const ROLE_VALUES = Object.values(ROLES) as [Role, ...Role[]];

export async function listMembers(): Promise<MemberRow[] | null> {
  if (!(await currentAdmin())) return null;
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    username: user.username ?? "",
    email: user.email,
    role: (user.role ?? ROLES.operadorRotina) as Role,
    image: user.image,
    active: !user.banned,
    twoFactor: user.mustChangePassword ? "aguardando-primeiro-acesso" : user.twoFactorEnabled ? "ativo" : "pendente",
  }));
}

async function announce(by: { id: string; name: string }) {
  await publish(prisma, settingsTopic("membros"), "secao:salva", { byId: by.id, byName: by.name });
}

/** Corta o acesso de alguém na hora: encerra as sessões e derruba a conexão de tempo real. */
async function endAccess(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
  await publish(prisma, userTopic(userId), "conta:encerrada", {});
}

const newMemberSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(80),
  username: z.string().transform(normalizeUsername),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido, como nome@empresa.com."),
  role: z.enum(ROLE_VALUES),
});

export type NewMemberInput = z.input<typeof newMemberSchema>;

export async function createMember(input: NewMemberInput): Promise<SaveResult<{ tempPassword: string }>> {
  const admin = await currentAdmin();
  if (!admin) return NOT_ALLOWED;
  const parsed = newMemberSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const usernameProblem = validateUsername(parsed.data.username);
  if (usernameProblem) return { ok: false, error: USERNAME_PROBLEM_MESSAGE[usernameProblem] };

  const taken = await prisma.user.findFirst({
    where: { OR: [{ username: parsed.data.username }, { email: parsed.data.email }] },
    select: { username: true },
  });
  if (taken) {
    return {
      ok: false,
      error: taken.username === parsed.data.username ? "Esse usuário já existe. Escolha outro." : "Esse e-mail já está em uso.",
    };
  }

  const tempPassword = generateTempPassword();
  await auth.api.createUser({
    body: {
      email: parsed.data.email,
      name: parsed.data.name,
      password: tempPassword,
      role: parsed.data.role,
      data: { username: parsed.data.username, mustChangePassword: true, tempPasswordExpiresAt: tempPasswordExpiry() },
    },
    headers: await headers(),
  });
  await announce(admin);
  return { ok: true, value: { tempPassword } };
}

async function check(adminId: string, targetId: string, change: MemberChange) {
  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { role: true } });
  if (!target) return "Membro não encontrado.";
  const activeAdmins = await prisma.user.count({ where: { role: ROLES.administrador, banned: { not: true } } });
  return memberChangeProblem(change, {
    actorId: adminId,
    targetId,
    targetIsAdmin: target.role === ROLES.administrador,
    activeAdmins,
    adminRole: ROLES.administrador,
  });
}

export async function changeMemberRole(userId: string, role: Role): Promise<SaveResult<null>> {
  const admin = await currentAdmin();
  if (!admin) return NOT_ALLOWED;
  if (!ROLE_VALUES.includes(role)) return { ok: false, error: "Perfil inválido." };
  const problem = await check(admin.id, userId, { type: "perfil", newRole: role });
  if (problem) return { ok: false, error: problem };

  await auth.api.setRole({ body: { userId, role }, headers: await headers() });
  await announce(admin);
  return { ok: true, value: null };
}

export async function setMemberActive(userId: string, active: boolean): Promise<SaveResult<null>> {
  const admin = await currentAdmin();
  if (!admin) return NOT_ALLOWED;
  if (!active) {
    const problem = await check(admin.id, userId, { type: "desativar" });
    if (problem) return { ok: false, error: problem };
    await auth.api.banUser({ body: { userId }, headers: await headers() });
    await endAccess(userId);
  } else {
    await auth.api.unbanUser({ body: { userId }, headers: await headers() });
  }
  await announce(admin);
  return { ok: true, value: null };
}

/** Nova senha temporária (48h): também serve para quem esqueceu a senha. Refaz o primeiro acesso. */
export async function resetMemberPassword(userId: string): Promise<SaveResult<{ tempPassword: string }>> {
  const admin = await currentAdmin();
  if (!admin) return NOT_ALLOWED;
  const problem = await check(admin.id, userId, { type: "nova-senha" });
  if (problem) return { ok: false, error: problem };

  const tempPassword = generateTempPassword();
  await auth.api.setUserPassword({ body: { userId, newPassword: tempPassword }, headers: await headers() });
  await prisma.$transaction([
    prisma.twoFactor.deleteMany({ where: { userId } }),
    prisma.user.update({
      where: { id: userId },
      data: { mustChangePassword: true, tempPasswordExpiresAt: tempPasswordExpiry(), twoFactorEnabled: false },
    }),
  ]);
  await endAccess(userId);
  await announce(admin);
  return { ok: true, value: { tempPassword } };
}
