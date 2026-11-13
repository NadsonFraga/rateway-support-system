import type { TabKind } from "@/features/shell/tabs-model";

/** Para onde a notificação leva ao ser clicada. */
export type NotificationTarget = { kind: TabKind; params?: Record<string, string>; /** Demanda a abrir no painel lateral. */ demanda?: string };

export type InboxItem = {
  id: string;
  title: string;
  body: string | null;
  target: NotificationTarget | null;
  readAt: string | null;
  createdAt: string;
};
