"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { publish } from "@/features/realtime/publish";
import { currentAdmin, currentMember, NOT_ALLOWED } from "../server/guard";
import { settingsTopic, type SaveResult } from "../topics";
import { CATALOG_CATEGORIES, type CatalogCategory, type CatalogEntry } from "../catalog-types";

// Catálogo (configuracoes-design-v2.md §2.3, D-88): canais, Channel Managers, PMS e serviços internos.

function toEntry(item: {
  id: string;
  category: string;
  name: string;
  logoUrl: string | null;
  extranetUrl: string | null;
  position: number;
  archivedAt: Date | null;
}): CatalogEntry {
  return {
    id: item.id,
    category: item.category as CatalogCategory,
    name: item.name,
    logoUrl: item.logoUrl,
    extranetUrl: item.extranetUrl,
    position: item.position,
    archived: !!item.archivedAt,
  };
}

async function announce(by: { id: string; name: string }) {
  await publish(prisma, settingsTopic("catalogo"), "secao:salva", { byId: by.id, byName: by.name });
}

/** Lista para a tela de Configurações (com arquivados) — leitura liberada a todos para os próximos módulos. */
export async function listCatalog(): Promise<CatalogEntry[] | null> {
  if (!(await currentMember())) return null;
  const items = await prisma.catalogItem.findMany({ orderBy: [{ category: "asc" }, { position: "asc" }] });
  return items.map(toEntry);
}

const entrySchema = z.object({
  category: z.enum(CATALOG_CATEGORIES),
  name: z.string().trim().min(2, "O nome precisa ter pelo menos 2 caracteres.").max(60, "Use até 60 caracteres."),
  logoUrl: z
    .string()
    .regex(/^\/arquivos\/[a-z0-9]{20,40}$/)
    .nullable(),
  extranetUrl: z
    .string()
    .trim()
    .max(300)
    .refine((value) => value === "" || /^https:\/\/[^\s]+$/i.test(value), "Use um endereço completo começando com https://")
    .transform((value) => value || null),
});

export type CatalogInput = z.input<typeof entrySchema>;

export async function saveCatalogEntry(id: string | null, input: CatalogInput): Promise<SaveResult<CatalogEntry>> {
  const admin = await currentAdmin();
  if (!admin) return NOT_ALLOWED;
  const parsed = entrySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const duplicate = await prisma.catalogItem.findFirst({
    where: {
      category: parsed.data.category,
      name: { equals: parsed.data.name, mode: "insensitive" },
      id: id ? { not: id } : undefined,
    },
  });
  if (duplicate) return { ok: false, error: "Já existe um item com esse nome nesta categoria." };

  const saved = id
    ? await prisma.catalogItem.update({ where: { id }, data: parsed.data })
    : await prisma.catalogItem.create({
        data: {
          ...parsed.data,
          position:
            ((await prisma.catalogItem.aggregate({ where: { category: parsed.data.category }, _max: { position: true } }))
              ._max.position ?? 0) + 1,
        },
      });
  await announce(admin);
  return { ok: true, value: toEntry(saved) };
}

export async function setCatalogArchived(id: string, archived: boolean): Promise<SaveResult<null>> {
  const admin = await currentAdmin();
  if (!admin) return NOT_ALLOWED;
  await prisma.catalogItem.update({ where: { id }, data: { archivedAt: archived ? new Date() : null } });
  await announce(admin);
  return { ok: true, value: null };
}

/** Nova ordem de uma categoria (lista completa de ids, na ordem em que devem aparecer). */
export async function reorderCatalog(category: CatalogCategory, orderedIds: string[]): Promise<SaveResult<null>> {
  const admin = await currentAdmin();
  if (!admin) return NOT_ALLOWED;
  if (!CATALOG_CATEGORIES.includes(category)) return { ok: false, error: "Categoria inválida." };
  await prisma.$transaction(
    orderedIds.map((itemId, index) =>
      prisma.catalogItem.updateMany({ where: { id: itemId, category }, data: { position: index + 1 } })
    )
  );
  await announce(admin);
  return { ok: true, value: null };
}
