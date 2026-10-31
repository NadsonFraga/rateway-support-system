"use client";

import * as React from "react";
import { Lock, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { SaveButton, type SaveState } from "@/components/ui/save-button";
import { ROLES } from "@/features/auth/permissions";
import { useRecordLock } from "@/features/locks/use-record-lock";
import { useShellUser } from "@/features/shell/shell-user";

type RecordDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Trava do registro; null = criação (já começa editando, sem trava). */
  lock: { entityType: string; entityId: string } | null;
  canEdit: boolean;
  dirty: boolean;
  saveState: SaveState;
  error: string | null;
  onSave: () => Promise<boolean>;
  /** Volta o rascunho ao que está salvo. */
  onDiscard: () => void;
  /** Avisado quando o modo muda (leitura ↔ edição), para o formulário habilitar os campos. */
  children: (state: { editing: boolean; markActivity: () => void }) => React.ReactNode;
  saveLabel?: string;
};

/**
 * Modal de registro com o modelo único de edição (D-64, D-65, D-70): abre em leitura → Editar trava →
 * Salvar (Ctrl+S) grava e libera → Esc descarta (segundo Esc confirma se houver alterações).
 */
export function RecordDialog(props: RecordDialogProps) {
  const { open, onClose } = props;
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-2xl" onEscapeKeyDown={(event) => event.preventDefault()}>
        {open && <RecordDialogBody {...props} />}
      </DialogContent>
    </Dialog>
  );
}

function RecordDialogBody({
  onClose,
  title,
  lock,
  canEdit,
  dirty,
  saveState,
  error,
  onSave,
  onDiscard,
  children,
  saveLabel,
}: RecordDialogProps) {
  const me = useShellUser();
  const creating = lock === null;
  const record = useRecordLock(lock?.entityType ?? "", lock?.entityId ?? null, true);
  const editing = creating || record.editing;
  const [notice, setNotice] = React.useState<string | null>(null);
  const escArmed = React.useRef<number | null>(null);
  const shownNotice = notice ?? (editing ? null : record.lostMessage);

  // Ao fechar, a trava é sempre liberada.
  const stopRef = React.useRef(record.stop);
  React.useEffect(() => {
    stopRef.current = record.stop;
  });
  React.useEffect(() => () => void stopRef.current(), []);

  React.useEffect(() => {
    if (record.lostMessage) onDiscard();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reage só à perda da trava
  }, [record.lostMessage]);

  async function startEditing() {
    setNotice(null);
    const result = await record.start();
    if (!result.ok && result.error) setNotice(result.error);
  }

  async function save() {
    if (!dirty) return;
    const ok = await onSave();
    if (ok) {
      record.released();
      if (creating) onClose();
    }
  }

  function discardOrClose() {
    if (editing && dirty) {
      if (escArmed.current) {
        window.clearTimeout(escArmed.current);
        escArmed.current = null;
        setNotice(null);
        onDiscard();
        if (creating) onClose();
        else void record.stop();
        return;
      }
      setNotice("Esc de novo para descartar");
      escArmed.current = window.setTimeout(() => {
        escArmed.current = null;
        setNotice(null);
      }, 3000);
      return;
    }
    if (editing && !creating) {
      void record.stop();
      return;
    }
    onClose();
  }

  return (
    <div
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          discardOrClose();
        } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s" && editing) {
          event.preventDefault();
          void save();
        } else if (editing) record.markActivity();
      }}
      className="flex min-h-0 flex-col"
    >
      <DialogHeader
        title={title}
        actions={
          editing ? (
            <>
              <Button variant="ghost" size="sm" onClick={discardOrClose}>
                {creating ? "Cancelar" : "Descartar"} <Kbd className="ml-1">Esc</Kbd>
              </Button>
              <SaveButton state={saveState} dirty={dirty} onSave={() => void save()} label={saveLabel} />
            </>
          ) : canEdit ? (
            <Button variant="outline" size="sm" onClick={() => void startEditing()} disabled={record.lockedByOther}>
              <Pencil /> Editar
            </Button>
          ) : null
        }
      />
      {record.lockedByOther && record.holder && (
        <div className="flex h-10 items-center gap-2 bg-accent-subdued px-6 text-[13px] text-ink-secondary">
          <Lock className="size-4 stroke-[1.75]" aria-hidden />
          <span>
            <strong className="font-medium text-ink">{record.holder.name}</strong> está editando
          </span>
          {me.role === ROLES.administrador && (
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => void record.takeOver()}>
              Assumir a edição
            </Button>
          )}
        </div>
      )}
      {(shownNotice || error) && (
        <p
          role={error ? "alert" : "status"}
          className={`px-6 pt-4 text-[13px] ${error ? "text-coral" : shownNotice?.startsWith("Esc") ? "text-amber-fact" : "text-ink-secondary"}`}
        >
          {error ?? shownNotice}
        </p>
      )}
      <DialogBody className="max-h-[70vh] overflow-y-auto">
        {children({ editing, markActivity: record.markActivity })}
      </DialogBody>
    </div>
  );
}
