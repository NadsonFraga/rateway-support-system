"use client";

import * as React from "react";
import { useRealtime } from "@/features/realtime/client";
import { recordTopic, userTopic, type LockHolder } from "@/features/realtime/types";
import { useShellUser } from "@/features/shell/shell-user";
import { currentHolder, startEditingRecord, stopEditingRecord, takeOverRecord } from "./actions";
import { useLockHeartbeat } from "./use-edit-lock";

/**
 * Trava de um registro editável em modal (D-65, D-70). `active` = o modal está aberto.
 * Devolve quem está editando, se sou eu, e as ações de começar, parar e assumir.
 */
export function useRecordLock(entityType: string, entityId: string | null, active: boolean) {
  const me = useShellUser();
  const [holder, setHolder] = React.useState<LockHolder | null>(null);
  const [lostMessage, setLostMessage] = React.useState<string | null>(null);
  const id = entityId ?? "";
  const editing = !!entityId && holder?.userId === me.id;

  React.useEffect(() => {
    if (!active || !entityId) return;
    let cancelled = false;
    void currentHolder(entityType, entityId).then((value) => !cancelled && setHolder(value));
    return () => {
      cancelled = true;
    };
  }, [active, entityType, entityId]);

  useRealtime<{ holder?: LockHolder | null }>(active && entityId ? recordTopic(entityType, id) : "", (message) => {
    if (message.event === "trava:adquirida" || message.event === "trava:assumida") setHolder(message.data.holder ?? null);
    else if (message.event === "trava:liberada") setHolder(null);
  });

  useRealtime<{ entityType: string; entityId: string; reason?: string; holder?: LockHolder }>(userTopic(me.id), (message) => {
    if (message.data.entityType !== entityType || message.data.entityId !== id) return;
    if (message.event === "trava:perdida") {
      setLostMessage(`${message.data.holder?.name ?? "O Administrador"} assumiu a edição. Suas alterações não salvas foram descartadas.`);
    } else if (message.event === "trava:encerrada") {
      setLostMessage(
        message.data.reason === "inatividade"
          ? "A edição foi encerrada por inatividade. As alterações não salvas foram descartadas."
          : "A edição foi encerrada porque a conexão caiu."
      );
    }
  });

  const markActivity = useLockHeartbeat(entityType, id, editing);

  const start = React.useCallback(async () => {
    if (!entityId) return { ok: false, error: null as string | null };
    setLostMessage(null);
    const result = await startEditingRecord(entityType, entityId);
    if (result.holder) setHolder(result.holder);
    if (!result.ok) return { ok: false, error: result.error ?? (result.holder ? `${result.holder.name} começou a editar agora.` : null) };
    return { ok: true, error: null };
  }, [entityType, entityId]);

  const stop = React.useCallback(async () => {
    if (!entityId) return;
    setHolder((current) => (current?.userId === me.id ? null : current));
    await stopEditingRecord(entityType, entityId);
  }, [entityType, entityId, me.id]);

  const takeOver = React.useCallback(async () => {
    if (!entityId) return;
    const result = await takeOverRecord(entityType, entityId);
    if (result.holder) setHolder(result.holder);
  }, [entityType, entityId]);

  return {
    holder,
    editing,
    lockedByOther: !!holder && holder.userId !== me.id,
    lostMessage,
    start,
    stop,
    takeOver,
    markActivity,
    /** Depois de salvar com sucesso, o servidor já liberou a trava. */
    released: () => setHolder(null),
  };
}
