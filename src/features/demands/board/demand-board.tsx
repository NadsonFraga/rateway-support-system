"use client";

import * as React from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { StatusDot } from "@/components/ui/status";
import { cn } from "@/lib/utils";
import { EntityLogo } from "@/features/clients/components/bits";
import { moveDemand } from "../actions";
import { AvatarStack, DueText, PriorityMark } from "../components/bits";
import { dotLabel } from "../list/demand-row";
import { BOARD_COLUMNS, compareUrgency, demandDot, DEMAND_STATUS_LABEL, type DemandStatus } from "../rules";
import type { DemandListItem } from "../types";

// Quadro Kanban (demandas-spec.md §2, D-99): arrastar muda a situação na hora (D-66), se ninguém estiver editando.
export function DemandBoard({
  demands,
  onOpen,
  onMoved,
  onShowHistory,
}: {
  demands: DemandListItem[];
  onOpen: (demand: DemandListItem, list: DemandListItem[]) => void;
  onMoved: (id: string, status: DemandStatus) => void;
  onShowHistory: () => void;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));

  async function onDragEnd(event: DragEndEvent) {
    const status = event.over?.id as DemandStatus | undefined;
    const demand = demands.find((item) => item.id === event.active.id);
    if (!status || !demand || demand.status === status) return;
    setError(null);
    onMoved(demand.id, status);
    const result = await moveDemand(demand.id, status);
    if (!result.ok) {
      setError(result.error);
      onMoved(demand.id, demand.status);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {error && (
        <p role="alert" className="px-8 pb-2 text-[13px] text-coral">
          {error}
        </p>
      )}
      <DndContext sensors={sensors} onDragEnd={(event) => void onDragEnd(event)}>
        <div className="grid min-h-0 flex-1 grid-cols-4 gap-3 overflow-x-auto px-6 pb-6">
          {BOARD_COLUMNS.map((status) => {
            const items = demands.filter((item) => item.status === status).sort((a, b) => compareUrgency(a, b));
            return (
              <Column key={status} status={status} count={items.length} onShowHistory={status === "concluida" ? onShowHistory : undefined}>
                {items.map((demand) => (
                  <Card key={demand.id} demand={demand} onOpen={() => onOpen(demand, items)} />
                ))}
              </Column>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}

const columnLabel = (status: DemandStatus) => (status === "concluida" ? "Concluídas" : DEMAND_STATUS_LABEL[status]);

function Column({
  status,
  count,
  children,
  onShowHistory,
}: {
  status: DemandStatus;
  count: number;
  children: React.ReactNode;
  onShowHistory?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      aria-label={`${columnLabel(status)}, ${count} demandas`}
      className={cn(
        "flex min-h-0 min-w-[240px] flex-col rounded-xl border border-line-subtle bg-sidebar transition-colors",
        isOver && "border-line-strong bg-surface-hover"
      )}
    >
      <header className="flex h-10 shrink-0 items-center gap-2 px-3">
        <h2 className="text-[13px] font-medium text-ink">{columnLabel(status)}</h2>
        <span className="tabular text-[13px] text-ink-muted">{count}</span>
        {onShowHistory && (
          <button type="button" onClick={onShowHistory} className="ml-auto text-xs text-ink-secondary hover:text-ink">
            Últimos 7 dias · ver histórico
          </button>
        )}
      </header>
      <div className="flex min-h-16 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">{children}</div>
    </section>
  );
}

function Card({ demand, onOpen }: { demand: DemandListItem; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: demand.id });
  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...attributes}
      {...listeners}
      aria-roledescription="Cartão arrastável"
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter") onOpen();
        else listeners?.onKeyDown?.(event);
      }}
      className={cn(
        "flex cursor-pointer flex-col gap-2 rounded-lg border border-line-subtle bg-surface p-3 text-sm outline-offset-2 hover:border-line-medium",
        isDragging && "relative z-10 border-line-strong shadow-none"
      )}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5">
          <StatusDot status={demandDot(demand)} label={dotLabel(demand)} />
        </span>
        <span id={`cartao-${demand.id}`} className="min-w-0 flex-1 font-medium tracking-[-0.012em] text-ink">
          {demand.title}
        </span>
        <span id={`cartao-${demand.id}-ajuda`} className="sr-only">
          {demand.code}. Situação: {DEMAND_STATUS_LABEL[demand.status]}. Enter abre; espaço pega para mover entre as colunas.
        </span>
        <PriorityMark priority={demand.priority} />
      </div>
      {(demand.client || demand.platform) && (
        <div className="flex min-w-0 items-center gap-2 text-[13px] text-ink-secondary">
          {demand.platform && <EntityLogo name={demand.platform.name} logoUrl={demand.platform.logoUrl} size={16} />}
          {demand.client && <span className="truncate">{demand.client.name}</span>}
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-ink-muted">{demand.code}</span>
        <span className="flex items-center gap-2">
          <DueText demand={demand} />
          <AvatarStack people={demand.assignees} size={20} />
        </span>
      </div>
    </article>
  );
}
