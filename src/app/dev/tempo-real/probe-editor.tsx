"use client";

import * as React from "react";
import { Lock, Pencil, Radio, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SaveButton, type SaveState } from "@/components/ui/save-button";
import { Kbd } from "@/components/ui/kbd";
import { usePresence, useRealtime, useRealtimeConnected } from "@/features/realtime/client";
import { recordTopic, userTopic, type LockHolder } from "@/features/realtime/types";
import { useLockHeartbeat } from "@/features/locks/use-edit-lock";
import { ROLES } from "@/features/auth/permissions";
import type { CurrentUser } from "@/features/auth/session";
import { discardEditing, saveProbe, startEditing, takeOverEditing } from "./actions";

const ENTITY = "realtime_probe";
const ID = "teste";
const TOPIC = recordTopic(ENTITY, ID);

type Saved = { text: string; updatedBy: string; updatedAt: string };

export function ProbeEditor({
  currentUser,
  initialText,
  initialHolder,
}: {
  currentUser: CurrentUser;
  initialText: string;
  initialHolder: LockHolder | null;
}) {
  const connected = useRealtimeConnected();
  const viewers = usePresence(TOPIC);
  const [text, setText] = React.useState(initialText);
  const [draft, setDraft] = React.useState(initialText);
  const [holder, setHolder] = React.useState<LockHolder | null>(initialHolder);
  const [lastUpdate, setLastUpdate] = React.useState<{ by: string; latencyMs: number } | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [warning, setWarning] = React.useState<string | null>(null);
  const [saveState, setSaveState] = React.useState<SaveState>("idle");
  const escArmed = React.useRef<number | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const editing = holder?.userId === currentUser.id;
  const lockedByOther = !!holder && !editing;
  const dirty = editing && draft !== text;
  const markActivity = useLockHeartbeat(ENTITY, ID, editing);

  const leaveEditing = React.useCallback((message: string | null) => {
    setDraft((current) => current);
    setNotice(message);
    setWarning(null);
  }, []);

  useRealtime<Saved | { holder: LockHolder } | { reason: string } | { holder: LockHolder; previousUserId: string | null }>(
    TOPIC,
    (message) => {
      if (message.event === "registro:salvo") {
        const data = message.data as Saved;
        setText(data.text);
        if (!editing) setDraft(data.text);
        setLastUpdate({ by: data.updatedBy, latencyMs: Math.max(0, Date.now() - message.at) });
      } else if (message.event === "trava:adquirida" || message.event === "trava:assumida") {
        setHolder((message.data as { holder: LockHolder }).holder);
      } else if (message.event === "trava:liberada") {
        setHolder(null);
      }
    }
  );

  useRealtime<{ entityType: string; entityId: string; reason?: string; holder?: LockHolder }>(
    userTopic(currentUser.id),
    (message) => {
      if (message.data.entityType !== ENTITY || message.data.entityId !== ID) return;
      if (message.event === "trava:aviso-inatividade") {
        setWarning("Sua edição será encerrada por inatividade em 1 minuto.");
      } else if (message.event === "trava:encerrada") {
        setDraft(text);
        leaveEditing(
          message.data.reason === "inatividade"
            ? "A edição foi encerrada por inatividade. As alterações não salvas foram descartadas."
            : "A edição foi encerrada porque a conexão caiu. As alterações não salvas foram descartadas."
        );
      } else if (message.event === "trava:perdida") {
        setDraft(text);
        leaveEditing(
          `${message.data.holder?.name ?? "O administrador"} assumiu a edição. As alterações não salvas foram descartadas.`
        );
      }
    }
  );

  async function onEdit() {
    setNotice(null);
    const result = await startEditing();
    if (result.holder) setHolder(result.holder);
    if (!result.ok && result.holder) {
      setNotice(`${result.holder.name} começou a editar agora.`);
      return;
    }
    setDraft(text);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  async function onSave() {
    if (!dirty) return;
    setSaveState("saving");
    const result = await saveProbe(draft);
    if (!result.ok) {
      setSaveState("idle");
      setNotice(result.error);
      return;
    }
    setText(draft);
    setHolder(null);
    setWarning(null);
    setSaveState("saved");
    window.setTimeout(() => setSaveState("idle"), 1200);
  }

  async function discard() {
    setDraft(text);
    setHolder(null);
    setWarning(null);
    await discardEditing();
  }

  // Atalhos: E edita; Ctrl+S salva; Esc descarta (com segundo Esc se houver alterações) — D-64.
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      const typing = target.tagName === "TEXTAREA" || target.tagName === "INPUT";
      if (event.key.toLowerCase() === "s" && (event.ctrlKey || event.metaKey) && editing) {
        event.preventDefault();
        void onSave();
      } else if (event.key === "Escape" && editing) {
        event.preventDefault();
        if (!dirty || escArmed.current) {
          if (escArmed.current) window.clearTimeout(escArmed.current);
          escArmed.current = null;
          setNotice(null);
          void discard();
        } else {
          setNotice("Esc de novo para descartar");
          escArmed.current = window.setTimeout(() => {
            escArmed.current = null;
            setNotice(null);
          }, 3000);
        }
      } else if (event.key.toLowerCase() === "e" && !typing && !editing && !lockedByOther && !event.ctrlKey) {
        event.preventDefault();
        void onEdit();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const others = viewers.filter((viewer) => viewer.userId !== currentUser.id);

  return (
    <section className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line-subtle bg-surface">
      <header className="flex h-14 items-center gap-3 border-b border-line-subtle px-5">
        <h1 className="text-[15px] font-semibold text-ink">Teste de tempo real</h1>
        <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted" data-testid="conexao">
          {connected ? <Radio className="size-4 stroke-[1.75]" /> : <Unplug className="size-4 stroke-[1.75]" />}
          {connected ? "Conectado" : "Reconectando"}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => void discard()}>
                Descartar <Kbd className="ml-1">Esc</Kbd>
              </Button>
              <SaveButton state={saveState} dirty={dirty} onSave={() => void onSave()} />
            </>
          ) : (
            <>
              {saveState === "saved" && <SaveButton state="saved" dirty={false} onSave={() => undefined} />}
              <Button variant="outline" size="sm" onClick={() => void onEdit()} disabled={lockedByOther}>
                <Pencil /> Editar <Kbd className="ml-1">E</Kbd>
              </Button>
            </>
          )}
        </div>
      </header>

      {lockedByOther && (
        <div className="flex h-10 items-center gap-2 bg-accent-subdued px-5 text-[13px] text-ink-secondary" data-testid="faixa-trava">
          <Lock className="size-4 stroke-[1.75]" aria-hidden />
          <span>
            <strong className="font-medium text-ink">{holder.name}</strong> está editando
          </span>
          {currentUser.role === ROLES.administrador && (
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => void takeOverEditing()}>
              Assumir a edição
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 p-5">
        <label htmlFor="texto-teste" className="text-[13px] text-ink-secondary">
          Texto de teste
        </label>
        <textarea
          ref={textareaRef}
          id="texto-teste"
          data-testid="texto-teste"
          value={editing ? draft : text}
          readOnly={!editing}
          onChange={(event) => {
            setDraft(event.target.value);
            markActivity();
          }}
          rows={6}
          className="w-full resize-none rounded-lg border border-line-subtle bg-canvas px-3 py-2 text-sm text-ink outline-none read-only:text-ink-secondary focus-visible:border-line-focus"
        />
        <div className="flex min-h-5 flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
          {warning && <span className="text-amber-fact">{warning}</span>}
          {notice && (
            <span
              className={notice.startsWith("Esc") ? "text-amber-fact" : "text-ink-secondary"}
              role="status"
            >
              {notice}
            </span>
          )}
          {lastUpdate && (
            <span className="text-ink-muted" data-testid="ultima-atualizacao">
              Atualizado por {lastUpdate.by}, chegou em <span className="tabular">{lastUpdate.latencyMs} ms</span>
            </span>
          )}
        </div>
      </div>

      <footer className="flex items-center gap-2 border-t border-line-subtle px-5 py-3 text-[13px] text-ink-muted">
        <span>Vendo agora:</span>
        <span className="text-ink-secondary" data-testid="vendo-agora">
          {others.length === 0 ? "só você" : others.map((viewer) => viewer.name).join(", ")}
        </span>
      </footer>
    </section>
  );
}
