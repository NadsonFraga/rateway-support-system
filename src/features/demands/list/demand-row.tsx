"use client";

import * as React from "react";
import { StatusBadge, StatusDot } from "@/components/ui/status";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { EntityLogo } from "@/features/clients/components/bits";
import { useTabs, wantsNewTab } from "@/features/shell/tabs-store";
import { AvatarStack, DueText, PriorityMark } from "../components/bits";
import { DoneCircle } from "../components/checks";
import { canConclude, demandDot, DEMAND_STATUS_LABEL, isClosed } from "../rules";
import type { DemandListItem } from "../types";
import { ColumnOrderContext, type ColumnKey } from "./columns";
import { DemandPreviewAnchor } from "./demand-preview";

// Concluir · ponto · plataforma · título · cliente · situação · atribuídos · prazo. Larguras e ordem vêm da lista
// (colunas ajustáveis, D-114) pelas variáveis abaixo e por ColumnOrderContext; fora dela vale o padrão.
export const DEMAND_COLUMNS = "grid-cols-[var(--demandas-colunas,20px_16px_20px_minmax(180px,1fr)_240px_150px_104px_112px)]";
export const DEMAND_COLUMNS_NO_CLIENT = "grid-cols-[var(--demandas-colunas-sem-cliente,20px_16px_20px_minmax(180px,1fr)_150px_104px_112px)]";

/** Rótulo do ponto: o fato que a cor mostra e a situação. */
export function dotLabel(demand: Pick<DemandListItem, "status" | "priority" | "dueDate" | "dueTime">) {
  const dot = demandDot(demand);
  const fact = {
    atrasada: "Atrasada ou crítica",
    "atencao-prazo": "Prazo em menos de 24h",
    "aguardando-retorno": "",
    "em-andamento": "",
    concluida: "",
  }[dot];
  return [DEMAND_STATUS_LABEL[demand.status], fact].filter(Boolean).join(" · ");
}

/** Quem ainda falta confirmar a parte (aprovação coletiva). */
export function missingConfirmations(demand: DemandListItem) {
  return demand.requireAllConfirm ? demand.assignees.filter((item) => !item.confirmedAt).map((item) => item.name) : [];
}

/**
 * Linha de demanda (44px, demandas-spec.md §3). Mesmo componente na lista, na Visão Geral do cliente
 * (sem a coluna Cliente) e no Início.
 */
export function DemandRow({
  demand,
  showClient = true,
  selected = false,
  finishing = false,
  onOpen,
  onToggleDone,
  onFocus,
  rowRef,
}: {
  demand: DemandListItem;
  showClient?: boolean;
  selected?: boolean;
  /** Acabou de ser marcada: título riscado enquanto espera ir para Concluídas (D-107). */
  finishing?: boolean;
  onOpen: () => void;
  onToggleDone?: () => void;
  onFocus?: () => void;
  rowRef?: (element: HTMLDivElement | null) => void;
}) {
  const navigate = useTabs((state) => state.navigate);
  const order = React.useContext(ColumnOrderContext);
  const closed = isClosed(demand.status);
  const checked = closed ? demand.status === "concluida" : finishing;
  const missing = missingConfirmations(demand);
  const blocked = !closed && !finishing && !canConclude(demand);
  const circleLabel = blocked
    ? `Não dá para concluir: falta confirmar ${missing.join(", ")}`
    : closed
      ? `Reabrir ${demand.title}`
      : finishing
        ? `Desfazer conclusão de ${demand.title}`
        : `Concluir ${demand.title}`;

  const cell = (key: ColumnKey) => {
    switch (key) {
      case "cliente":
        return (
          <span role="cell" className="min-w-0">
            {demand.client && (
              <button
                type="button"
                tabIndex={-1}
                onClick={(event) => {
                  event.stopPropagation();
                  navigate("cliente", { codigo: demand.client!.code }, wantsNewTab(event));
                }}
                className="flex max-w-full min-w-0 items-center gap-2 rounded px-1 -ml-1 text-[13px] text-ink-secondary hover:text-ink"
              >
                <EntityLogo name={demand.client.name} logoUrl={demand.client.logoUrl} size={16} />
                <span className="truncate">{demand.client.name}</span>
              </button>
            )}
          </span>
        );
      case "situacao":
        return (
          <span role="cell" className="min-w-0">
            <StatusBadge status={demandDot(demand)} label={DEMAND_STATUS_LABEL[demand.status]} />
          </span>
        );
      case "atribuidos":
        return (
          <span role="cell">
            <AvatarStack people={demand.assignees} />
          </span>
        );
      case "prazo":
        return (
          <span role="cell" className="text-right">
            <DueText demand={demand} />
          </span>
        );
    }
  };

  return (
    <div
      ref={rowRef}
      role="row"
      aria-label={`${demand.code} ${demand.title}`}
      data-codigo={demand.code}
      tabIndex={selected ? 0 : -1}
      onFocus={onFocus}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter") onOpen();
        // Espaço na linha selecionada marca ou desmarca a conclusão (o mesmo que o círculo).
        if (event.key === " " && onToggleDone && !blocked) {
          event.preventDefault();
          onToggleDone();
        }
      }}
      aria-keyshortcuts={onToggleDone ? "Space" : undefined}
      className={cn(
        "grid h-11 cursor-pointer items-center gap-3 rounded-md border-b border-line-subtle px-3 text-sm transition-colors duration-100 outline-offset-[-2px] hover:bg-surface-hover",
        showClient ? DEMAND_COLUMNS : DEMAND_COLUMNS_NO_CLIENT
      )}
    >
      <span role="cell" className="flex items-center justify-center">
        {onToggleDone && demand.status !== "cancelada" ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <DoneCircle checked={checked} disabled={blocked} label={circleLabel} onClick={onToggleDone} />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {blocked ? `Falta confirmar: ${missing.join(", ")}` : closed ? "Reabrir" : finishing ? "Desfazer" : "Concluir (Espaço)"}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </span>
      <span role="cell" className="flex items-center justify-center">
        <StatusDot status={demandDot(demand)} label={dotLabel(demand)} />
      </span>
      <span role="cell" className="flex items-center">
        {demand.platform ? <EntityLogo name={demand.platform.name} logoUrl={demand.platform.logoUrl} /> : <span className="size-5" />}
      </span>
      <span role="cell" className="flex min-w-0 items-center gap-2">
        <DemandPreviewAnchor code={demand.code}>
          <span
            className={cn(
              "truncate font-medium tracking-[-0.012em] transition-colors duration-200",
              checked ? "text-ink-muted line-through decoration-[1.5px]" : "text-ink"
            )}
          >
            {demand.title}
          </span>
        </DemandPreviewAnchor>
        <PriorityMark priority={demand.priority} />
      </span>
      {order
        .filter((key) => showClient || key !== "cliente")
        .map((key) => (
          <React.Fragment key={key}>{cell(key)}</React.Fragment>
        ))}
    </div>
  );
}
