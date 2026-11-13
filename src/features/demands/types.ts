import type { DemandPriority, DemandStatus } from "./rules";

export type PersonRef = { id: string; name: string; image: string | null };
export type ClientRef = { id: string; code: string; name: string; logoUrl: string | null };
export type PlatformRef = { id: string; name: string; logoUrl: string | null };

/** Linha da lista, do Kanban e (nas próximas etapas) da Visão Geral do cliente e do Início. */
export type DemandListItem = {
  id: string;
  code: string;
  title: string;
  status: DemandStatus;
  priority: DemandPriority;
  /** AAAA-MM-DD */
  dueDate: string | null;
  /** HH:MM */
  dueTime: string | null;
  client: ClientRef | null;
  platform: PlatformRef | null;
  assignees: (PersonRef & { seenAt: string | null; confirmedAt: string | null })[];
  /** Aprovação coletiva: o círculo de concluir da linha fica bloqueado até todos confirmarem (D-107). */
  requireAllConfirm: boolean;
  completedAt: string | null;
  updatedAt: string;
};

export type DemandAssigneeView = PersonRef & { seenAt: string | null; confirmedAt: string | null };

export type DemandEventView = {
  id: string;
  kind: "criacao" | "comentario" | "alteracao";
  author: PersonRef;
  body: unknown;
  changes: { field: string; from: string | null; to: string | null }[] | null;
  createdAt: string;
};

export type DemandDetail = DemandListItem & {
  description: unknown;
  subtasks: { id: string; text: string; done: boolean }[];
  attachments: { id: string; url: string; name: string; mimeType: string | null }[];
  events: DemandEventView[];
  createdBy: PersonRef;
  completedBy: PersonRef | null;
  createdAt: string;
};

/** Prévia ao passar o mouse na linha (D-108): descrição e subtarefas, sem registrar o "visto às". */
export type DemandPreview = {
  id: string;
  description: unknown;
  subtasks: { id: string; text: string; done: boolean }[];
  /** Quem está editando agora (marcar subtarefa fica bloqueado). */
  editingBy: string | null;
};

/** O que o painel envia ao salvar (criar ou editar). */
export type DemandInput = {
  title: string;
  description: unknown;
  status: DemandStatus;
  priority: DemandPriority;
  dueDate: string | null;
  dueTime: string | null;
  clientId: string | null;
  platformId: string | null;
  requireAllConfirm: boolean;
  assigneeIds: string[];
  /** `key`: só na tela (reordenar antes de salvar); o servidor ignora. */
  subtasks: { id?: string; key?: string; text: string; done: boolean }[];
  attachments: { id?: string; url: string; name: string; mimeType: string | null }[];
};

/** Pessoas, clientes e plataformas para os campos do painel e as menções. */
export type DemandFormOptions = {
  people: PersonRef[];
  clients: ClientRef[];
  platforms: PlatformRef[];
};
