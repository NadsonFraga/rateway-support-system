"use client";

import * as React from "react";
import { useRealtime, useRealtimeConnected } from "@/features/realtime/client";
import { userTopic } from "@/features/realtime/types";
import { listInbox, markAllAsRead, markAsRead } from "./actions";
import type { InboxItem } from "./types";

/** Caixa de entrada da pessoa logada, sempre em dia pelo tempo real. */
export function useInbox(userId: string) {
  const [items, setItems] = React.useState<InboxItem[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const connected = useRealtimeConnected();

  // Carrega ao abrir e de novo a cada reconexão (pode ter chegado algo enquanto a conexão caiu).
  React.useEffect(() => {
    if (!connected && loaded) return;
    let cancelled = false;
    void listInbox().then((list) => {
      if (cancelled) return;
      setItems(list);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recarrega só quando a conexão volta
  }, [connected]);

  useRealtime<InboxItem | { ids: string[] } | Record<string, never>>(userTopic(userId), (message) => {
    if (message.event === "notificacao:nova") {
      const item = message.data as InboxItem;
      setItems((current) => (current.some((existing) => existing.id === item.id) ? current : [item, ...current]));
    } else if (message.event === "notificacao:lida") {
      const { ids } = message.data as { ids: string[] };
      const now = new Date().toISOString();
      setItems((current) => current.map((item) => (ids.includes(item.id) ? { ...item, readAt: item.readAt ?? now } : item)));
    } else if (message.event === "notificacao:todas-lidas") {
      const now = new Date().toISOString();
      setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? now })));
    }
  });

  const unread = items.filter((item) => !item.readAt).length;

  const read = React.useCallback((id: string) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, readAt: item.readAt ?? new Date().toISOString() } : item))
    );
    void markAsRead(id);
  }, []);

  const readAll = React.useCallback(() => {
    const now = new Date().toISOString();
    setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? now })));
    void markAllAsRead();
  }, []);

  return { items, unread, loaded, read, readAll };
}
