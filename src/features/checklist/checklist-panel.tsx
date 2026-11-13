"use client";

import * as React from "react";
import {
  Check,
  Copy,
  Download,
  FileText,
  Flag,
  MessageSquare,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  getChecklist,
  saveChecklist,
  updateChecklistStatus,
  generatePendingWhatsAppMessage,
  exportChecklistJson,
  type ChecklistView,
} from "./actions";
import { generateChecklistPdf } from "./export-pdf";
import { computeFullChecklistProgress } from "./rules";
import { CHECKLIST_MODULES, type ChecklistData, type FieldMetaRecord } from "./types";
import { Mod01Identification } from "./modules/mod-01-identification";
import { Mod02Contacts } from "./modules/mod-02-contacts";
import { Mod03Channels } from "./modules/mod-03-channels";
import { Mod04StructureOperations } from "./modules/mod-04-structure-operations";
import { Mod05Accommodations } from "./modules/mod-05-accommodations";
import { Mod06AmenitiesMatrix } from "./modules/mod-06-amenities-matrix";
import { Mod07Policies } from "./modules/mod-07-policies";
import { Mod08PaymentsBank } from "./modules/mod-08-payments-bank";
import { Mod09LocationSurroundings } from "./modules/mod-09-location-surroundings";
import { Mod10MediaCopywriting } from "./modules/mod-10-media-copywriting";

