"use client";

import * as React from "react";
import { Download, ShieldAlert, CheckCircle2, Loader2, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SectionHeader } from "../settings-frame";
import { exportFullSystemBackup, type BackupExportOptions } from "../actions/backup";

export function BackupSection() {
  const [options, setOptions] = React.useState<BackupExportOptions>({
    includeClients: true,
    includeChecklists: true,
    includeDemands: true,
    includeVault: true,
    includeCatalog: true,
  });

  const [loading, setLoading] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  async function handleExport() {
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await exportFullSystemBackup(options);
      if (!res.ok || !res.json) {
        setErrorMsg(res.error || "Não foi possível gerar o arquivo de backup.");
        return;
      }

      const blob = new Blob([res.json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const today = new Date().toISOString().slice(0, 10);
      a.download = `backup-sistema-rateway-${today}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccessMsg("Backup completo exportado com sucesso.");
    } catch (err) {
      console.error("Backup export error:", err);
      setErrorMsg("Ocorreu um erro ao baixar o arquivo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-label="Backup e Exportação de Dados" className="space-y-6">
      <SectionHeader
        title="Backup e Exportação de Dados"
        description="Exporte todos os dados operacionais, clientes, checklists, demandas e senhas em um arquivo JSON completo."
      />

      {/* Main Export Card */}
      <div className="rounded-xl border border-line-subtle bg-surface p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted border border-line-subtle text-ink">
            <Database className="size-5 text-cyan-fact" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-ink">Exportar Backup Geral (.json)</h3>
            <p className="mt-1 text-xs text-ink-secondary">
              Gera um arquivo legível e estruturado contendo a base de dados completa do sistema. Ideal para backups de segurança, conferência ou migração.
            </p>

            {/* Modular Options */}
            <div className="mt-5 space-y-3 rounded-lg border border-line-subtle bg-background p-4">
              <span className="text-xs font-semibold text-ink uppercase tracking-wider block mb-2">
                Conteúdo a incluir no arquivo:
              </span>

              <div className="flex items-center justify-between gap-4 py-1">
                <div>
                  <p className="text-xs font-medium text-ink">Clientes & Estabelecimentos</p>
                  <p className="text-[11px] text-ink-muted">Contatos, dados fiscais, contratos e status operacionais.</p>
                </div>
                <Switch
                  label="Incluir clientes"
                  checked={options.includeClients ?? true}
                  onChange={(val) => setOptions((prev) => ({ ...prev, includeClients: val }))}
                />
              </div>

              <div className="flex items-center justify-between gap-4 py-1 border-t border-line-subtle">
                <div>
                  <p className="text-xs font-medium text-ink">Checklists & Fichas Técnicas</p>
                  <p className="text-[11px] text-ink-muted">Todos os 11 módulos com todas as respostas, pendências e dados técnicos.</p>
                </div>
                <Switch
                  label="Incluir checklists"
                  checked={options.includeChecklists ?? true}
                  onChange={(val) => setOptions((prev) => ({ ...prev, includeChecklists: val }))}
                />
              </div>

              <div className="flex items-center justify-between gap-4 py-1 border-t border-line-subtle">
                <div>
                  <p className="text-xs font-medium text-ink">Demandas & Histórico</p>
                  <p className="text-[11px] text-ink-muted">Demandas abertas, concluídas, prioridades, responsáveis e prazos.</p>
                </div>
                <Switch
                  label="Incluir demandas"
                  checked={options.includeDemands ?? true}
                  onChange={(val) => setOptions((prev) => ({ ...prev, includeDemands: val }))}
                />
              </div>

              <div className="flex items-center justify-between gap-4 py-1 border-t border-line-subtle">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-medium text-ink">Cofre de Credenciais (Acessos)</p>
                    <span className="rounded bg-pink-fact/10 px-1.5 py-0.2 text-[10px] font-semibold text-pink-fact">
                      Sensível
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-muted">
                    Links de extranet, IDs e senhas descriptografadas para recuperação de desastres.
                  </p>
                </div>
                <Switch
                  label="Incluir cofre"
                  checked={options.includeVault ?? true}
                  onChange={(val) => setOptions((prev) => ({ ...prev, includeVault: val }))}
                />
              </div>

              <div className="flex items-center justify-between gap-4 py-1 border-t border-line-subtle">
                <div>
                  <p className="text-xs font-medium text-ink">Catálogo & Configurações</p>
                  <p className="text-[11px] text-ink-muted">Lista de canais de venda, PMS, Channel Managers e serviços.</p>
                </div>
                <Switch
                  label="Incluir catálogo"
                  checked={options.includeCatalog ?? true}
                  onChange={(val) => setOptions((prev) => ({ ...prev, includeCatalog: val }))}
                />
              </div>
            </div>

            {/* Notice about sensitive data */}
            {options.includeVault && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-surface-muted border border-line-subtle px-3 py-2 text-xs text-ink-secondary">
                <ShieldAlert className="size-4 shrink-0 text-amber-fact" />
                <span>
                  O backup conterá credenciais legíveis. Guarde o arquivo baixado em local seguro e protegido.
                </span>
              </div>
            )}

            {/* Action Button & Status */}
            <div className="mt-5 flex items-center gap-4">
              <Button
                onClick={handleExport}
                disabled={loading}
                className="gap-2 bg-cyan-fact text-slate-950 font-semibold hover:opacity-90 px-4 h-9"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                <span>{loading ? "Gerando backup…" : "Exportar backup completo (.json)"}</span>
              </Button>

              {successMsg && (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
                  <CheckCircle2 className="size-3.5" />
                  {successMsg}
                </span>
              )}

              {errorMsg && (
                <span className="text-xs text-feedback-danger font-medium">
                  {errorMsg}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
