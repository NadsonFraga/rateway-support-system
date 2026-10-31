"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/features/auth/session";
import { isPastMaxAge } from "@/features/auth/session-policy";
import { checkImage } from "./validate";

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

/** Recebe uma imagem do navegador, confere e guarda no banco. Devolve o endereço para usar no campo. */
export async function uploadImage(form: FormData): Promise<UploadResult> {
  const session = await getSession();
  if (!session || isPastMaxAge(session.session.createdAt) || !session.user.twoFactorEnabled) {
    return { ok: false, error: "Sua sessão expirou. Entre novamente." };
  }
  const file = form.get("arquivo");
  if (!(file instanceof File)) return { ok: false, error: "Nenhum arquivo enviado." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = checkImage(bytes);
  if (!check.ok) return check;

  const asset = await prisma.asset.create({
    data: { data: bytes, contentType: check.contentType, size: bytes.length, uploadedById: session.user.id },
    select: { id: true },
  });
  return { ok: true, url: `/arquivos/${asset.id}` };
}
