"use client";

import * as React from "react";
import { MessageSquare, X, Check, Edit2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { FieldMetaItem, FieldStatus } from "../types";

export function FormSection({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-line-subtle bg-surface py-1 overflow-hidden shadow-xs",
        className
      )}
    >
      {title && (
        <h3 className="px-4 pt-2.5 pb-1.5 text-xs font-semibold tracking-wide text-ink-muted uppercase">
          {title}
        </h3>
      )}
      <div className="divide-y divide-line-subtle">{children}</div>
    </section>
  );
}

export function FieldWrapper({
  label,
  fieldKey,
  optional,
  hint,
  helperText,
  meta,
  onMetaChange,
  children,
  isFilled,
}: {
  label: string;
  fieldKey: string;
  optional?: boolean;
  hint?: string;
  helperText?: string;
  meta?: FieldMetaItem;
  onMetaChange: (fieldKey: string, meta: FieldMetaItem) => void;
  children: React.ReactNode;
  isFilled?: boolean;
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [editingNote, setEditingNote] = React.useState(false);
  const [noteText, setNoteText] = React.useState(meta?.note ?? "");
  const effectiveHint = hint ?? helperText;

  React.useEffect(() => {
    setNoteText(meta?.note ?? "");
  }, [meta?.note]);

  // Determine computed status:
  // If manual status is set, use it.
  // Otherwise, if filled -> ok. If not filled & required -> pend. If not filled & optional -> normal/none.
  const rawManualStatus = meta?.status;
  const status: FieldStatus =
    rawManualStatus ??
    (isFilled ? "ok" : optional ? "ok" : "pend");

  const effectiveDot =
    rawManualStatus === "pend"
      ? "pend"
      : rawManualStatus === "conf"
      ? "conf"
      : rawManualStatus === "na"
      ? "na"
      : isFilled
      ? "ok"
      : optional
      ? ""
      : "pend";

  function handleSetStatus(newStatus?: FieldStatus) {
    onMetaChange(fieldKey, {
      status: newStatus,
      note: meta?.note,
      updatedAt: new Date().toISOString(),
    });
    setMenuOpen(false);
  }

  function handleSaveNote() {
    onMetaChange(fieldKey, {
      status: meta?.status,
      note: noteText.trim() || undefined,
      updatedAt: new Date().toISOString(),
    });
    setEditingNote(false);
    setMenuOpen(false);
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-[minmax(160px,240px)_minmax(0,1fr)_auto] gap-2 md:gap-4 items-start px-4 py-2.5 transition-colors group",
        rawManualStatus === "pend" && "shadow-[inset_2px_0_0_#ff5c7f] bg-feedback-danger/[0.02]",
        rawManualStatus === "conf" && "shadow-[inset_2px_0_0_#ffe269] bg-feedback-warning/[0.02]",
        rawManualStatus === "na" && "opacity-50"
      )}
    >
      {/* Col 1: Label & Hint */}
      <div className="pt-1.5 min-w-0">
        <label
          className={cn(
            "text-xs font-medium text-ink flex flex-wrap items-center gap-1",
            rawManualStatus === "na" && "line-through text-ink-muted"
          )}
        >
          <span>{label}</span>
          {optional && (
            <span className="text-[10px] text-ink-muted font-normal">(opcional)</span>
          )}
        </label>
        {effectiveHint && <span className="block text-[11px] text-ink-muted mt-0.5 leading-snug">{effectiveHint}</span>}
      </div>

      {/* Col 2: Control & Notes */}
      <div className={cn("min-w-0 flex flex-col gap-1.5 w-full", rawManualStatus === "na" && "pointer-events-none")}>
        {children}

        {meta?.note && (
          <div className="flex items-start justify-between gap-2 rounded-md border-l-2 border-line-medium bg-surface-muted px-2.5 py-1.5 text-xs text-ink-secondary">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[10px] font-semibold text-ink uppercase tracking-wider">
                Nota interna:
              </span>
              <p className="whitespace-pre-wrap text-[11px] text-ink">{meta.note}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingNote(true);
                setMenuOpen(true);
              }}
              className="text-ink-muted hover:text-ink shrink-0 p-0.5"
              title="Editar nota interna"
            >
              <Edit2 className="size-3" />
            </button>
          </div>
        )}
      </div>

      {/* Col 3: Status Dot & Popover */}
      <div className="pt-2 flex items-center justify-end">
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex size-6 items-center justify-center rounded hover:bg-surface-hover transition-colors"
              title={`Situação do campo: ${
                rawManualStatus === "pend"
                  ? "Pendente"
                  : rawManualStatus === "conf"
                  ? "A confirmar"
                  : rawManualStatus === "na"
                  ? "Não se aplica"
                  : isFilled
                  ? "OK / Preenchido"
                  : "A preencher"
              }`}
            >
              <span
                className={cn(
                  "size-2.5 rounded-full border transition-all",
                  effectiveDot === "ok" && "bg-[#43bdd4] border-[#43bdd4] shadow-[0_0_6px_rgba(67,189,212,0.35)]",
                  effectiveDot === "pend" && "bg-[#ff5c7f] border-[#ff5c7f] shadow-[0_0_6px_rgba(255,92,127,0.35)]",
                  effectiveDot === "conf" && "bg-[#ffe269] border-[#ffe269] shadow-[0_0_6px_rgba(255,226,105,0.35)]",
                  effectiveDot === "na" && "border-dashed border-[#a2a4ab] bg-transparent",
                  !effectiveDot && "border-[1.5px] border-[#6c6f78] bg-transparent hover:border-[#ececee]"
                )}
              />
            </button>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            sideOffset={4}
            className="w-56 rounded-xl border border-line-medium bg-surface-elevated p-2 shadow-xl flex flex-col gap-1 text-xs"
          >
            <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider px-2 py-1">
              Situação do Campo
            </span>

            {/* Pendente */}
            <button
              type="button"
              onClick={() => handleSetStatus("pend")}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-surface-hover",
                rawManualStatus === "pend" && "bg-surface-hover font-semibold text-ink"
              )}
            >
              <span className="size-2 rounded-full bg-[#ff5c7f]" />
              <span>Pendente</span>
            </button>

            {/* A confirmar */}
            <button
              type="button"
              onClick={() => handleSetStatus("conf")}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-surface-hover",
                rawManualStatus === "conf" && "bg-surface-hover font-semibold text-ink"
              )}
            >
              <span className="size-2 rounded-full bg-[#ffe269]" />
              <span>A confirmar</span>
            </button>

            {/* Não se aplica */}
            <button
              type="button"
              onClick={() => handleSetStatus("na")}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-surface-hover",
                rawManualStatus === "na" && "bg-surface-hover font-semibold text-ink"
              )}
            >
              <span className="size-2 rounded-full border border-dashed border-[#a2a4ab]" />
              <span>Não se aplica</span>
            </button>

            {rawManualStatus && (
              <button
                type="button"
                onClick={() => handleSetStatus(undefined)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-ink-muted hover:bg-surface-hover hover:text-ink transition-colors border-t border-line-subtle mt-0.5 pt-1.5"
              >
                <span>Limpar status manual</span>
              </button>
            )}

            {/* Nota interna section */}
            <div className="border-t border-line-subtle pt-1.5 mt-0.5">
              {!editingNote && !meta?.note ? (
                <button
                  type="button"
                  onClick={() => setEditingNote(true)}
                  className="flex items-center gap-1.5 text-xs text-ink-secondary hover:text-ink px-2 py-1 w-full text-left"
                >
                  <MessageSquare className="size-3" />
                  <span>Adicionar nota interna</span>
                </button>
              ) : (
                <div className="flex flex-col gap-1.5 px-1 py-1">
                  <label className="text-[10px] font-semibold text-ink-muted uppercase">
                    Nota interna da equipe
                  </label>
                  <textarea
                    rows={2}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Nota visível apenas para a equipe..."
                    className="w-full resize-none rounded-md border border-line-subtle bg-surface p-1.5 text-xs text-ink outline-none focus:border-line-focus"
                  />
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNote(false);
                        setNoteText(meta?.note ?? "");
                      }}
                      className="rounded px-2 py-0.5 text-[11px] text-ink-muted hover:bg-surface-hover"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNote}
                      className="rounded bg-ink px-2.5 py-0.5 text-[11px] font-medium text-surface hover:opacity-90"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
