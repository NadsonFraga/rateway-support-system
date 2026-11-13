"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { publish } from "@/features/realtime/publish";
import { currentAdmin, currentMember, NOT_ALLOWED } from "../server/guard";
import { settingsTopic, type SaveResult } from "../topics";
import { CATALOG_CATEGORIES, type CatalogCategory, type CatalogEntry } from "../catalog-types";

// Catálogo (configuracoes-design-v2.md §2.3, D-88): canais, Channel Managers, PMS e serviços internos.

const withCategories = { categories: { orderBy: { category: "asc" as const } } };

function toEntry(item: {
  id: string;
  name: string;
  logoUrl: string | null;
  extranetUrl: string | null;
  companyAccount: boolean;
  archivedAt: Date | null;
  categories: { category: string; position: number }[];
}): CatalogEntry {
  const ordered = [...item.categories].sort(
    (a, b) => CATALOG_CATEGORIES.indexOf(a.category as CatalogCategory) - CATALOG_CATEGORIES.indexOf(b.category as CatalogCategory)
  );
  return {
    id: item.id,
    categories: ordered.map((entry) => entry.category as CatalogCategory),
    positions: Object.fromEntries(ordered.map((entry) => [entry.category, entry.position])),
    name: item.name,
    logoUrl: item.logoUrl,
    extranetUrl: item.extranetUrl,
    companyAccount: item.companyAccount,
    archived: !!item.archivedAt,
  };
}

async function announce(by: { id: string; name: string }) {
  await publish(prisma, settingsTopic("catalogo"), "secao:salva", { byId: by.id, byName: by.name });
}

/** Lista para a tela de Configurações (com arquivados) — leitura liberada a todos para os próximos módulos. */
export async function listCatalog(): Promise<CatalogEntry[] | null> {
  if (!(await currentMember())) return null;
  const items = await prisma.catalogItem.findMany({ include: withCategories, orderBy: { name: "asc" } });
  return items.map(toEntry);
}

const entrySchema = z.object({
  categories: z.array(z.enum(CATALOG_CATEGORIES)).min(1, "Marque pelo menos uma categoria."),
  companyAccount: z.boolean(),
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

  const { categories, ...fields } = parsed.data;
  const unique = [...new Set(categories)];
  const duplicate = await prisma.catalogItem.findFirst({
    where: {
      name: { equals: fields.name, mode: "insensitive" },
      categories: { some: { category: { in: unique } } },
      id: id ? { not: id } : undefined,
    },
  });
  if (duplicate) return { ok: false, error: "Já existe um item com esse nome nesta categoria." };

  const saved = await prisma.$transaction(async (tx) => {
    const item = id
      ? await tx.catalogItem.update({ where: { id }, data: fields })
      : await tx.catalogItem.create({ data: fields });
    const current = await tx.catalogItemCategory.findMany({ where: { itemId: item.id } });
    await tx.catalogItemCategory.deleteMany({ where: { itemId: item.id, category: { notIn: unique } } });
    for (const category of unique.filter((value) => !current.some((entry) => entry.category === value))) {
      const last = await tx.catalogItemCategory.aggregate({ where: { category }, _max: { position: true } });
      await tx.catalogItemCategory.create({ data: { itemId: item.id, category, position: (last._max.position ?? 0) + 1 } });
    }
    return tx.catalogItem.findUniqueOrThrow({ where: { id: item.id }, include: withCategories });
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
      prisma.catalogItemCategory.updateMany({ where: { itemId, category }, data: { position: index + 1 } })
    )
  );
  await announce(admin);
  return { ok: true, value: null };
}
