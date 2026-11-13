"use client";

import * as React from "react";
import { AlertCircle, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeploymentStatus, MatrixChannelHeader, MatrixRow } from "../types";
import {
  STATUS_CONFIG,
  STATUS_CYCLE,
  StatusMenu,
  AtivoIcon,
  AndamentoIcon,
  FocoIcon,
  AfazerIcon,
  NoneIcon,
} from "./status-menu";
import { setChannelStatus } from "../actions";

interface MatrixViewProps {
  channels: MatrixChannelHeader[];
  matrix: MatrixRow[];
  searchQuery: string;
  showCompleted?: boolean;
  onRefresh: () => Promise<void>;
}

export function MatrixView({ channels, matrix, searchQuery, showCompleted = false, onRefresh }: MatrixViewProps) {
  const [hoveredCell, setHoveredCell] = React.useState<{ rowId: string; colId: string } | null>(
    null
  );

  const filteredRows = React.useMemo(() => {
    return matrix.filter((row) => {
      const matchesSearch =
        !searchQuery ||
        row.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.clientCode.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // By default, strictly show only establishments that have pending channels (a_cadastrar or em_andamento)
      if (!showCompleted) {
        const hasPending = Object.values(row.channels).some(
          (c) => c.status === "a_cadastrar" || c.status === "em_andamento"
        );
        if (!hasPending) return false;
      }

      return true;
    });
  }, [matrix, searchQuery, showCompleted]);

  async function handleStatusChange(
    clientId: string,
    channelId: string,
    status: DeploymentStatus,
    bottleneck?: string
  ) {
    await setChannelStatus(clientId, channelId, status, bottleneck);
    await onRefresh();
  }

  function handleCellClick(
    clientId: string,
    channelId: string,
    currentStatus: DeploymentStatus
  ) {
    const nextStatus = STATUS_CYCLE[currentStatus] ?? "a_cadastrar";
    void handleStatusChange(clientId, channelId, nextStatus);
  }

  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-ink-muted">
        <p className="text-sm">Nenhum canal cadastrado no catálogo.</p>
        <p className="text-xs text-ink-muted/70 mt-1">
          Cadastre canais em Configurações &gt; Catálogo com a categoria &ldquo;canal&rdquo;.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Canonical Legend matching Image 4 */}
      <div className="flex flex-wrap items-center gap-5 px-6 py-2.5 text-xs text-ink-muted border-b border-line-subtle bg-surface/30 shrink-0">
        <span className="flex items-center gap-1.5">
          <AfazerIcon />
          <span>A cadastrar</span>
        </span>
        <span className="flex items-center gap-1.5">
          <AndamentoIcon />
          <span>Em andamento</span>
        </span>
        <span className="flex items-center gap-1.5">
          <AtivoIcon />
          <span>Ativo</span>
        </span>
        <span className="flex items-center gap-1.5">
          <FocoIcon />
          <span>Feito pela FOCO</span>
        </span>
        <span className="flex items-center gap-1.5">
          <NoneIcon />
          <span>Não contratado</span>
        </span>
        <span className="ml-auto text-[11px] text-ink-muted">
          Exibindo {filteredRows.length} de {matrix.length} estabelecimentos · Clique na célula para mudar
        </span>
      </div>

      {/* Crosshair Matrix Table (Compact table.mx layout) */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="sticky top-0 z-20 bg-surface border-b border-line-medium">
              <th className="sticky left-0 z-30 min-w-[240px] max-w-[280px] bg-surface px-4 py-2 text-xs font-semibold text-ink uppercase tracking-wider border-r border-line-subtle">
                Estabelecimento
              </th>
              {channels.map((ch) => {
                const isColHovered = hoveredCell?.colId === ch.id;
                // Compact display name (e.g. Booking, Airbnb, Expedia)
                const shortName = ch.name.replace(".com", "").replace(" Meu Negócio", "");
                return (
                  <th
                    key={ch.id}
                    className={cn(
                      "min-w-[68px] max-w-[80px] px-2 py-2 text-center text-xs font-medium text-ink-secondary border-r border-line-subtle transition-colors truncate",
                      isColHovered ? "bg-surface-hover text-ink" : "bg-surface"
                    )}
                    title={ch.name}
                  >
                    {shortName}
                  </th>
                );
              })}
              <th className="w-16 px-3 py-2 text-center text-xs font-semibold text-ink-muted uppercase">
                Ativos
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-subtle bg-surface">
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={channels.length + 2}
                  className="px-6 py-12 text-center text-xs text-ink-muted"
                >
                  Nenhum cadastro em aberto com os filtros selecionados.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const isRowHovered = hoveredCell?.rowId === row.clientId;
                return (
                  <tr
                    key={row.clientId}
                    className={cn(
                      "transition-colors group",
                      isRowHovered ? "bg-surface-hover/60" : "hover:bg-surface-hover/30"
                    )}
                  >
                    {/* Sticky client info cell */}
                    <td
                      className={cn(
                        "sticky left-0 z-10 px-4 py-2 border-r border-line-subtle transition-colors",
                        isRowHovered ? "bg-surface-hover" : "bg-surface"
                      )}
                    >
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-ink-muted shrink-0">
                            #{row.clientCode}
                          </span>
                          <span className="text-xs font-semibold text-ink truncate">
                            {row.clientName}
                          </span>
                        </div>
                        <span className="text-[11px] text-ink-muted truncate">
                          {row.serviceName}
                        </span>
                      </div>
                    </td>

                    {/* Channel matrix cells */}
                    {channels.map((ch) => {
                      const data = row.channels[ch.id];
                      const status: DeploymentStatus = data?.status ?? "nao_contratado";
                      const config = STATUS_CONFIG[status];
                      const Icon = config.icon;
                      const isColHovered = hoveredCell?.colId === ch.id;
                      const isExactCell = isRowHovered && isColHovered;

                      return (
                        <td
                          key={ch.id}
                          onMouseEnter={() =>
                            setHoveredCell({ rowId: row.clientId, colId: ch.id })
                          }
                          onMouseLeave={() => setHoveredCell(null)}
                          className={cn(
                            "px-1 py-1 text-center border-r border-line-subtle transition-colors",
                            isExactCell
                              ? "bg-surface-hover ring-1 ring-line-focus inset-0"
                              : isColHovered || isRowHovered
                              ? "bg-surface-hover/40"
                              : ""
                          )}
                        >
                          <StatusMenu
                            clientId={row.clientId}
                            clientName={row.clientName}
                            channelId={ch.id}
                            channelName={ch.name}
                            currentStatus={status}
                            currentBottleneck={data?.bottleneck}
                            onSelectStatus={(newStatus, newBottleneck) =>
                              handleStatusChange(row.clientId, ch.id, newStatus, newBottleneck)
                            }
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                // If plain click, cycle immediately!
                                if (!e.shiftKey && !e.altKey) {
                                  e.preventDefault();
                                  handleCellClick(row.clientId, ch.id, status);
                                }
                              }}
                              className="group/btn relative inline-flex size-7 items-center justify-center rounded hover:bg-surface-elevated transition-all"
                              title={`${ch.name}: ${config.label}${data?.bottleneck ? ` - Bloqueio: ${data.bottleneck}` : ""} (Clique para avançar, Shift+clique para menu completo)`}
                            >
                              <Icon className="size-4 transition-transform group-hover/btn:scale-110" />
                              {data?.bottleneck && (
                                <AlertCircle className="absolute -top-1 -right-1 size-2.5 text-feedback-danger fill-surface" />
                              )}
                            </button>
                          </StatusMenu>
                        </td>
                      );
                    })}

                    {/* Summary Live Count */}
                    <td className="px-2 py-2 text-center font-mono text-[11px] text-ink-muted tabular-nums">
                      {row.contractedCount > 0 ? (
                        <span className={cn(row.liveCount === row.contractedCount ? "text-cyan-fact font-semibold" : "text-ink")}>
                          {row.liveCount}/{row.contractedCount}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
