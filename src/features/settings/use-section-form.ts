"use client";

import * as React from "react";
import type { SaveState } from "@/components/ui/save-button";
import { useRealtime } from "@/features/realtime/client";
import { useTabDirty } from "@/features/shell/tabs-store";
import type { SaveResult, SectionSaved } from "./topics";

type Options<T> = {
  /** Nome da seção: separa o "não salvo" dentro da aba. */
  section: string;
  /** Tópico de tempo real da seção (D-87); null = sem aviso de conflito. */
  topic: string | null;
  /** Quem está usando (para não avisar a pessoa das próprias alterações). */
  userId: string;
  load: () => Promise<T | null>;
  save: (draft: T) => Promise<SaveResult<T>>;
};

/**
 * Formulário de uma seção de Configurações (configuracoes-design-v2.md §1, D-64, D-87):
 * rascunho local, "Salvar" (e Ctrl+S) só com alteração, Esc descarta (segundo Esc confirma),
 * ponto de não salvo na aba e aviso se outra pessoa salvar a mesma seção.
 */
export function useSectionForm<T>({ section, topic, userId, load, save }: Options<T>) {
  const [baseline, setBaseline] = React.useState<T | null>(null);
  const [draft, setDraft] = React.useState<T | null>(null);
  const [saveState, setSaveState] = React.useState<SaveState>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [conflictBy, setConflictBy] = React.useState<string | null>(null);
  const [escArmed, setEscArmed] = React.useState(false);
  const escTimer = React.useRef<number | null>(null);

  const dirtyRef = React.useRef(false);

  /**
   * Busca a versão salva. Um carregamento que chega atrasado nunca apaga um rascunho com alterações;
   * só `force` (o "Ver versão salva" / descartar) substitui o rascunho.
   */
  const reload = React.useCallback(
    async (force = false) => {
      const value = await load();
      if (value === null) return;
      setBaseline(value);
      if (force || !dirtyRef.current) {
        setDraft(value);
        setConflictBy(null);
      }
    },
    [load]
  );

  React.useEffect(() => {
    let cancelled = false;
    void load().then((value) => {
      if (cancelled || value === null) return;
      setBaseline(value);
      if (!dirtyRef.current) setDraft(value);
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const dirty = baseline !== null && JSON.stringify(draft) !== JSON.stringify(baseline);
  useTabDirty(dirty, section);

  React.useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  useRealtime<SectionSaved>(topic ?? "", (message) => {
    if (!topic || message.event !== "secao:salva" || message.data.byId === userId) return;
    if (dirtyRef.current) {
      setConflictBy(message.data.byName);
      // Atualiza a base sem mexer no rascunho: o "não salvo" passa a comparar com a versão nova.
      void reload();
    } else void reload();
  });

  const update = React.useCallback((patch: Partial<T> | ((current: T) => T)) => {
    setDraft((current) => {
      if (current === null) return current;
      return typeof patch === "function" ? patch(current) : { ...current, ...patch };
    });
    setError(null);
  }, []);

  const submit = React.useCallback(async () => {
    if (!dirty || draft === null || saveState === "saving") return;
    setSaveState("saving");
    setError(null);
    const result = await save(draft);
    if (!result.ok) {
      setSaveState("idle");
      setError(result.error);
      return;
    }
    setBaseline(result.value);
    setDraft(result.value);
    setConflictBy(null);
    setSaveState("saved");
    window.setTimeout(() => setSaveState("idle"), 1200);
  }, [dirty, draft, save, saveState]);

  const discard = React.useCallback(() => {
    setDraft(baseline);
    setError(null);
    setEscArmed(false);
    dirtyRef.current = false;
    if (conflictBy) void reload(true);
  }, [baseline, conflictBy, reload]);

  /** Teclado da seção: Ctrl+S salva; Esc descarta (com confirmação se houver alteração). */
  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void submit();
      } else if (event.key === "Escape" && dirty) {
        event.preventDefault();
        if (escArmed) {
          if (escTimer.current) window.clearTimeout(escTimer.current);
          discard();
        } else {
          setEscArmed(true);
          escTimer.current = window.setTimeout(() => setEscArmed(false), 3000);
        }
      }
    },
    [dirty, discard, escArmed, submit]
  );

  return { draft, baseline, dirty, saveState, error, conflictBy, escArmed, update, submit, discard, onKeyDown, reload };
}
