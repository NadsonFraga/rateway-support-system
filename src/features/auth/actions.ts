"use server";

import { headers } from "next/headers";
import QRCode from "qrcode";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getInstanceIdentity } from "@/features/settings/instance";
import { auth } from "./auth";

export type AuthenticatorSetup =
  | { ok: true; qrCode: string; manualKey: string }
  | { ok: false; error: string };

const newPasswordSchema = z
  .object({
    password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(128),
    confirmation: z.string(),
  })
  .refine((data) => data.password === data.confirmation, {
    message: "As duas senhas não são iguais.",
    path: ["confirmation"],
  });

/**
 * Primeiro acesso: troca a senha temporária pela definitiva e já prepara o Google Authenticator.
 * Só funciona para quem está logado com troca de senha pendente.
 */
export async function setInitialPassword(input: {
  password: string;
  confirmation: string;
}): Promise<AuthenticatorSetup> {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return { ok: false, error: "Sua sessão expirou. Entre novamente." };
  if (!session.user.mustChangePassword) return { ok: false, error: "A senha já foi definida." };

  const parsed = newPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const context = await auth.$context;
  const hash = await context.password.hash(parsed.data.password);
  await context.internalAdapter.updatePassword(session.user.id, hash);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { mustChangePassword: false, tempPasswordExpiresAt: null },
  });

  return startAuthenticator(parsed.data.password, requestHeaders);
}

/** Quem já trocou a senha mas não terminou o autenticador confirma a senha para gerar um QR Code novo. */
export async function restartAuthenticator(password: string): Promise<AuthenticatorSetup> {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return { ok: false, error: "Sua sessão expirou. Entre novamente." };
  if (session.user.mustChangePassword) return { ok: false, error: "Defina sua senha primeiro." };
  return startAuthenticator(password, requestHeaders);
}

async function startAuthenticator(password: string, requestHeaders: Headers): Promise<AuthenticatorSetup> {
  const instance = await getInstanceIdentity();
  try {
    const result = await auth.api.enableTwoFactor({
      body: { password, issuer: instance.name || undefined },
      headers: requestHeaders,
    });
    if (!("totpURI" in result) || !result.totpURI) {
      return { ok: false, error: "Não foi possível gerar o QR Code. Tente de novo." };
    }
    const manualKey = new URL(result.totpURI).searchParams.get("secret") ?? "";
    const qrCode = await QRCode.toDataURL(result.totpURI, { width: 360, margin: 1 });
    return { ok: true, qrCode, manualKey };
  } catch {
    return { ok: false, error: "Senha incorreta." };
  }
}
