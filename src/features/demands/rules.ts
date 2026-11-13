// Regras puras de demandas (D-95 a D-102, D-02, D-71). Sem banco: fáceis de testar.
import type { Status } from "@/components/ui/status";

export const DEMAND_STATUSES = ["a_fazer", "em_andamento", "aguardando_retorno", "concluida", "cancelada"] as const;
export type DemandStatus = (typeof DEMAND_STATUSES)[number];

export const DEMAND_STATUS_LABEL: Record<DemandStatus, string> = {
  a_fazer: "A Fazer",
  em_andamento: "Em Andamento",
  aguardando_retorno: "Aguardando Retorno",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

/** Colunas do Kanban (D-99): Cancelada fica fora. */
export const BOARD_COLUMNS: DemandStatus[] = ["a_fazer", "em_andamento", "aguardando_retorno", "concluida"];

export const DEMAND_PRIORITIES = ["normal", "alta", "critica"] as const;
export type DemandPriority = (typeof DEMAND_PRIORITIES)[number];

export const DEMAND_PRIORITY_LABEL: Record<DemandPriority, string> = {
  normal: "Normal",
  alta: "Alta",
  critica: "Crítica",
};

export function isClosed(status: DemandStatus) {
  return status === "concluida" || status === "cancelada";
}

/** Momento do prazo no fuso do navegador. Sem hora, vale o fim do dia. */
export function dueMoment(dueDate: string | null, dueTime: string | null): Date | null {
  if (!dueDate) return null;
  const [year, month, day] = dueDate.split("-").map(Number);
  const [hour, minute] = dueTime ? dueTime.split(":").map(Number) : [23, 59];
  return new Date(year, month - 1, day, hour, minute, dueTime ? 0 : 59);
}

const DAY = 24 * 60 * 60 * 1000;

type Urgency = { status: DemandStatus; priority: DemandPriority; dueDate: string | null; dueTime: string | null };

/**
 * Cor do ponto (D-100), primeira regra que valer: Concluída = verde; prazo vencido ou Crítica = coral;
 * prazo < 24h = âmbar; Aguardando Retorno = azul; demais = cinza.
 */
export function demandDot(demand: Urgency, now: Date = new Date()): Status {
  if (demand.status === "concluida") return "concluida";
  if (demand.status === "cancelada") return "em-andamento";
  const due = dueMoment(demand.dueDate, demand.dueTime);
  if (demand.priority === "critica" || (due && due.getTime() < now.getTime())) return "atrasada";
  if (due && due.getTime() - now.getTime() < DAY) return "atencao-prazo";
  if (demand.status === "aguardando_retorno") return "aguardando-retorno";
  return "em-andamento";
}

const DOT_RANK: Record<Status, number> = {
  atrasada: 0,
  "atencao-prazo": 1,
  "aguardando-retorno": 2,
  "em-andamento": 3,
  concluida: 4,
};

/** Ordem por urgência e, dentro de cada grupo, pelo prazo mais próximo (sem prazo por último). */
export function compareUrgency<T extends Urgency>(a: T, b: T, now: Date = new Date()) {
  const rank = DOT_RANK[demandDot(a, now)] - DOT_RANK[demandDot(b, now)];
  if (rank) return rank;
  const dueA = dueMoment(a.dueDate, a.dueTime)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const dueB = dueMoment(b.dueDate, b.dueTime)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  return dueA - dueB;
}

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Texto do prazo: "Hoje 18h", "Amanhã", "Ontem", "12 nov", "12 nov 2027". */
export function dueLabel(dueDate: string | null, dueTime: string | null, now: Date = new Date()) {
  const due = dueMoment(dueDate, dueTime);
  if (!due) return "";
  const time = dueTime ? ` ${dueTime.endsWith(":00") ? `${Number(dueTime.slice(0, 2))}h` : dueTime.replace(":", "h")}` : "";
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (sameDay(due, now)) return `Hoje${time}`;
  if (sameDay(due, tomorrow)) return `Amanhã${time}`;
  if (sameDay(due, yesterday)) return `Ontem${time}`;
  const year = due.getFullYear() !== now.getFullYear() ? ` ${due.getFullYear()}` : "";
  return `${due.getDate()} ${MONTHS[due.getMonth()]}${year}${time}`;
}

/** Aprovação coletiva: Concluir só depois de todos os atribuídos confirmarem a parte. */
export function canConclude(demand: { requireAllConfirm: boolean; assignees: { confirmedAt: string | null }[] }) {
  if (!demand.requireAllConfirm) return true;
  return demand.assignees.every((assignee) => assignee.confirmedAt !== null);
}

// ---- Histórico de alterações (D-69) ----

export type DemandSnapshot = {
  title: string;
  status: DemandStatus;
  priority: DemandPriority;
  dueDate: string | null;
  dueTime: string | null;
  clientName: string | null;
  platformName: string | null;
  assigneeNames: string[];
  requireAllConfirm: boolean;
  descriptionText: string;
  subtasks: { text: string; done: boolean }[];
  attachmentNames: string[];
};

export type DemandChange = { field: string; from: string | null; to: string | null };

function dueText(date: string | null, time: string | null) {
  if (!date) return null;
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}${time ? ` ${time}` : ""}`;
}

/** Diferenças entre o que estava salvo e o que foi salvo agora, já em texto para a linha do tempo. */
export function diffDemand(before: DemandSnapshot, after: DemandSnapshot): DemandChange[] {
  const changes: DemandChange[] = [];
  const add = (field: string, from: string | null, to: string | null) => {
    if ((from ?? "") !== (to ?? "")) changes.push({ field, from: from || null, to: to || null });
  };
  add("título", before.title, after.title);
  add("situação", DEMAND_STATUS_LABEL[before.status], DEMAND_STATUS_LABEL[after.status]);
  add("prioridade", DEMAND_PRIORITY_LABEL[before.priority], DEMAND_PRIORITY_LABEL[after.priority]);
  add("prazo", dueText(before.dueDate, before.dueTime), dueText(after.dueDate, after.dueTime));
  add("cliente", before.clientName, after.clientName);
  add("plataforma", before.platformName, after.platformName);
  add("atribuídos", [...before.assigneeNames].sort().join(", "), [...after.assigneeNames].sort().join(", "));
  add("aprovação coletiva", before.requireAllConfirm ? "Exigida" : "Não exigida", after.requireAllConfirm ? "Exigida" : "Não exigida");
  if (before.descriptionText !== after.descriptionText) changes.push({ field: "descrição", from: null, to: null });
  const doneBefore = before.subtasks.filter((item) => item.done).length;
  const doneAfter = after.subtasks.filter((item) => item.done).length;
  if (JSON.stringify(before.subtasks) !== JSON.stringify(after.subtasks)) {
    changes.push({ field: "subtarefas", from: `${doneBefore} de ${before.subtasks.length}`, to: `${doneAfter} de ${after.subtasks.length}` });
  }
  add("anexos", before.attachmentNames.join(", "), after.attachmentNames.join(", "));
  return changes;
}

const FIELD_PHRASE: Record<string, string> = {
  título: "o título",
  situação: "a situação",
  prioridade: "a prioridade",
  prazo: "o prazo",
  cliente: "o cliente",
  plataforma: "a plataforma",
  atribuídos: "os atribuídos",
  "aprovação coletiva": "a aprovação coletiva",
  subtarefas: "as subtarefas concluídas",
  anexos: "os anexos",
};

/** Frase da linha do tempo: "alterou o prazo de 10/11/2026 para 12/11/2026". */
export function changeSentence(change: DemandChange) {
  const phrase = FIELD_PHRASE[change.field] ?? change.field;
  if (change.field === "descrição") return "alterou a descrição";
  if (change.field === "confirmação") return change.to ?? "";
  if (change.field === "subtarefa") return `${change.to === "feita" ? "marcou como feita" : "desmarcou"} a subtarefa "${change.from}"`;
  if (!change.from) return `definiu ${phrase}: ${change.to}`;
  if (!change.to) return `removeu ${phrase} (${change.from})`;
  return `alterou ${phrase} de ${change.from} para ${change.to}`;
}
