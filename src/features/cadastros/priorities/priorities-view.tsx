"use client";

import * as React from "react";
import {
  Clock,
  AlertTriangle,
  Calendar,
  ExternalLink,
  Edit2,
  CheckCircle2,
  Check,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTabs, wantsNewTab } from "@/features/shell/tabs-store";
import type { PriorityItem } from "../types";
import { updatePriorityMeta } from "../actions";

interface PrioritiesViewProps {
  priorities: PriorityItem[];
  searchQuery: string;
  onRefresh: () => Promise<void>;
}

export function PrioritiesView({ priorities, searchQuery, onRefresh }: PrioritiesViewProps) {
  const navigate = useTabs((state) => state.navigate);
  const [urgencyFilter, setUrgencyFilter] = React.useState<"todos" | "atrasado" | "perto">("todos");

  const filteredItems = React.useMemo(() => {
    return priorities.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.clientCode.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (urgencyFilter !== "todos" && item.urgency !== urgencyFilter) {
        return false;
      }

      return true;
    });
  }, [priorities, searchQuery, urgencyFilter]);

  function handleOpenClient(item: PriorityItem, e: React.MouseEvent) {
    navigate("cliente", { codigo: item.clientCode }, wantsNewTab(e));
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sub-bar with urgency filters */}
      <div className="flex items-center justify-between gap-3 px-6 py-2.5 border-b border-line-subtle bg-surface/50 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-ink-muted text-[11px] font-semibold uppercase tracking-wider">
            Filtrar:
          </span>
          {(
            [
              ["todos", "Todos"],
              ["atrasado", "Atrasados"],
              ["perto", "Vencendo em breve"],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setUrgencyFilter(val)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs border transition-colors",
                urgencyFilter === val
                  ? "border-line-focus bg-surface-hover text-ink font-medium"
                  : "border-line-subtle bg-surface text-ink-secondary hover:bg-surface-hover"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="text-ink-muted text-xs">
          {filteredItems.length} de {priorities.length} propriedades na fila
        </span>
      </div>

      {/* Priorities List */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-4xl flex flex-col gap-3">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-ink-muted">
              <p className="text-sm">Nenhuma propriedade encontrada na fila de prioridades.</p>
              <p className="text-xs text-ink-muted/70 mt-1">
                Todas as implantações estão concluídas ou não correspondem ao filtro.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const progressPct =
                item.contractedCount > 0
                  ? Math.round((item.liveCount / item.contractedCount) * 100)
                  : 0;

              return (
                <div
                  key={item.clientId}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-line-subtle bg-surface p-4 hover:border-line-medium transition-colors"
                >
                  {/* Left: Client info & urgency */}
                  <div className="flex flex-col gap-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-ink-muted font-medium">
                        {item.clientCode}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleOpenClient(item, e)}
                        className="text-sm font-semibold text-ink hover:underline text-left truncate flex items-center gap-1.5"
                      >
                        <span>{item.clientName}</span>
                        <ExternalLink className="size-3 text-ink-muted inline shrink-0" />
                      </button>

                      {/* Urgency Badge */}
                      {item.urgency === "atrasado" && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-feedback-danger/30 bg-feedback-danger/10 px-2 py-0.5 text-[11px] font-medium text-feedback-danger">
                          <AlertTriangle className="size-3" />
                          {item.deadlineText}
                        </span>
                      )}
                      {item.urgency === "perto" && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-feedback-warning/40 bg-feedback-warning/10 px-2 py-0.5 text-[11px] font-medium text-ink">
                          <Clock className="size-3 text-feedback-warning" />
                          {item.deadlineText}
                        </span>
                      )}
                      {item.urgency === "normal" && item.deadline && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-line-subtle bg-surface-muted px-2 py-0.5 text-[11px] text-ink-muted">
                          <Calendar className="size-3" />
                          Prazo: {item.deadlineText}
                        </span>
                      )}

                      {/* Priority Tag */}
                      <PriorityBadge priority={item.priority} />
                    </div>

                    <div className="flex items-center gap-3 text-xs text-ink-secondary flex-wrap">
                      <span>{item.serviceName}</span>
                      {item.bottleneck && (
                        <>
                          <span className="text-ink-muted">•</span>
                          <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[11px] text-ink font-medium border border-line-subtle">
                            Bloqueio: {item.bottleneck}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Progress bar & Meta editor */}
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="flex flex-col gap-1 w-36">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[11px] text-ink-muted">Canais no ar</span>
                        <span className="font-semibold text-ink">
                          {item.liveCount}/{item.contractedCount}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-surface-muted overflow-hidden">
                        <div
                          className="h-full bg-ink transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-ink-muted text-right font-mono">
                        {progressPct}% concluído
                      </span>
                    </div>

                    <PriorityMetaEditor item={item} onSaved={onRefresh} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: PriorityItem["priority"] }) {
  if (priority === "critica") {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-feedback-danger/10 px-1.5 py-0.5 text-[10px] font-semibold text-feedback-danger uppercase tracking-wider">
        Crítica
      </span>
    );
  }
  if (priority === "alta") {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold text-ink uppercase tracking-wider">
        Alta
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium text-ink-muted uppercase tracking-wider">
      Normal
    </span>
  );
}

