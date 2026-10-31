"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { io, type Socket } from "socket.io-client";
import type { PresenceMessage, PresenceUser, RealtimeMessage } from "./types";

// Uma única conexão por aba do navegador, compartilhada por todas as telas.
let socket: Socket | null = null;

function getSocket() {
  if (!socket) {
    socket = io({ path: "/socket.io", transports: ["websocket"], withCredentials: true });
  }
  return socket;
}

export function realtimeSocket() {
  return getSocket();
}

function subscribeConnection(listener: () => void) {
  const s = getSocket();
  s.on("connect", listener);
  s.on("disconnect", listener);
  return () => {
    s.off("connect", listener);
    s.off("disconnect", listener);
  };
}

/** Situação da conexão em tempo real (para mostrar "Conectado" / "Reconectando"). */
export function useRealtimeConnected() {
  return useSyncExternalStore(
    subscribeConnection,
    () => getSocket().connected,
    () => false
  );
}

/** Recebe as mensagens de um tópico enquanto o componente estiver na tela. */
export function useRealtime<T>(topic: string, onMessage: (message: RealtimeMessage<T>) => void) {
  const handlerRef = useRef(onMessage);
  useEffect(() => {
    handlerRef.current = onMessage;
  });

  useEffect(() => {
    const s = getSocket();
    const subscribe = () => s.emit("inscrever", topic);
    const listener = (message: RealtimeMessage<T>) => {
      if (message.topic === topic) handlerRef.current(message);
    };
    subscribe();
    s.on("connect", subscribe); // reinscreve após reconectar
    s.on("mensagem", listener);
    return () => {
      s.off("connect", subscribe);
      s.off("mensagem", listener);
      s.emit("desinscrever", topic);
    };
  }, [topic]);
}

/** Quem está com o registro aberto agora ("vendo agora"). */
export function usePresence(topic: string) {
  const [users, setUsers] = useState<PresenceUser[]>([]);
  useEffect(() => {
    const s = getSocket();
    const enter = () => s.emit("presenca:entrar", topic);
    const listener = (message: PresenceMessage) => {
      if (message.topic === topic) setUsers(message.users);
    };
    enter();
    s.on("connect", enter);
    s.on("presenca", listener);
    return () => {
      s.off("connect", enter);
      s.off("presenca", listener);
      s.emit("presenca:sair", topic);
    };
  }, [topic]);
  return users;
}
