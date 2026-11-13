import { recordTopic } from "@/features/realtime/types";

export const DEMANDS_TOPIC = "demandas";

/** Presença ("vendo agora") de uma demanda: o servidor só aceita presença em tópicos de registro. */
export function demandPresenceTopic(id: string) {
  return recordTopic("demanda", id);
}
