"use server";

import { headers } from "next/headers";
import QRCode from "qrcode";
import { createOTP } from "@better-auth/utils/otp";
import { generateRandomString, symmetricDecrypt, symmetricEncrypt } from "better-auth/crypto";
import { z } from "zod";
import { auth } from "@/features/auth/auth";
import { getInstanceIdentity } from "@/features/settings/instance";
import { getSession } from "@/features/auth/session";
import { prisma } from "@/lib/db";
import { currentMember } from "../server/guard";
import type { SaveResult } from "../topics";

// Minha Conta (configuracoes-design-v2.md §3): perfil, troca de senha e autenticador.

export type ProfileValues = { name: string; image: string | null };

export async function loadProfile(): Promise<(ProfileValues & { username: string; email: string }) | null> {
  const user = await currentMember();
  if (!user) return null;
  return { name: user.name, image: user.image ?? null, username: user.username ?? "", email: user.email };
}

const profileSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(80, "Use até 80 caracteres."),
  image: z
    .string()
    .regex(/^\/arquivos\/[a-z0-9]{20,40}$/)
    .nullable(),
});

export async function saveProfile(input: ProfileValues): Promise<SaveResult<ProfileValues>> {
  const user = await currentMember();
  if (!user) return { ok: false, error: "Sua sessão expirou. Entre novamente." };
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  await auth.api.updateUser({ body: { name: parsed.data.name, image: parsed.data.image }, headers: await headers() });
  return { ok: true, value: parsed.data };
}

const passwordSchema = z
  .object({
    current: z.string().min(1, "Informe a senha atual."),
    password: z.string().min(8, "A senha nova precisa ter pelo menos 8 caracteres.").max(128),
    confirmation: z.string(),
  })
  .refine((data) => data.password === data.confirmation, { message: "As duas senhas não são iguais.", path: ["confirmation"] });

export async function changeOwnPassword(input: z.input<typeof passwordSchema>): Promise<SaveResult<null>> {
  const session = await getSession();
  const user = await currentMember();
  if (!user || !session) return { ok: false, error: "Sua sessão expirou. Entre novamente." };
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  try {
    await auth.api.changePassword({
      body: { currentPassword: parsed.data.current, newPassword: parsed.data.password },
      headers: await headers(),
    });
  } catch {
    return { ok: false, error: "Senha atual incorreta." };
  }
  // Encerra só as OUTRAS sessões: quem estava logado com a senha antiga em outro computador sai;
  // esta sessão continua (a opção pronta do login apagaria também a atual).
  await prisma.session.deleteMany({ where: { userId: user.id, token: { not: session.session.token } } });
  return { ok: true, value: null };
}

const PENDING_PREFIX = "autenticador-pendente:";
const PENDING_MINUTES = 10;

async function verifyOwnPassword(userId: string, password: string) {
  const context = await auth.$context;
  const account = await prisma.account.findFirst({ where: { userId, providerId: "credential" }, select: { password: true } });
  if (!account?.password) return false;
  return context.password.verify({ password, hash: account.password });
}

/**
 * Reconfigurar o Google Authenticator (troca de celular), passo 1: confere a senha e prepara um segredo novo.
 * O autenticador antigo continua valendo até o código do novo ser confirmado: ninguém fica trancado do lado de fora.
 */
export async function restartOwnAuthenticator(
  password: string
): Promise<SaveResult<{ qrCode: string; manualKey: string }>> {
  const user = await currentMember();
  if (!user) return { ok: false, error: "Sua sessão expirou. Entre novamente." };
  if (!(await verifyOwnPassword(user.id, password))) return { ok: false, error: "Senha incorreta." };

  const context = await auth.$context;
  const secret = generateRandomString(32);
  const identifier = `${PENDING_PREFIX}${user.id}`;
  await prisma.verification.deleteMany({ where: { identifier } });
  await prisma.verification.create({
    data: {
      id: generateRandomString(24),
      identifier,
      value: await symmetricEncrypt({ key: context.secretConfig, data: secret }),
      expiresAt: new Date(Date.now() + PENDING_MINUTES * 60_000),
    },
  });
  const instance = await getInstanceIdentity();
  const totpURI = createOTP(secret, { digits: 6, period: 30 }).url(instance.name || "Sistema", user.username ?? user.email);
  const manualKey = new URL(totpURI).searchParams.get("secret") ?? "";
  return { ok: true, value: { qrCode: await QRCode.toDataURL(totpURI, { width: 360, margin: 1 }), manualKey } };
}

/** Passo 2: confere o código do aplicativo e só então troca o segredo antigo pelo novo. */
export async function confirmOwnAuthenticator(code: string): Promise<SaveResult<null>> {
  const user = await currentMember();
  if (!user) return { ok: false, error: "Sua sessão expirou. Entre novamente." };
  const identifier = `${PENDING_PREFIX}${user.id}`;
  const pending = await prisma.verification.findFirst({ where: { identifier, expiresAt: { gt: new Date() } } });
  if (!pending) return { ok: false, error: "O QR Code expirou. Gere um novo." };

  const context = await auth.$context;
  const secret = await symmetricDecrypt({ key: context.secretConfig, data: pending.value });
  if (!/^\d{6}$/.test(code) || !(await createOTP(secret, { digits: 6, period: 30 }).verify(code))) {
    return { ok: false, error: "Código incorreto. Digite o código atual do aplicativo." };
  }
  await prisma.$transaction([
    prisma.twoFactor.updateMany({
      where: { userId: user.id },
      data: { secret: pending.value, verified: true, failedVerificationCount: 0, lockedUntil: null },
    }),
    prisma.verification.deleteMany({ where: { identifier } }),
  ]);
  return { ok: true, value: null };
}
