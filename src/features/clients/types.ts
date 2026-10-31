import type { ClientStatus } from "./rules";

export type CatalogRef = { id: string; name: string; logoUrl: string | null } | null;

export type ClientServiceView = {
  id: string;
  serviceId: string;
  serviceName: string;
  kind: "pontual" | "continuo";
  phase: string;
  phases: string[];
  billingDay: number | null;
  /** AAAA-MM-DD */
  dueDate: string | null;
};

/** Linha da listagem e da árvore da sidebar. */
export type ClientSummary = {
  id: string;
  code: string;
  name: string;
  logoUrl: string | null;
  city: string | null;
  state: string | null;
  status: ClientStatus;
  services: { serviceId: string; name: string; phase: string }[];
  channelManager: CatalogRef;
  pms: CatalogRef;
  createdAt: string;
  updatedAt: string;
};

/** Dados editáveis do cliente (modal de Configurações / Dados Técnicos). */
export type ClientFields = {
  name: string;
  sigla: string;
  logoUrl: string | null;
  city: string;
  state: string;
  website: string;
  channelManagerId: string | null;
  pmsId: string | null;
  contactType: "pessoa" | "grupo" | null;
  contactName: string;
  contactPhone: string;
  contactLink: string;
  financeName: string;
  financePhone: string;
  notice: string;
};

export type ClientDetail = Omit<ClientSummary, "services"> &
  Omit<ClientFields, "name" | "logoUrl"> & {
    services: ClientServiceView[];
    hasCredentials: boolean;
  };

export type NewServiceInput = { serviceId: string; phase: string; billingDay: number | null; dueDate: string | null };
