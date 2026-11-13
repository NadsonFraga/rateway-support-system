"use client";

import * as React from "react";
import { Plus, Trash2, CreditCard, Banknote, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FieldWrapper, FormSection } from "../components/field-wrapper";
import type { ChecklistData, FieldMetaRecord, PaymentPlanItem } from "../types";
import { cn } from "@/lib/utils";

const BANDEIRAS_LIST = ["Visa", "Mastercard", "Elo", "American Express", "Hipercard", "Diners"];
const OUTRAS_FORMAS = ["Débito", "Dinheiro", "Link de pagamento"];

export function Mod08PaymentsBank({
  data,
  meta,
  onChange,
  onMetaChange,
}: {
  data: ChecklistData;
  meta: FieldMetaRecord;
  onChange: (patch: Partial<ChecklistData>) => void;
  onMetaChange: (fieldKey: string, val: any) => void;
}) {
  const bandeiras = data.bandeiras ?? [];
  const outrasFormas = data.outrasFormas ?? [];
  const planos = data.planos ?? [];

  function toggleBandeira(b: string) {
    const next = bandeiras.includes(b) ? bandeiras.filter((x) => x !== b) : [...bandeiras, b];
    onChange({ bandeiras: next });
  }

  function toggleOutraForma(f: string) {
    const next = outrasFormas.includes(f) ? outrasFormas.filter((x) => x !== f) : [...outrasFormas, f];
    onChange({ outrasFormas: next });
  }

  function addPlan() {
    const novo: PaymentPlanItem = {
      id: crypto.randomUUID(),
      nome: "",
      formas: ["PIX", "Cartão de crédito"],
      entrada: 50,
      prazoEntrada: "2 dias",
      restante: "No check-in",
      desconto: 0,
      parcelas: 3,
      parcelaMin: "",
      acrescimo: 0,
      naoPago: "Reserva cancelada",
      obs: "",
    };
    onChange({ planos: [...planos, novo] });
  }

  function updatePlan(index: number, patch: Partial<PaymentPlanItem>) {
    const updated = planos.map((p, i) => (i === index ? { ...p, ...patch } : p));
    onChange({ planos: updated });
  }

  function removePlan(index: number) {
    onChange({ planos: planos.filter((_, i) => i !== index) });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Formas aceitas */}
      <FormSection title="Formas de Pagamento Aceitas (Balcão & Diretas)">
        <FieldWrapper
          label="Meios de pagamento aceitos"
          fieldKey="formasBalcao"
          meta={meta.formasBalcao}
          onMetaChange={onMetaChange}
          isFilled={data.pix || data.transf || data.cartao || outrasFormas.length > 0}
        >
          <div className="flex flex-wrap gap-2">
            {[
              { key: "pix", label: "PIX", val: data.pix },
              { key: "transf", label: "Transferência / Depósito", val: data.transf },
              { key: "cartao", label: "Cartão de Crédito", val: data.cartao },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => onChange({ [f.key]: !f.val })}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                  f.val
                    ? "border-cyan-fact bg-cyan-fact/20 text-ink font-semibold"
                    : "border-line-subtle bg-surface text-ink-secondary hover:text-ink"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </FieldWrapper>

        {data.cartao && (
          <FieldWrapper
            label="Bandeiras de cartão aceitas"
            fieldKey="cartaoBandeiras"
            meta={meta.cartaoBandeiras ?? meta.bandeiras}
            onMetaChange={onMetaChange}
            isFilled={bandeiras.length > 0}
          >
            <div className="flex flex-wrap gap-1.5">
              {BANDEIRAS_LIST.map((b) => {
                const active = bandeiras.includes(b);
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => toggleBandeira(b)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer border",
                      active
                        ? "border-cyan-fact bg-cyan-fact/20 text-ink font-semibold"
                        : "border-line-subtle bg-input-bg text-ink-muted hover:text-ink hover:border-line-medium"
                    )}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
          </FieldWrapper>
        )}

        <FieldWrapper
          label="Outras formas no balcão"
          fieldKey="outrasFormas"
          meta={meta.outrasFormas}
          onMetaChange={onMetaChange}
          isFilled={outrasFormas.length > 0}
        >
          <div className="flex flex-wrap gap-1.5">
            {OUTRAS_FORMAS.map((f) => {
              const active = outrasFormas.includes(f);
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleOutraForma(f)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer border",
                    active
                      ? "border-cyan-fact bg-cyan-fact/20 text-ink font-semibold"
                      : "border-line-subtle bg-input-bg text-ink-muted hover:text-ink hover:border-line-medium"
                  )}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </FieldWrapper>
      </FormSection>

      {/* Planos de pagamento (reservas diretas) */}
      <FormSection title="Planos de Pagamento (Reservas Diretas)">
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-muted">
              Condições comerciais que a central de reservas ou site podem oferecer ao hóspede.
            </p>
            <Button variant="ghost" size="sm" onClick={addPlan} className="h-7 text-xs cursor-pointer">
              <Plus className="mr-1 size-3.5" /> Adicionar plano
            </Button>
          </div>

          {planos.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line-subtle p-3 text-center text-xs text-ink-secondary">
              Nenhum plano cadastrado. Adicione as condições para reservas diretas.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {planos.map((pl, idx) => (
                <div key={pl.id} className="flex flex-col gap-2.5 rounded-lg border border-line-subtle bg-surface-muted/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Input
                      value={pl.nome}
                      onChange={(e) => updatePlan(idx, { nome: e.target.value })}
                      placeholder="Nome do plano (ex.: 50% na reserva + 50% no check-in)"
                      className="font-medium"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePlan(idx)}
                      className="size-7 text-ink-muted hover:text-feedback-danger shrink-0 cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <span className="text-[11px] text-ink-muted block mb-1">Entrada (%)</span>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={pl.entrada ?? 50}
                        onChange={(e) => updatePlan(idx, { entrada: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-ink-muted block mb-1">Prazo entrada</span>
                      <Input
                        value={pl.prazoEntrada ?? ""}
                        onChange={(e) => updatePlan(idx, { prazoEntrada: e.target.value })}
                        placeholder="Ex.: 24h ou 2 dias"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-ink-muted block mb-1">Restante</span>
                      <Select
                        value={pl.restante ?? "No check-in"}
                        onChange={(e) => updatePlan(idx, { restante: e.target.value })}
                      >
                        <option value="No check-in">No check-in</option>
                        <option value="Antes do check-in">Antes do check-in</option>
                        <option value="Não há (100% na reserva)">100% na reserva</option>
                      </Select>
                    </div>
                    <div>
                      <span className="text-[11px] text-ink-muted block mb-1">Desconto (%)</span>
                      <Input
                        type="number"
                        min={0}
                        value={pl.desconto ?? 0}
                        onChange={(e) => updatePlan(idx, { desconto: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <span className="text-[11px] text-ink-muted block mb-1">Parcelamento (até)</span>
                      <Input
                        type="number"
                        min={1}
                        value={pl.parcelas ?? 1}
                        onChange={(e) => updatePlan(idx, { parcelas: Number(e.target.value) })}
                        placeholder="Até X vezes"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-ink-muted block mb-1">Parcela mínima</span>
                      <Input
                        value={pl.parcelaMin ?? ""}
                        onChange={(e) => updatePlan(idx, { parcelaMin: e.target.value })}
                        placeholder="Ex.: R$ 200,00"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-ink-muted block mb-1">Se não pagar no prazo</span>
                      <Input
                        value={pl.naoPago ?? ""}
                        onChange={(e) => updatePlan(idx, { naoPago: e.target.value })}
                        placeholder="Ex.: Reserva cancelada"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </FormSection>

      {/* Dados bancários de repasse */}
      <FormSection title="Dados Bancários para Repasses das OTAs">
        <FieldWrapper
          label="Titular da Conta Bancária"
          fieldKey="titularConta"
          meta={meta.titularConta ?? meta.titular}
          onMetaChange={onMetaChange}
          isFilled={!!(data.titularConta || data.titular)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              value={data.titularConta ?? data.titular ?? ""}
              onChange={(e) => onChange({ titularConta: e.target.value, titular: e.target.value })}
              placeholder="Nome ou Razão Social do titular"
            />
            <Input
              value={data.docConta ?? data.docTitular ?? ""}
              onChange={(e) => onChange({ docConta: e.target.value, docTitular: e.target.value })}
              placeholder="CPF ou CNPJ do titular"
            />
          </div>
        </FieldWrapper>

        <FieldWrapper
          label="Banco, Agência e Conta"
          fieldKey="bancoNome"
          meta={meta.bancoNome ?? meta.banco}
          onMetaChange={onMetaChange}
          isFilled={!!(data.bancoNome || data.banco)}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Input
              value={data.bancoCod ?? ""}
              onChange={(e) => onChange({ bancoCod: e.target.value })}
              placeholder="Cód (ex: 260)"
            />
            <Input
              value={data.bancoNome ?? data.banco ?? ""}
              onChange={(e) => onChange({ bancoNome: e.target.value, banco: e.target.value })}
              placeholder="Nome do Banco"
            />
            <Input
              value={data.agencia ?? ""}
              onChange={(e) => onChange({ agencia: e.target.value })}
              placeholder="Agência"
            />
            <Input
              value={data.conta ?? ""}
              onChange={(e) => onChange({ conta: e.target.value })}
              placeholder="Conta com dígito"
            />
          </div>
        </FieldWrapper>

        <FieldWrapper
          label="Tipo de conta e Chave PIX"
          fieldKey="chavePix"
          meta={meta.chavePix}
          onMetaChange={onMetaChange}
          isFilled={!!data.chavePix}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Select
              value={data.tipoConta ?? "Corrente"}
              onChange={(e) => onChange({ tipoConta: e.target.value })}
            >
              <option value="Corrente">Corrente</option>
              <option value="Poupança">Poupança</option>
              <option value="Pagamento">Pagamento</option>
            </Select>
            <Input
              value={data.chavePix ?? ""}
              onChange={(e) => onChange({ chavePix: e.target.value })}
              placeholder="Chave PIX (CNPJ, e-mail, telefone...)"
            />
          </div>
        </FieldWrapper>
      </FormSection>

      {/* Alinhamento comercial */}
      <FormSection title="Alinhamento Comercial & Comissões">
        <div className="p-4 flex flex-col gap-3">
          <p className="text-xs text-ink-muted">
            Confirme os acordos sobre retenção de comissões e markup aplicado no Channel Manager.
          </p>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-xs text-ink cursor-pointer select-none">
              <input
                type="checkbox"
                checked={data.alinhamentoComissoes ?? false}
                onChange={(e) => onChange({ alinhamentoComissoes: e.target.checked })}
                className="rounded accent-cyan-fact"
              />
              <span>Orientado sobre os percentuais de comissão dos canais (Booking ~15%, Airbnb ~16%, etc.)</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-ink cursor-pointer select-none">
              <input
                type="checkbox"
                checked={data.alinhamentoMarkup ?? false}
                onChange={(e) => onChange({ alinhamentoMarkup: e.target.checked })}
                className="rounded accent-cyan-fact"
              />
              <span>Compreendeu e aprovou a aplicação do markup na FOCO para compensação tarifária</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-ink cursor-pointer select-none">
              <input
                type="checkbox"
                checked={data.alinhamentoAceite ?? false}
                onChange={(e) => onChange({ alinhamentoAceite: e.target.checked })}
                className="rounded accent-cyan-fact"
              />
              <span>Estratégia tarifária validada formalmente com o proprietário</span>
            </label>
          </div>

          <div className="pt-2">
            <span className="text-xs font-medium text-ink">Observações Comerciais</span>
            <textarea
              value={data.obsComerciais ?? data.pagObs ?? ""}
              onChange={(e) => onChange({ obsComerciais: e.target.value, pagObs: e.target.value })}
              placeholder="Notas sobre prazos, condições especiais ou acordos negociados..."
              rows={2}
              className="f resize-y w-full mt-1"
            />
          </div>
        </div>
      </FormSection>
    </div>
  );
}
