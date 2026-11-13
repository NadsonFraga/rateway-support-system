"use client";

import * as React from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  ChevronRight,
  Plus,
  Trash2,
  ClipboardList,
  Building2,
  Loader2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRealtime } from "@/features/realtime/client";
import { useTabs } from "@/features/shell/tabs-store";
import { useDemandDrawer } from "@/features/demands/drawer-store";
import { DASHBOARD_TOPIC } from "./topics";
import {
  getDashboardData,
  markNoticeAsRead,
  deleteNotice,
  type DashboardData,
  type DashboardNotice,
} from "./actions";
import { NoticeDialog } from "./notice-dialog";

export function DashboardTab() {
  const openTab = useTabs((state) => state.open);
  const openDemand = useDemandDrawer((state) => state.open);

  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [noticeDialogOpen, setNoticeDialogOpen] = React.useState(false);
  const [showReadNotices, setShowReadNotices] = React.useState(false);
  const [ackingNoticeId, setAckingNoticeId] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      const res = await getDashboardData();
      setData(res);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  useRealtime(DASHBOARD_TOPIC, () => void loadData());

  async function handleAckNotice(noticeId: string) {
    try {
      setAckingNoticeId(noticeId);
      await markNoticeAsRead(noticeId);
      await loadData();
    } finally {
      setAckingNoticeId(null);
    }
  }

  async function handleDeleteNotice(noticeId: string) {
    if (!confirm("Deseja realmente remover este comunicado?")) return;
    await deleteNotice(noticeId);
    await loadData();
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-ink-muted" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-ink-muted">
        Não foi possível carregar o painel inicial.
      </div>
    );
  }

  const unreadNotices = data.notices.filter((n) => !n.isRead);
  const readNotices = data.notices.filter((n) => n.isRead);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background px-6 py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-ink">Painel Operacional</h1>
            <p className="text-xs text-ink-secondary mt-0.5">
              Visão consolidada de demandas, avisos institucionais e clientes em cadastro.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {data.canCreateNotice && (
              <button
                type="button"
                onClick={() => setNoticeDialogOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line-medium bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-hover transition-colors"
              >
                <Plus className="size-3.5" />
                <span>Novo comunicado</span>
              </button>
            )}
          </div>
        </div>

        {/* Notices Section (Mural de Avisos) */}
        {(unreadNotices.length > 0 || readNotices.length > 0) && (
          <section aria-labelledby="mural-avisos" className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-ink-secondary" />
                <h2 id="mural-avisos" className="text-xs font-semibold text-ink uppercase tracking-wider">
                  Mural de Avisos da Equipe
                </h2>
                {unreadNotices.length > 0 && (
                  <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-ink">
                    {unreadNotices.length} pendente{unreadNotices.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {readNotices.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowReadNotices((v) => !v)}
                  className="text-xs text-ink-muted hover:text-ink hover:underline"
                >
                  {showReadNotices ? "Ocultar lidos" : `Ver ${readNotices.length} aviso(s) lido(s)`}
                </button>
              )}
            </div>

            {/* Unread notices */}
            <div className="flex flex-col gap-2.5">
              {unreadNotices.map((notice) => (
                <NoticeCard
                  key={notice.id}
                  notice={notice}
                  canDelete={data.canCreateNotice}
                  isAcking={ackingNoticeId === notice.id}
                  onAck={() => handleAckNotice(notice.id)}
                  onDelete={() => handleDeleteNotice(notice.id)}
                />
              ))}

              {/* Read notices (collapsible) */}
              {showReadNotices &&
                readNotices.map((notice) => (
                  <NoticeCard
                    key={notice.id}
                    notice={notice}
                    canDelete={data.canCreateNotice}
                    isAcking={false}
                    onAck={() => {}}
                    onDelete={() => handleDeleteNotice(notice.id)}
                  />
                ))}
            </div>
          </section>
        )}

        {/* KPI Cards Grid */}
        <section aria-label="Indicadores Operacionais" className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Clientes em cadastro */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => openTab("cadastros")}
            onKeyDown={(e) => e.key === "Enter" && openTab("cadastros")}
            className="flex flex-col gap-1 rounded-xl border border-line-subtle bg-surface p-4 hover:border-line-medium transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span>Clientes em cadastro</span>
              <Building2 className="size-4 text-ink-muted group-hover:text-ink transition-colors" />
            </div>
            <div className="text-2xl font-bold font-mono text-ink mt-1">
              {data.kpis.activeOnboardingClients}
            </div>
            <span className="text-[11px] text-ink-muted">Propriedades em fase de cadastro</span>
          </div>

          {/* Card 2: Atrasadas / Risco */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => openTab("cadastros")}
            onKeyDown={(e) => e.key === "Enter" && openTab("cadastros")}
            className={cn(
              "flex flex-col gap-1 rounded-xl border p-4 transition-colors cursor-pointer group",
              data.kpis.overdueCount > 0
                ? "border-feedback-danger/30 bg-feedback-danger/5 hover:border-feedback-danger/50"
                : "border-line-subtle bg-surface hover:border-line-medium"
            )}
          >
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span>Canais atrasados</span>
              <AlertTriangle
                className={cn(
                  "size-4",
                  data.kpis.overdueCount > 0 ? "text-feedback-danger" : "text-ink-muted"
                )}
              />
            </div>
            <div
              className={cn(
                "text-2xl font-bold font-mono mt-1",
                data.kpis.overdueCount > 0 ? "text-feedback-danger" : "text-ink"
              )}
            >
              {data.kpis.overdueCount}
            </div>
            <span className="text-[11px] text-ink-muted">Passaram da data limite</span>
          </div>

          {/* Card 3: Demandas Abertas */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => openTab("demandas")}
            onKeyDown={(e) => e.key === "Enter" && openTab("demandas")}
            className="flex flex-col gap-1 rounded-xl border border-line-subtle bg-surface p-4 hover:border-line-medium transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span>Demandas abertas</span>
              <ClipboardList className="size-4 text-ink-muted group-hover:text-ink transition-colors" />
            </div>
            <div className="text-2xl font-bold font-mono text-ink mt-1">
              {data.kpis.openDemandsTotal}
            </div>
            <span className="text-[11px] text-ink-muted">Total de tickets ativos</span>
          </div>

          {/* Card 4: Demandas Finalizadas na Semana */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => openTab("demandas")}
            onKeyDown={(e) => e.key === "Enter" && openTab("demandas")}
            className="flex flex-col gap-1 rounded-xl border border-line-subtle bg-surface p-4 hover:border-line-medium transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span>Finalizadas na semana</span>
              <CheckCircle2 className="size-4 text-ink-muted group-hover:text-ink transition-colors" />
            </div>
            <div className="text-2xl font-bold font-mono text-ink mt-1">
              {data.kpis.completedThisWeek}
            </div>
            <span className="text-[11px] text-ink-muted">Concluídas nos últimos 7 dias</span>
          </div>
        </section>

        {/* Section: Minhas Demandas */}
        <section aria-labelledby="minhas-demandas" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="size-4 text-ink-secondary" />
              <h2 id="minhas-demandas" className="text-xs font-semibold text-ink uppercase tracking-wider">
                Minhas Demandas Atribuídas
              </h2>
              <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-mono text-ink-muted">
                {data.myDemands.length}
              </span>
            </div>

            <button
              type="button"
              onClick={() => openTab("demandas")}
              className="flex items-center gap-1 text-xs text-ink-secondary hover:text-ink hover:underline"
            >
              <span>Ver todas as demandas</span>
              <ExternalLink className="size-3" />
            </button>
          </div>

          {data.myDemands.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-line-subtle bg-surface p-8 text-center text-xs text-ink-muted">
              <p>Nenhuma demanda atribuída a você no momento.</p>
            </div>
          ) : (
            <div className="flex flex-col overflow-hidden rounded-xl border border-line-subtle bg-surface divide-y divide-line-subtle">
              {data.myDemands.map((demand) => (
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
                        {demand.client && <span className="font-medium text-ink">{demand.client.name}</span>}
                        {demand.platform && (
                          <>
                            <span>•</span>
                            <span>{demand.platform.name}</span>
                          </>
                        )}
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
                    {demand.priority === "critica" && (
                      <span className="rounded bg-feedback-danger/10 px-1.5 py-0.5 text-[10px] font-semibold text-feedback-danger uppercase">
                        Crítica
                      </span>
                    )}
                    <ChevronRight className="size-4 text-ink-muted group-hover:text-ink transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <NoticeDialog
        open={noticeDialogOpen}
        onOpenChange={setNoticeDialogOpen}
        onSuccess={loadData}
      />
    </div>
  );
}

function NoticeCard({
  notice,
  canDelete,
  isAcking,
  onAck,
  onDelete,
}: {
  notice: DashboardNotice;
  canDelete: boolean;
  isAcking: boolean;
  onAck: () => void;
  onDelete: () => void;
}) {
  const formattedDate = new Date(notice.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-start justify-between gap-3 rounded-xl border p-4 transition-colors",
        notice.isRead
          ? "border-line-subtle bg-surface/50 opacity-70"
          : "border-line-medium bg-surface shadow-xs"
      )}
    >
      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <span className="font-semibold text-ink">{notice.authorName}</span>
          <span>•</span>
          <span>{formattedDate}</span>
          {notice.expiresAt && (
            <>
              <span>•</span>
              <span>Expira em {new Date(notice.expiresAt).toLocaleDateString("pt-BR")}</span>
            </>
          )}
        </div>
        <p className="text-xs text-ink leading-relaxed whitespace-pre-wrap">{notice.text}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        {!notice.isRead ? (
          <button
            type="button"
            disabled={isAcking}
            onClick={onAck}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line-medium bg-surface-elevated px-2.5 py-1 text-xs font-medium text-ink hover:bg-surface-hover disabled:opacity-50 transition-colors"
          >
            {isAcking ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-3.5" />
            )}
            <span>Marcar como ciente</span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] text-ink-muted">
            <CheckCircle2 className="size-3.5" />
            <span>Ciente</span>
          </span>
        )}

        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-ink-muted hover:text-feedback-danger transition-colors rounded"
            title="Excluir comunicado"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
