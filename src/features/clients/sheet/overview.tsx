"use client";

import * as React from "react";
import { Plus, ExternalLink, AlertCircle, Clock, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRealtime } from "@/features/realtime/client";
import { DEMANDS_TOPIC } from "@/features/demands/topics";
import { CADASTROS_TOPIC } from "@/features/cadastros/topics";
import { listDemandsForClient } from "@/features/demands/actions";
import { getClientDeployments } from "@/features/cadastros/actions";
import { useDemandDrawer } from "@/features/demands/drawer-store";
import { useTabs } from "@/features/shell/tabs-store";
import type { DemandListItem } from "@/features/demands/types";
import { STATUS_CONFIG } from "@/features/cadastros/matrix/status-menu";
import type { DeploymentStatus } from "@/features/cadastros/types";
import { EntityLogo } from "../components/bits";
import type { ClientDetail } from "../types";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-semibold tracking-[0.04em] text-ink-muted uppercase">{children}</h2>;
}

export function OverviewPanel({ client }: { client: ClientDetail }) {
  const openDemand = useDemandDrawer((state) => state.open);
  const openTab = useTabs((state) => state.open);

  const [demands, setDemands] = React.useState<DemandListItem[] | null>(null);
  const [deployments, setDeployments] = React.useState<
    Array<{
      catalogItemId: string;
      channelName: string;
      logoUrl: string | null;
      status: DeploymentStatus;
      bottleneck: string | null;
      deadline: string | null;
    }>
  >([]);
  const [loading, setLoading] = React.useState(true);

  const loadData = React.useCallback(async () => {
    try {
      const [demandsList, deps] = await Promise.all([
        listDemandsForClient(client.id),
        getClientDeployments(client.id),
      ]);
      setDemands(demandsList);
      setDeployments(deps);
    } catch (err) {
      console.error("Failed to load overview data:", err);
    } finally {
      setLoading(false);
    }
  }, [client.id]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  useRealtime(DEMANDS_TOPIC, () => void loadData());
  useRealtime(CADASTROS_TOPIC, () => void loadData());

  const contractedDeployments = deployments.filter((d) => d.status !== "nao_contratado");
  const liveCount = contractedDeployments.filter((d) => d.status === "no_ar").length;
  const contractedCount = contractedDeployments.length;
  const progressPct = contractedCount > 0 ? Math.round((liveCount / contractedCount) * 100) : 0;

  return (
    <div className="grid min-h-full grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* Left Column: Active Demands */}
      <section aria-labelledby="demandas-cliente" className="flex flex-col gap-4 px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 id="demandas-cliente" className="text-base font-semibold text-ink">
              Demandas ativas
            </h2>
            {demands && (
              <span className="rounded-full bg-surface-muted px-2 py-0.5 font-mono text-xs text-ink-muted">
                {demands.length}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => openTab("demandas")}
            className="flex items-center gap-1 text-xs text-ink-secondary hover:text-ink hover:underline"
          >
            <span>Ver todas</span>
            <ExternalLink className="size-3" />
          </button>
        </div>

        {loading ? (
          <div className="flex h-36 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-ink-muted" />
          </div>
        ) : !demands || demands.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-line-subtle bg-surface p-8 text-center text-xs text-ink-muted">
            <p>Nenhuma demanda ativa aberta para esta propriedade.</p>
          </div>
        ) : (
          <div className="flex flex-col overflow-hidden rounded-xl border border-line-subtle bg-surface divide-y divide-line-subtle">
            {demands.map((demand) => (
              <div
                key={demand.id}
                role="button"
                tabIndex={0}
                onClick={() => openDemand(demand.code)}
                onKeyDown={(e) => e.key === "Enter" && openDemand(demand.code)}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-hover/70 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs text-ink-muted shrink-0">{demand.code}</span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-ink truncate group-hover:underline">
                      {demand.title}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-ink-muted">
                      {demand.platform && <span>{demand.platform.name}</span>}
                      {demand.dueDate && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {demand.dueDate}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {demand.assignees.length > 0 && (
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {demand.assignees.slice(0, 3).map((a) => (
                        <span
                          key={a.id}
                          className="inline-flex size-6 items-center justify-center rounded-full bg-surface-muted text-[10px] font-semibold text-ink border border-surface"
                          title={a.name}
                        >
                          {a.name.slice(0, 2).toUpperCase()}
                        </span>
                      ))}
                    </div>
                  )}
                  <ChevronRight className="size-4 text-ink-muted group-hover:text-ink transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Right Column: Systems & Deployment Summary */}
      <aside className="flex flex-col gap-6 border-l border-line-subtle px-6 py-6 bg-surface/30">
        {/* Systems block */}
        <section className="flex flex-col gap-1">
          <SectionTitle>Sistemas</SectionTitle>
          {(
            [
              ["Channel Manager", client.channelManager],
              ["PMS", client.pms],
            ] as const
          ).map(([label, item]) => (
            <div key={label} className="flex h-9 items-center justify-between gap-3">
              <span className="text-[13px] text-ink-secondary">{label}</span>
              {item ? (
                <span className="flex min-w-0 items-center gap-2 text-sm text-ink">
                  <EntityLogo name={item.name} logoUrl={item.logoUrl} />
                  <span className="truncate">{item.name}</span>
                </span>
              ) : (
                <span className="text-sm text-ink-muted">Não informado</span>
              )}
            </div>
          ))}
        </section>

        {/* Deployment Summary block */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <SectionTitle>Implantação</SectionTitle>
            <button
              type="button"
              onClick={() => openTab("cadastros")}
              className="flex items-center gap-1 text-[11px] text-ink-secondary hover:text-ink hover:underline"
            >
              <span>Matriz Geral</span>
              <ExternalLink className="size-3" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="flex flex-col gap-1.5 rounded-lg border border-line-subtle bg-surface p-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-ink-secondary">Canais no ar</span>
              <span className="font-semibold text-ink">
                {liveCount}/{contractedCount}
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

          {/* Channel list */}
          {deployments.length === 0 ? (
            <p className="text-xs text-ink-muted">Nenhum canal configurado nesta propriedade.</p>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
              {deployments.map((dep) => {
                const config = STATUS_CONFIG[dep.status];
                const Icon = config.icon;
                return (
                  <div
                    key={dep.catalogItemId}
                    className="flex items-center justify-between gap-2 rounded-md border border-line-subtle bg-surface px-2.5 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {dep.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={dep.logoUrl}
                          alt={dep.channelName}
                          className="size-4 rounded object-contain shrink-0"
                        />
                      ) : (
                        <span className="flex size-4 items-center justify-center rounded bg-surface-muted text-[9px] font-bold text-ink-muted shrink-0">
                          {dep.channelName.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <span className="truncate font-medium text-ink">{dep.channelName}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {dep.bottleneck && (
                        <span
                          className="rounded bg-surface-muted px-1.5 py-0.5 text-[10px] text-ink-muted max-w-[90px] truncate"
                          title={dep.bottleneck}
                        >
                          {dep.bottleneck}
                        </span>
                      )}
                      <span
                        className="inline-flex items-center gap-1 text-[11px] text-ink-secondary"
                        title={config.label}
                      >
                        <Icon className={cn("size-3.5", config.badgeClass)} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}
