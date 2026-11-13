"use client";

import * as React from "react";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtime } from "@/features/realtime/client";
import { cn } from "@/lib/utils";
import { previewDemand, toggleSubtask } from "../actions";
import { SubtaskCheck } from "../components/checks";
import { isEmptyDoc } from "../editor/doc";
import { RichText } from "../editor/rich-text";
import { DEMANDS_TOPIC } from "../topics";
import type { DemandPreview } from "../types";

const OPEN_DELAY = 450;
const CLOSE_DELAY = 180;

/**
 * Prévia ao passar o mouse no título (D-108): quadro ancorado na linha, com a descrição e as subtarefas,
 * que podem ser marcadas ali mesmo (D-106). Clicar dentro não abre o painel da demanda.
 */
export function DemandPreviewAnchor({ code, children }: { code: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const timer = React.useRef<number | null>(null);

  const schedule = (next: boolean) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(next), next ? OPEN_DELAY : CLOSE_DELAY);
  };
  React.useEffect(() => () => void (timer.current && window.clearTimeout(timer.current)), []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <span className="flex min-w-0" onMouseEnter={() => schedule(true)} onMouseLeave={() => schedule(false)}>
          {children}
        </span>
      </PopoverAnchor>
      <PopoverContent
        side="bottom"
        align="start"
        aria-label="Prévia da demanda"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onMouseEnter={() => schedule(true)}
        onMouseLeave={() => schedule(false)}
        // O quadro fica num portal, mas os eventos do React sobem até a linha: não deixar abrir o painel.
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        className="w-[420px] gap-4 p-4"
      >
        {open && <PreviewBody code={code} />}
      </PopoverContent>
    </Popover>
  );
}

function PreviewBody({ code }: { code: string }) {
  const [data, setData] = React.useState<DemandPreview | null | undefined>(undefined);
  const [problem, setProblem] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    void previewDemand(code).then(setData);
  }, [code]);
  React.useEffect(load, [load]);
  useRealtime<{ code: string }>(DEMANDS_TOPIC, (message) => {
    if (message.data.code === code) load();
  });

  async function toggle(id: string, done: boolean) {
    setProblem(null);
    setData((current) => current && { ...current, subtasks: current.subtasks.map((item) => (item.id === id ? { ...item, done } : item)) });
    const result = await toggleSubtask(id, done);
    if (!result.ok) {
      setProblem(result.error);
      load();
    }
  }

  if (data === undefined) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }
  if (data === null) return <p className="text-sm text-ink-secondary">Demanda não encontrada.</p>;

  const doneCount = data.subtasks.filter((item) => item.done).length;
  return (
    <>
      <section className="flex flex-col gap-1.5">
        <h3 className="text-xs font-medium text-ink-muted">Descrição</h3>
        {data.description && !isEmptyDoc(data.description) ? (
          <div className="max-h-48 overflow-y-auto">
            <RichText doc={data.description} />
          </div>
        ) : (
          <p className="text-sm text-ink-muted">Sem descrição.</p>
        )}
      </section>
      {data.subtasks.length > 0 && (
        <section className="flex flex-col gap-1">
          <h3 className="flex items-center text-xs font-medium text-ink-muted">
            Subtarefas
            <span className="tabular ml-auto">
              {doneCount} de {data.subtasks.length}
            </span>
          </h3>
          <ul className="flex max-h-56 flex-col overflow-y-auto">
            {data.subtasks.map((item) => (
              <li key={item.id} className="flex min-h-8 items-center gap-2.5">
                <SubtaskCheck
                  checked={item.done}
                  disabled={!!data.editingBy}
                  title={data.editingBy ? `${data.editingBy} está editando` : undefined}
                  label={item.text}
                  onChange={(done) => void toggle(item.id, done)}
                />
                <span className={cn("min-w-0 flex-1 text-sm", item.done ? "text-ink-muted line-through" : "text-ink")}>{item.text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {data.editingBy && <p className="text-[13px] text-ink-secondary">{data.editingBy} está editando esta demanda.</p>}
      {problem && (
        <p role="alert" className="text-[13px] text-coral">
          {problem}
        </p>
      )}
    </>
  );
}
