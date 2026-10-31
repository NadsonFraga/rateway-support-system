// Regras puras de clientes (D-14 a D-19, D-26, D-27). Sem banco: fáceis de testar.

export type ClientStatus = "ativo" | "pausado" | "inativo";

export const CLIENT_STATUS_LABEL: Record<ClientStatus, string> = {
  ativo: "Ativo",
  pausado: "Pausado",
  inativo: "Inativo",
};

/** Fases que encerram o serviço (D-17, D-27) e a fase de pausa. As demais contam como em andamento. */
const ENDED_PHASES = new Set(["Cancelado", "Concluído", "Concluída"]);
const PAUSED_PHASES = new Set(["Pausado"]);

export type PhaseKind = "ativa" | "pausada" | "encerrada";

export function phaseKind(phase: string): PhaseKind {
  if (ENDED_PHASES.has(phase)) return "encerrada";
  if (PAUSED_PHASES.has(phase)) return "pausada";
  return "ativa";
}

/**
 * Status do cliente calculado pelas fases dos serviços (D-26): Ativo se algum está em andamento;
 * Pausado se nenhum ativo e algum pausado; Inativo quando todos terminaram (ou não há serviços).
 */
export function clientStatus(phases: string[]): ClientStatus {
  const kinds = phases.map(phaseKind);
  if (kinds.includes("ativa")) return "ativo";
  if (kinds.includes("pausada")) return "pausado";
  return "inativo";
}

export const ASSESSORIA = "assessoria";
export const CADASTRO_REVISAO = "cadastro_revisao";

export type ServiceProblem = string | null;

/** A fase precisa ser uma das fases daquele serviço. */
export function phaseProblem(validPhases: string[], phase: string): ServiceProblem {
  return validPhases.includes(phase) ? null : "Escolha uma fase da lista deste serviço.";
}

/**
 * Regras ao contratar um serviço: não duplicar um serviço em andamento e,
 * com Assessoria ativa, não contratar Cadastro/Revisão à parte (D-16).
 */
export function hireProblem(serviceId: string, current: { serviceId: string; phase: string }[]): ServiceProblem {
  const running = current.filter((item) => phaseKind(item.phase) !== "encerrada");
  if (running.some((item) => item.serviceId === serviceId)) return "Este serviço já está contratado e em andamento.";
  if (serviceId === CADASTRO_REVISAO && running.some((item) => item.serviceId === ASSESSORIA)) {
    return "A Assessoria já inclui o Cadastro/Revisão. Não é preciso contratar separado.";
  }
  return null;
}

/** Vencimento: contínuos têm dia do mês (1 a 31); pontuais têm data única. Ambos opcionais na criação. */
export function billingProblem(kind: "pontual" | "continuo", billingDay: number | null, dueDate: string | null): ServiceProblem {
  if (kind === "continuo" && billingDay !== null && (!Number.isInteger(billingDay) || billingDay < 1 || billingDay > 31)) {
    return "O dia de vencimento precisa estar entre 1 e 31.";
  }
  if (kind === "pontual" && dueDate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return "Data de vencimento inválida.";
  return null;
}

/** Texto do vencimento: "Todo dia 10" (contínuo) ou "20/11/2026" (pontual). */
export function billingLabel(kind: "pontual" | "continuo", billingDay: number | null, dueDate: string | null) {
  if (kind === "continuo") return billingDay ? `Todo dia ${billingDay}` : "Não definido";
  if (!dueDate) return "Não definido";
  const [year, month, day] = dueDate.split("-");
  return `${day}/${month}/${year}`;
}
