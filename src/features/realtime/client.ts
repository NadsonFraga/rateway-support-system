"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { io, type Socket } from "socket.io-client";
import type { PresenceMessage, PresenceUser, RealtimeMessage } from "./types";

// Uma única conexão por aba do navegador, compartilhada por todas as telas.
let socket: Socket | null = null;

function getSocket() {
  if (!socket) {
    socket = io({ path: "/socket.io", transports: ["websocket"], withCredentials: true });
    // Sessão vencida (2h sem uso ou 12h no total, D-73): o servidor recusa a conexão e a tela volta ao login.
    socket.on("connect_error", (error) => {
      // Recarga completa de propósito: /sair é uma rota do servidor que apaga o cookie da sessão.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      if (error.message === "nao-autorizado") window.location.assign("/sair?motivo=expirada");
    });
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

/**
 * "conectado" ou "sem-conexao". Ao abrir a página há 5s de tolerância antes de acusar falta de conexão,
 * para o ponto não piscar coral enquanto a conexão ainda está sendo feita.
 */
export function useConnectionState(): "conectado" | "sem-conexao" {
  const connected = useRealtimeConnected();
  const [graceOver, setGraceOver] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setGraceOver(true), 5000);
    return () => window.clearTimeout(timer);
  }, []);
  return connected || !graceOver ? "conectado" : "sem-conexao";
}

/** Recebe as mensagens de um tópico enquanto o componente estiver na tela. */
export function useRealtime<T>(topic: string, onMessage: (message: RealtimeMessage<T>) => void) {
  const handlerRef = useRef(onMessage);
  useEffect(() => {
    handlerRef.current = onMessage;
  });

  useEffect(() => {
    if (!topic) return;
    const s = getSocket();
    const subscribe = () => s.emit("inscrever", topic);
    const listener = (message: RealtimeMessage<T>) => {
      if (message.topic === topic) handlerRef.current(message);
    };
    // Vários componentes podem ouvir o mesmo tópico: só sai do tópico quando o último deixar a tela.
    const count = (subscribers.get(topic) ?? 0) + 1;
    subscribers.set(topic, count);
    if (count === 1) subscribe();
    s.on("connect", subscribe); // reinscreve após reconectar
    s.on("mensagem", listener);
    return () => {
      s.off("connect", subscribe);
      s.off("mensagem", listener);
      const left = (subscribers.get(topic) ?? 1) - 1;
      if (left > 0) {
        subscribers.set(topic, left);
      } else {
        subscribers.delete(topic);
        s.emit("desinscrever", topic);
      }
    };
  }, [topic]);
}

/** Quantos componentes ouvem cada tópico nesta aba do navegador. */
const subscribers = new Map<string, number>();

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
