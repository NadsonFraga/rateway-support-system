export const DEPLOYMENT_STATUSES = [
  "nao_contratado",
  "a_cadastrar",
  "em_andamento",
  "feito_pelo_channel_manager",
  "no_ar",
] as const;

export type DeploymentStatus = (typeof DEPLOYMENT_STATUSES)[number];

export type MatrixChannelHeader = {
  id: string;
  name: string;
  logoUrl: string | null;
};

export type MatrixRow = {
  clientId: string;
  clientCode: string;
  clientName: string;
  clientLogoUrl: string | null;
  serviceName: string;
  servicePhase: string;
  channels: Record<
    string,
    {
      status: DeploymentStatus;
      deploymentId?: string;
      notes?: string;
      bottleneck?: string | null;
    }
  >;
  liveCount: number;
  contractedCount: number;
};

export type PriorityItem = {
  deploymentId?: string;
  clientId: string;
  clientCode: string;
  clientName: string;
  clientLogoUrl: string | null;
  serviceName: string;
  priority: "normal" | "alta" | "critica";
  deadline: string | null; // ISO Date YYYY-MM-DD
  deadlineText: string;
  urgency: "atrasado" | "perto" | "normal";
  liveCount: number;
  contractedCount: number;
  bottleneck: string | null;
};
