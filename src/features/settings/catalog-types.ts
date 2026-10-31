export const CATALOG_CATEGORIES = ["canal", "channel_manager", "pms", "servico_interno"] as const;

export type CatalogCategory = (typeof CATALOG_CATEGORIES)[number];

export const CATALOG_CATEGORY_LABEL: Record<CatalogCategory, string> = {
  canal: "Canais de venda",
  channel_manager: "Channel Managers",
  pms: "PMS",
  servico_interno: "Serviços internos",
};

/** Nome no singular, para títulos de modal ("Novo canal de venda"). */
export const CATALOG_CATEGORY_SINGULAR: Record<CatalogCategory, string> = {
  canal: "canal de venda",
  channel_manager: "Channel Manager",
  pms: "PMS",
  servico_interno: "serviço interno",
};

export type CatalogEntry = {
  id: string;
  category: CatalogCategory;
  name: string;
  logoUrl: string | null;
  extranetUrl: string | null;
  position: number;
  archived: boolean;
};

/** Move um item de posição numa lista (usado pelo arrastar e pelas setas do teclado). */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
