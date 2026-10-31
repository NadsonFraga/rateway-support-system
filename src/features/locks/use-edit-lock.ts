"use client";

import { useCallback, useEffect, useRef } from "react";
import { realtimeSocket } from "@/features/realtime/client";
import { LOCK_HEARTBEAT_INTERVAL_MS } from "./policy";

/**
 * Enquanto `editing` for verdadeiro, envia o sinal de vida da trava a cada 30s.
 * `markActivity()` registra digitação (no máximo um envio a cada 30s) para não cair por inatividade.
 */
export function useLockHeartbeat(entityType: string, entityId: string, editing: boolean) {
  const lastActivitySent = useRef(0);

  useEffect(() => {
    if (!editing) return;
    const socket = realtimeSocket();
    const beat = () => socket.emit("trava:sinal", { entityType, entityId, atividade: false });
    beat();
    const timer = window.setInterval(beat, LOCK_HEARTBEAT_INTERVAL_MS);
    socket.on("connect", beat);
    return () => {
      window.clearInterval(timer);
      socket.off("connect", beat);
    };
  }, [entityType, entityId, editing]);

  return useCallback(() => {
    if (!editing) return;
    const now = Date.now();
    if (now - lastActivitySent.current < LOCK_HEARTBEAT_INTERVAL_MS) return;
    lastActivitySent.current = now;
    realtimeSocket().emit("trava:sinal", { entityType, entityId, atividade: true });
  }, [entityType, entityId, editing]);
}