function PriorityMetaEditor({
  item,
  onSaved,
}: {
  item: PriorityItem;
  onSaved: () => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [priority, setPriority] = React.useState<PriorityItem["priority"]>(item.priority);
  const [deadline, setDeadline] = React.useState(item.deadline ?? "");
  const [bottleneck, setBottleneck] = React.useState(item.bottleneck ?? "");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setPriority(item.priority);
    setDeadline(item.deadline ?? "");
    setBottleneck(item.bottleneck ?? "");
  }, [item, open]);

  async function handleSave() {
    try {
      setLoading(true);
      await updatePriorityMeta(item.clientId, priority, deadline || undefined, bottleneck.trim() || undefined);
      setOpen(false);
      await onSaved();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex size-8 items-center justify-center rounded-lg border border-line-subtle text-ink-secondary hover:bg-surface-hover hover:text-ink transition-colors"
          title="Editar prazo, prioridade e gargalo"
        >
          <Edit2 className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-72 rounded-xl border border-line-medium bg-surface-elevated p-3 shadow-xl flex flex-col gap-3"
      >
        <div className="flex flex-col gap-0.5 pb-2 border-b border-line-subtle">
          <span className="text-xs font-semibold text-ink">Ajustar Meta & Prazo</span>
          <span className="text-[11px] text-ink-muted truncate">{item.clientName}</span>
        </div>

        {/* Priority Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-ink-secondary">Prioridade</label>
          <div className="grid grid-cols-3 gap-1">
            {(["normal", "alta", "critica"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={cn(
                  "rounded-md border py-1 text-center text-xs capitalize transition-colors",
                  priority === p
                    ? "border-line-focus bg-surface-hover text-ink font-semibold"
                    : "border-line-subtle text-ink-secondary hover:bg-surface-hover"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Deadline Date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-ink-secondary">Data Limite (Prazo)</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full rounded-md border border-line-subtle bg-surface px-2 py-1 text-xs text-ink outline-none focus:border-line-focus"
          />
        </div>

        {/* Bottleneck note */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-ink-secondary">Gargalo / Bloqueio</label>
          <input
            type="text"
            value={bottleneck}
            onChange={(e) => setBottleneck(e.target.value)}
            placeholder="Ex: Aguardando documento..."
            className="w-full rounded-md border border-line-subtle bg-surface px-2.5 py-1 text-xs text-ink placeholder:text-ink-muted outline-none focus:border-line-focus"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-line-subtle">
          <button
            type="button"
            disabled={loading}
            onClick={() => setOpen(false)}
            className="rounded-md px-2.5 py-1 text-xs text-ink-secondary hover:bg-surface-hover"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSave}
            className="inline-flex items-center gap-1 rounded-md bg-ink px-3 py-1 text-xs font-medium text-surface hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
            Salvar
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