export function ChecklistPanel({ clientId }: { clientId: string }) {
  const [view, setView] = React.useState<ChecklistView | null | undefined>(undefined);
  const [activeModuleId, setActiveModuleId] = React.useState("identificacao");
  const [dirtyData, setDirtyData] = React.useState<ChecklistData | null>(null);
  const [dirtyMeta, setDirtyMeta] = React.useState<FieldMetaRecord | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [savedFeedback, setSavedFeedback] = React.useState(false);
  const [copiedWhats, setCopiedWhats] = React.useState(false);
  const [exportModalOpen, setExportModalOpen] = React.useState(false);
  const [hideSensitive, setHideSensitive] = React.useState(true);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let cancelled = false;
    void getChecklist(clientId)
      .then((res) => {
        if (!cancelled) {
          if (res) {
            setView(res);
            setDirtyData(res.data);
            setDirtyMeta(res.fieldMeta);
          } else {
            setView(null);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setView(null);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  const data = dirtyData ?? view?.data ?? {};
  const meta = dirtyMeta ?? view?.fieldMeta ?? {};

  // Instant reactive progress calculation at keystroke speed!
  const progress = React.useMemo(() => {
    return computeFullChecklistProgress(data, meta);
  }, [data, meta]);

  function patchData(patch: Partial<ChecklistData>) {
    setDirtyData((prev) => ({ ...(prev ?? data), ...patch }));
  }

  function patchMeta(key: string, val: any) {
    setDirtyMeta((prev) => ({ ...(prev ?? meta), [key]: val }));
  }

  const isDirty = dirtyData !== null || dirtyMeta !== null;
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);

  // Background Auto-Save (debounced 400ms after last change)
  React.useEffect(() => {
    if (!isDirty || saving) return;
    const timer = setTimeout(async () => {
      setSaving(true);
      try {
        const res = await saveChecklist(clientId, data, meta);
        if (res.success && view) {
          setView((prev) => (prev ? { ...prev, progressPercent: progress.pct, data, fieldMeta: meta } : prev));
          setDirtyData(null);
          setDirtyMeta(null);
          setLastSaved(new Date());
        }
      } catch (err) {
        console.error("Auto-save error:", err);
      } finally {
        setSaving(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [dirtyData, dirtyMeta, isDirty, clientId, data, meta, progress.pct, saving, view]);

  async function handleStatusChange(nextStatus: string) {
    await updateChecklistStatus(clientId, nextStatus);
    if (view) {
      setView({ ...view, status: nextStatus });
    }
  }

  async function copyWhatsApp() {
    const text = await generatePendingWhatsAppMessage(clientId);
    await navigator.clipboard.writeText(text);
    setCopiedWhats(true);
    setTimeout(() => setCopiedWhats(false), 2500);
  }

  async function downloadJson() {
    const jsonStr = await exportChecklistJson(clientId, hideSensitive);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const cleanName = (view?.clientName || "estabelecimento")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    a.download = `dados-${cleanName}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportModalOpen(false);
  }

  function downloadPdf() {
    if (!view) return;
    generateChecklistPdf({
      clientName: view.clientName,
      clientCode: view.clientCode,
      city: view.city,
      state: view.state,
      status: view.status,
      data,
      fieldMeta: meta,
    });
  }

  if (view === undefined) {
    return (
      <div className="flex flex-col gap-4 p-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (view === null) {
    return <div className="p-8 text-center text-sm text-ink-secondary">Cliente não encontrado.</div>;
  }

  const activeModuleIndex = CHECKLIST_MODULES.findIndex((m) => m.id === activeModuleId);
  const activeModule = CHECKLIST_MODULES[activeModuleIndex] ?? CHECKLIST_MODULES[0];

  function navigateModule(nextIndex: number) {
    if (nextIndex >= 0 && nextIndex < CHECKLIST_MODULES.length) {
      setActiveModuleId(CHECKLIST_MODULES[nextIndex].id);
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Top Chrome / Status Bar (#ckchrome in prototype) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-line-subtle bg-surface px-6 py-2 shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Tag Status */}
          <span className="rounded bg-surface-muted px-2 py-0.5 text-xs font-semibold text-ink uppercase tracking-wider border border-line-subtle">
            {view.status === "aprovado" ? "Aprovado" : view.status === "em_revisao" ? "Em revisão" : "Rascunho"}
          </span>

          {/* Live Progress Summary */}
          <span className="text-xs font-mono text-ink">
            <span className="font-bold text-ink">{progress.pct}%</span> preenchido
            <span className="text-ink-muted"> · </span>
            <span className={progress.pend > 0 ? "text-feedback-danger font-medium" : "text-ink-muted"}>
              {progress.pend} pendente{progress.pend !== 1 ? "s" : ""}
            </span>
            {progress.conf > 0 && (
              <>
                <span className="text-ink-muted"> · </span>
                <span className="text-yellow-fact font-medium">
                  {progress.conf} a confirmar
                </span>
              </>
            )}
          </span>

          {/* Automatic Save Indicator */}
          <span className="text-xs text-ink-muted font-mono">
            {saving ? (
              <span className="inline-flex items-center gap-1.5 text-ink-secondary animate-pulse">
                <Loader2 className="size-3 animate-spin" />
                Salvando…
              </span>
            ) : lastSaved ? (
              `Salvo ${lastSaved.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
            ) : view.updatedAt ? (
              `Salvo ${new Date(view.updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
            ) : (
              "Salvo automaticamente"
            )}
          </span>
        </div>

        {/* Action Buttons matching Image 1 */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyWhatsApp}
            className="h-8 gap-1.5 text-xs text-ink-secondary hover:text-ink"
            title="Copiar pendências para WhatsApp"
          >
            {copiedWhats ? <Check className="size-3.5 text-emerald-500" /> : <MessageSquare className="size-3.5" />}
            <span>{copiedWhats ? "Copiado!" : "WhatsApp"}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExportModalOpen(true)}
            className="h-8 gap-1.5 text-xs text-ink-secondary hover:text-ink"
            title="Exportar dados estruturados em JSON"
          >
            <Download className="size-3.5" />
            <span>JSON</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={downloadPdf}
            className="h-8 gap-1.5 text-xs text-ink-secondary hover:text-ink"
            title="Exportar ficha técnica em PDF oficial"
          >
            <FileText className="size-3.5" />
            <span>PDF</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={copyWhatsApp}
            className="h-8 gap-1.5 text-xs text-ink border-line-medium hover:bg-surface-hover"
            title="Cria demandas automáticas para itens pendentes"
          >
            <Flag className="size-3.5" />
            <span>Gerar demandas</span>
          </Button>

          {view.status !== "aprovado" && view.status !== "em_revisao" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange("em_revisao")}
              className="h-8 text-xs text-ink border-line-medium hover:bg-surface-hover"
            >
              Enviar para revisão
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => handleStatusChange(view.status === "aprovado" ? "rascunho" : "aprovado")}
            className={cn(
              "h-8 gap-1.5 text-xs font-semibold px-3 transition-colors",
              view.status === "aprovado"
                ? "bg-cyan-fact text-slate-950 hover:opacity-90"
                : "bg-surface-elevated text-ink hover:bg-surface-hover border border-line-medium"
            )}
          >
            <Check className="size-3.5" />
            <span>{view.status === "aprovado" ? "Aprovado" : "Aprovar ficha"}</span>
          </Button>
        </div>
      </div>

      {/* Main Grid: Sidebar (.mods) + Content (.form) */}
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[250px_minmax(0,1fr)] overflow-hidden">
        {/* Sidebar (.mods) */}
        <nav
          aria-label="Módulos do Checklist"
          className="flex flex-col gap-1 overflow-y-auto border-r border-line-subtle p-2.5 bg-surface/20 shrink-0"
        >
          {CHECKLIST_MODULES.map((mod) => {
            const active = activeModuleId === mod.id;
            const modPr = progress.mods[mod.id] ?? { pct: 0, pend: 0, conf: 0 };
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => {
                  setActiveModuleId(mod.id);
                  scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={cn(
                  "group relative grid grid-cols-[22px_minmax(0,1fr)_auto] gap-x-2 gap-y-1 items-center px-2.5 py-2 rounded-md text-left transition-colors text-xs cursor-pointer",
                  active
                    ? "bg-surface text-ink font-semibold shadow-xs ring-1 ring-line-subtle before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-4 before:bg-yellow-fact before:rounded-r"
                    : "text-ink-secondary hover:bg-surface-hover hover:text-ink font-normal"
                )}
              >
                <span className="font-mono text-[11.5px] text-ink-muted tabular-nums">
                  {mod.index}
                </span>
                <span className="truncate text-[13px]">{mod.title}</span>
                <span className="font-mono text-[11.5px] text-ink-muted shrink-0 tabular-nums text-right">
                  {modPr.pct}%
                </span>

                {/* Progress bar track (3px height matching canonical .bar) */}
                <div className="col-span-2 col-start-2 h-[3px] w-full rounded-full bg-line-subtle overflow-hidden">
                  <div
                    className="h-full bg-cyan-fact transition-all duration-300 rounded-full"
                    style={{ width: `${modPr.pct}%`, backgroundColor: "var(--cyan-fact, #43bdd4)" }}
                  />
                </div>

                {/* Flags: pendentes / a confirmar */}
                {(modPr.pend > 0 || modPr.conf > 0) && (
                  <div className="col-span-2 col-start-2 flex items-center gap-2 text-[11px]">
                    {modPr.pend > 0 && (
                      <span className="text-fact-coral font-medium">
                        {modPr.pend} pendente{modPr.pend > 1 ? "s" : ""}
                      </span>
                    )}
                    {modPr.conf > 0 && (
                      <span className="text-yellow-fact font-medium">
                        {modPr.conf} a confirmar
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Content Area (.form) */}
        <div ref={scrollRef} className="overflow-y-auto px-6 py-4">
          <div className="w-full flex flex-col gap-4">
            {/* Module Header (.fhead) */}
            <div className="flex flex-col gap-1 pb-2.5 border-b border-line-subtle">
              <h2 className="text-lg font-bold tracking-tight text-ink">{activeModule.title}</h2>
              <p className="text-xs text-ink-secondary">{activeModule.description}</p>
            </div>

            {/* Active Module Form */}
            <div className="flex flex-col gap-6 min-w-0">
              {activeModuleId === "identificacao" && (
                <Mod01Identification data={data} meta={meta} onChange={patchData} onMetaChange={patchMeta} />
              )}
              {activeModuleId === "contatos" && (
                <Mod02Contacts data={data} meta={meta} onChange={patchData} onMetaChange={patchMeta} />
              )}
              {activeModuleId === "canais" && (
                <Mod03Channels data={data} meta={meta} onChange={patchData} onMetaChange={patchMeta} />
              )}
              {activeModuleId === "estrutura" && (
                <Mod04StructureOperations data={data} meta={meta} onChange={patchData} onMetaChange={patchMeta} />
              )}
              {activeModuleId === "acomodacoes" && (
                <Mod05Accommodations data={data} meta={meta} onChange={patchData} onMetaChange={patchMeta} />
              )}
              {activeModuleId === "comodidades" && (
                <Mod06AmenitiesMatrix data={data} meta={meta} onChange={patchData} onMetaChange={patchMeta} />
              )}
              {activeModuleId === "politicas" && (
                <Mod07Policies data={data} meta={meta} onChange={patchData} onMetaChange={patchMeta} />
              )}
              {activeModuleId === "pagamentos" && (
                <Mod08PaymentsBank data={data} meta={meta} onChange={patchData} onMetaChange={patchMeta} />
              )}
              {activeModuleId === "localizacao" && (
                <Mod09LocationSurroundings data={data} meta={meta} onChange={patchData} onMetaChange={patchMeta} />
              )}
              {activeModuleId === "midia" && (
                <Mod10MediaCopywriting data={data} meta={meta} onChange={patchData} onMetaChange={patchMeta} />
              )}
            </div>

            {/* Bottom Module Navigation ("Avançar") */}
            <div className="flex items-center justify-between gap-3 pt-6 border-t border-line-subtle mt-6">
              {activeModuleIndex > 0 ? (
                <button
                  type="button"
                  onClick={() => navigateModule(activeModuleIndex - 1)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line-subtle bg-surface px-3 py-2 text-xs font-medium text-ink-secondary hover:bg-surface-hover hover:text-ink transition-colors"
                >
                  <ChevronLeft className="size-3.5" />
                  <span>{CHECKLIST_MODULES[activeModuleIndex - 1].title}</span>
                </button>
              ) : (
                <div />
              )}

              {activeModuleIndex < CHECKLIST_MODULES.length - 1 ? (
                <button
                  type="button"
                  onClick={() => navigateModule(activeModuleIndex + 1)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-fact text-slate-950 px-4 py-2 text-xs font-semibold hover:opacity-90 transition-all shadow-xs"
                >
                  <span>{CHECKLIST_MODULES[activeModuleIndex + 1].title}</span>
                  <ChevronRight className="size-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleStatusChange("aprovado")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-fact text-slate-950 px-4 py-2 text-xs font-semibold hover:opacity-90 transition-all shadow-xs"
                >
                  <Check className="size-3.5" />
                  <span>Concluir e Aprovar Ficha</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Export JSON Dialog */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader
            title="Exportar Dados do Checklist em JSON"
            description="Exporte a especificação completa desta propriedade para integração com outros sistemas."
          />
          <div className="flex flex-col gap-4 p-6">
            <div className="flex items-start gap-3 rounded-xl border border-line-subtle bg-surface-muted p-3">
              <ShieldCheck className="size-5 text-ink shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1 text-xs text-ink-secondary">
                <span className="font-semibold text-ink">Proteção de Credenciais e Senhas</span>
                <p>
                  Por padrão, senhas de canais e tokens do cofre são omitidos da exportação para preservar a
                  segurança operacional.
                </p>
                <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hideSensitive}
                    onChange={(e) => setHideSensitive(e.target.checked)}
                    className="size-4 rounded border-line-medium"
                  />
                  <span className="font-medium text-ink">Ocultar senhas e acessos confidenciais</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line-subtle">
              <Button variant="ghost" size="sm" onClick={() => setExportModalOpen(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={downloadJson}>
                <Download className="size-3.5 mr-1" />
                Baixar Arquivo JSON
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
