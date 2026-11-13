"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Loader2, Send } from "lucide-react";
import { createNotice } from "./actions";

interface NoticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void>;
}

export function NoticeDialog({ open, onOpenChange, onSuccess }: NoticeDialogProps) {
  const [text, setText] = React.useState("");
  const [expiresAt, setExpiresAt] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setText("");
      setExpiresAt("");
      setError(null);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) {
      setError("Digite o conteúdo do comunicado.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await createNotice(text, expiresAt || undefined);
      if (!res.success) {
        setError(res.error ?? "Erro ao publicar comunicado.");
        return;
      }
      onOpenChange(false);
      await onSuccess();
    } catch (err) {
      console.error(err);
      setError("Falha inesperada ao publicar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader
          title="Novo Comunicado para a Equipe"
          description="Este aviso será exibido no topo do mural de todos os usuários."
        />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-4">
          {error && (
            <div className="rounded-lg border border-feedback-danger/30 bg-feedback-danger/10 p-2.5 text-xs text-feedback-danger">
              {error}
            </div>
          )}

          <Field label="Mensagem do Comunicado" htmlFor="notice-text">
            <textarea
              id="notice-text"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ex: Instabilidade no motor da Omnibees confirmada nesta tarde. Acompanhando resolução..."
              className="w-full resize-none rounded-lg border border-line-subtle bg-surface px-3 py-2 text-xs text-ink outline-none focus-visible:border-line-focus placeholder:text-ink-muted"
            />
          </Field>

          <Field
            label="Data de Expiração (Opcional)"
            htmlFor="notice-expiry"
            help="Após esta data, o aviso não será mais exibido."
          >
            <input
              id="notice-expiry"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="h-8 w-full rounded-lg border border-line-subtle bg-surface px-2.5 text-xs text-ink outline-none focus-visible:border-line-focus"
            />
          </Field>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-line-subtle">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={loading || !text.trim()}>
              {loading ? (
                <Loader2 className="size-3.5 animate-spin mr-1" />
              ) : (
                <Send className="size-3.5 mr-1" />
              )}
              Publicar Comunicado
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
