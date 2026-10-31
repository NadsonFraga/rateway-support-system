import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db";

export const INSTANCE_CACHE_TAG = "instancia";

export type InstanceIdentity = {
  name: string;
  logoDarkUrl: string | null;
  logoLightUrl: string | null;
  faviconUrl: string | null;
};

// Nome e logos da instância (white-label): sempre do banco, nunca do código.
export async function getInstanceIdentity(): Promise<InstanceIdentity> {
  "use cache";
  cacheTag(INSTANCE_CACHE_TAG);
  // Reconsulta o banco a cada minuto, mesmo se o nome mudar por fora (ex.: semente). A tela de
  // Configurações (Etapa 1.2) também vai invalidar o cache na hora com updateTag(INSTANCE_CACHE_TAG).
  cacheLife("minutes");

  const settings = await prisma.instanceSettings.findFirst({
    select: { name: true, logoDarkUrl: true, logoLightUrl: true, faviconUrl: true },
  });
  return settings ?? { name: "", logoDarkUrl: null, logoLightUrl: null, faviconUrl: null };
}
