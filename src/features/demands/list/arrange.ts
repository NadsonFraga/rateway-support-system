import { compareUrgency, dueMoment, DEMAND_STATUSES, DEMAND_STATUS_LABEL } from "../rules";
import type { DemandListItem } from "../types";

// Classificar e agrupar a lista de Demandas (D-111).

export type SortKey = "urgencia" | "titulo" | "cliente" | "situacao" | "atribuidos" | "prazo";
export type Sort = { key: SortKey; dir: "asc" | "desc" };
export type GroupKey = "prioridade" | "nenhum" | "situacao" | "cliente" | "plataforma" | "atribuido";

export const SORT_LABEL: Record<SortKey, string> = {
  urgencia: "Urgência",
  titulo: "Título",
  cliente: "Cliente",
  situacao: "Situação",
  atribuidos: "Atribuídos",
  prazo: "Prazo",
};

export const GROUP_LABEL: Record<GroupKey, string> = {
  prioridade: "Prioridade / Urgência",
  nenhum: "Sem agrupamento",
  situacao: "Situação",
  cliente: "Cliente",
  plataforma: "Plataforma",
  atribuido: "Atribuído",
};

const text = (value: string | null | undefined) => (value ?? "").toLocaleLowerCase("pt-BR");
/** Sem valor fica sempre no fim, em qualquer direção. */
function byText(a: string | null, b: string | null) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return text(a).localeCompare(text(b), "pt-BR");
}

export function sortDemands(list: DemandListItem[], sort: Sort, now: Date = new Date()) {
  const sign = sort.dir === "asc" ? 1 : -1;
  const compare = (a: DemandListItem, b: DemandListItem): number => {
    switch (sort.key) {
      case "urgencia":
        return sign * compareUrgency(a, b, now);
      case "titulo":
        return sign * byText(a.title, b.title);
      case "cliente":
        return !a.client || !b.client ? byText(a.client?.name ?? null, b.client?.name ?? null) : sign * byText(a.client.name, b.client.name);
      case "situacao":
        return sign * (DEMAND_STATUSES.indexOf(a.status) - DEMAND_STATUSES.indexOf(b.status)) || compareUrgency(a, b, now);
      case "atribuidos": {
        const first = (item: DemandListItem) => item.assignees[0]?.name ?? null;
        return !first(a) || !first(b) ? byText(first(a), first(b)) : sign * byText(first(a), first(b));
      }
      case "prazo": {
        const due = (item: DemandListItem) => dueMoment(item.dueDate, item.dueTime)?.getTime() ?? null;
        const [x, y] = [due(a), due(b)];
        if (x === null || y === null) return x === y ? 0 : x === null ? 1 : -1;
        return sign * (x - y);
      }
    }
  };
  return [...list].sort(compare);
}

export type DemandGroup = { key: string; label: string; items: DemandListItem[] };

/** Grupos na ordem natural (urgência na ordem de severidade; situação na ordem do fluxo; os demais em ordem alfabética). */
export function groupDemands(list: DemandListItem[], group: GroupKey): DemandGroup[] {
  if (group === "nenhum") return [{ key: "todas", label: "", items: list }];
  if (group === "prioridade") {
    const ORDER = [
      { key: "critica", label: "Urgente", match: (p: string) => p === "critica" || p === "urgente" },
      { key: "alta", label: "Alta", match: (p: string) => p === "alta" },
      { key: "normal", label: "Média", match: (p: string) => p === "normal" || p === "media" || !p },
      { key: "baixa", label: "Baixa", match: (p: string) => p === "baixa" },
    ];
    const res: DemandGroup[] = [];
    const assignedIds = new Set<string>();

    for (const groupDef of ORDER) {
      const matched = list.filter((d) => !assignedIds.has(d.id) && groupDef.match(d.priority));
      for (const item of matched) assignedIds.add(item.id);
      if (matched.length > 0) {
        res.push({ key: groupDef.key, label: groupDef.label, items: matched });
      }
    }

    const remaining = list.filter((d) => !assignedIds.has(d.id));
    if (remaining.length > 0) {
      const normalGroup = res.find((g) => g.key === "normal");
      if (normalGroup) {
        normalGroup.items.push(...remaining);
      } else {
        res.push({ key: "normal", label: "Média", items: remaining });
      }
    }

    return res;
  }
  const groups = new Map<string, DemandGroup>();
  const put = (key: string, label: string, item: DemandListItem) => {
    const entry = groups.get(key) ?? { key, label, items: [] };
    entry.items.push(item);
    groups.set(key, entry);
  };
  for (const item of list) {
    if (group === "situacao") put(item.status, DEMAND_STATUS_LABEL[item.status], item);
    else if (group === "cliente") put(item.client?.id ?? "", item.client?.name ?? "Sem cliente", item);
    else if (group === "plataforma") put(item.platform?.id ?? "", item.platform?.name ?? "Sem plataforma", item);
    else if (item.assignees.length === 0) put("", "Ninguém atribuído", item);
    // Quem tem várias pessoas aparece no grupo de cada uma.
    else for (const person of item.assignees) put(person.id, person.name, item);
  }
  const result = [...groups.values()];
  if (group === "situacao") return result.sort((a, b) => DEMAND_STATUSES.indexOf(a.key as never) - DEMAND_STATUSES.indexOf(b.key as never));
  return result.sort((a, b) => (a.key === "" ? 1 : b.key === "" ? -1 : byText(a.label, b.label)));
}
