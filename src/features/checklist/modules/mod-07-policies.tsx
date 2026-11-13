"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FieldWrapper, FormSection } from "../components/field-wrapper";
import type { ChecklistData, FieldMetaRecord, ChildAgeRule, CancellationRule } from "../types";
import { cn } from "@/lib/utils";

const DOCS_LIST = ["RG", "CPF", "CNH", "Passaporte", "Certidão de nascimento (menores)"];
const PET_PORTES = ["Pequeno", "Médio", "Grande"];

const METODOS_ACESSO = [
  "Recepção física 24h",
  "Recepção com horário comercial",
  "Fechadura digital (senha / código)",
  "Cofre de chaves (lockbox)",
  "Smart lock / Aplicativo móvel",
  "Chave entregue em mãos por anfitrião",
  "Cartão magnético RFID",
];

const LIMPEZA_FREQUENCIAS = [
  "Diária inclusa",
  "A cada 2 dias",
  "A cada 3 dias",
  "Sob solicitação do hóspede",
  "Apenas após o check-out (na saída)",
];

const ENXOVAL_FREQUENCIAS = [
  "Diária",
  "A cada 2 dias",
  "A cada 3 dias",
  "Sob solicitação sem custo",
  "Sob solicitação com taxa adicional",
];

export function Mod07Policies({
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
  const docs = data.documentos ?? ["RG", "CPF"];
  const criancas = data.criancas ?? [];
  const cancelamento = data.cancelamento ?? [];
  const petPortes = data.petPorte ?? data.petPortes ?? [];
  const metodoAcesso = data.metodoAcesso ?? [];

  function toggleMetodoAcesso(metodo: string) {
    const next = metodoAcesso.includes(metodo)
      ? metodoAcesso.filter((m) => m !== metodo)
      : [...metodoAcesso, metodo];
    onChange({ metodoAcesso: next });
  }

  function toggleDoc(item: string) {
    const next = docs.includes(item) ? docs.filter((d) => d !== item) : [...docs, item];
    onChange({ documentos: next });
  }

  function togglePetPorte(item: string) {
    const next = petPortes.includes(item)
      ? petPortes.filter((p) => p !== item)
      : [...petPortes, item];
    onChange({ petPorte: next, petPortes: next });
  }

  // Crianças faixas
  function addChildRule() {
    const nova: ChildAgeRule = {
      id: crypto.randomUUID(),
      de: 0,
      ate: 5,
      regra: "Grátis",
      valor: "",
      limite: 1,
      obs: "",
    };
    onChange({ criancas: [...criancas, nova] });
  }

  function updateChildRule(index: number, patch: Partial<ChildAgeRule>) {
    const updated = criancas.map((c, i) => (i === index ? { ...c, ...patch } : c));
    onChange({ criancas: updated });
  }

  function removeChildRule(index: number) {
    onChange({ criancas: criancas.filter((_, i) => i !== index) });
  }

  // Cancelamento regras
  function addCancelRule() {
    const nova: CancellationRule = {
      id: crypto.randomUUID(),
      ant: 7,
      un: "dias",
      reemb: 100,
    };
    onChange({ cancelamento: [...cancelamento, nova] });
  }

  function updateCancelRule(index: number, patch: Partial<CancellationRule>) {
    const updated = cancelamento.map((c, i) => (i === index ? { ...c, ...patch } : c));
    onChange({ cancelamento: updated });
  }

  function removeCancelRule(index: number) {
    onChange({ cancelamento: cancelamento.filter((_, i) => i !== index) });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Check-in e check-out */}
      <FormSection title="Check-in e check-out">
        <FieldWrapper
          label="Horário de Check-in"
          fieldKey="checkinInicio"
          meta={meta.checkinInicio}
          onMetaChange={onMetaChange}
          isFilled={!!data.checkinInicio}
        >
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <div>
              <span className="text-[11px] text-ink-muted block mb-1">A partir de</span>
              <Input
                type="time"
                value={data.checkinInicio ?? ""}
                onChange={(e) => onChange({ checkinInicio: e.target.value })}
              />
            </div>
            <div>
              <span className="text-[11px] text-ink-muted block mb-1">Até</span>
              <Input
                type="time"
                value={data.checkinFim ?? ""}
                onChange={(e) => onChange({ checkinFim: e.target.value })}
              />
            </div>
          </div>
        </FieldWrapper>

        <FieldWrapper
          label="Horário de Check-out"
          fieldKey="checkoutFim"
          meta={meta.checkoutFim}
          onMetaChange={onMetaChange}
          isFilled={!!data.checkoutFim}
        >
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <div>
              <span className="text-[11px] text-ink-muted block mb-1">A partir de</span>
              <Input
                type="time"
                value={data.checkoutInicio ?? ""}
                onChange={(e) => onChange({ checkoutInicio: e.target.value })}
              />
            </div>
            <div>
              <span className="text-[11px] text-ink-muted block mb-1">Até</span>
              <Input
                type="time"
                value={data.checkoutFim ?? ""}
                onChange={(e) => onChange({ checkoutFim: e.target.value })}
              />
            </div>
          </div>
        </FieldWrapper>

        <FieldWrapper
          label="Early check-in"
          fieldKey="earlyCheckin"
          optional
          meta={meta.earlyCheckin ?? meta.early}
          onMetaChange={onMetaChange}
          isFilled={!!(data.earlyCheckin || data.early)}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Select
              value={data.earlyCheckin ?? data.early ?? ""}
              onChange={(e) => onChange({ earlyCheckin: e.target.value, early: e.target.value })}
            >
              <option value="">Selecione…</option>
              <option value="Não permite">Não permite</option>
              <option value="Sob consulta">Sob consulta</option>
              <option value="Permite com taxa">Permite com taxa</option>
              <option value="Permite sem custo">Permite sem custo</option>
            </Select>
            <Input
              value={data.earlyValor ?? ""}
              onChange={(e) => onChange({ earlyValor: e.target.value })}
              placeholder="Valor (R$)"
            />
            <Select
              value={data.earlyUnid ?? ""}
              onChange={(e) => onChange({ earlyUnid: e.target.value })}
            >
              <option value="">Tipo cobrança…</option>
              <option value="Por hora">Por hora</option>
              <option value="Por diária">Por diária</option>
              <option value="Valor fixo">Valor fixo</option>
            </Select>
          </div>
        </FieldWrapper>

        <FieldWrapper
          label="Late check-out"
          fieldKey="lateCheckout"
          optional
          meta={meta.lateCheckout ?? meta.late}
          onMetaChange={onMetaChange}
          isFilled={!!(data.lateCheckout || data.late)}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Select
              value={data.lateCheckout ?? data.late ?? ""}
              onChange={(e) => onChange({ lateCheckout: e.target.value, late: e.target.value })}
            >
              <option value="">Selecione…</option>
              <option value="Não permite">Não permite</option>
              <option value="Sob consulta">Sob consulta</option>
              <option value="Permite com taxa">Permite com taxa</option>
              <option value="Permite sem custo">Permite sem custo</option>
            </Select>
            <Input
              value={data.lateValor ?? ""}
              onChange={(e) => onChange({ lateValor: e.target.value })}
              placeholder="Valor (R$)"
            />
            <Select
              value={data.lateUnid ?? ""}
              onChange={(e) => onChange({ lateUnid: e.target.value })}
            >
              <option value="">Tipo cobrança…</option>
              <option value="Por hora">Por hora</option>
              <option value="Por diária">Por diária</option>
              <option value="Valor fixo">Valor fixo</option>
            </Select>
          </div>
        </FieldWrapper>
      </FormSection>

      {/* Acesso e Entrada do Hóspede */}
      <FormSection title="Acesso e Entrada do Hóspede">
        <FieldWrapper
          label="Método de acesso ao imóvel"
          fieldKey="metodoAcesso"
          hint="Selecione as formas de entrada disponibilizadas aos hóspedes"
          meta={meta.metodoAcesso}
          onMetaChange={onMetaChange}
          isFilled={metodoAcesso.length > 0}
        >
          <div className="flex flex-wrap gap-1.5">
            {METODOS_ACESSO.map((metodo) => {
              const active = metodoAcesso.includes(metodo);
              return (
                <button
                  key={metodo}
                  type="button"
                  onClick={() => toggleMetodoAcesso(metodo)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
                    active
                      ? "border-cyan-fact bg-cyan-fact/20 text-ink font-semibold"
                      : "border-line-subtle bg-input-bg text-ink-muted hover:text-ink hover:border-line-medium"
                  )}
                >
                  {metodo}
                </button>
              );
            })}
          </div>
        </FieldWrapper>

        <FieldWrapper
          label="Instruções de acesso e envio de dados"
          fieldKey="detalhesAcesso"
          optional
          hint="Como o hóspede recebe a senha, código do cofre ou link de acesso"
          meta={meta.detalhesAcesso}
          onMetaChange={onMetaChange}
          isFilled={!!data.detalhesAcesso}
        >
          <Input
            value={data.detalhesAcesso ?? ""}
            onChange={(e) => onChange({ detalhesAcesso: e.target.value })}
            placeholder="Ex.: Senha enviada via WhatsApp 24h antes do check-in; portaria com lista de hóspedes"
          />
        </FieldWrapper>
      </FormSection>

      {/* Limpeza & Governança (Housekeeping) */}
      <FormSection title="Limpeza & Governança (Housekeeping)">
        <FieldWrapper
          label="Frequência de limpeza durante a estadia"
          fieldKey="limpezaFrequencia"
          meta={meta.limpezaFrequencia}
          onMetaChange={onMetaChange}
          isFilled={!!data.limpezaFrequencia}
        >
          <div className="flex flex-wrap gap-1.5">
            {LIMPEZA_FREQUENCIAS.map((freq) => {
              const active = data.limpezaFrequencia === freq;
              return (
                <button
                  key={freq}
                  type="button"
                  onClick={() => onChange({ limpezaFrequencia: freq })}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
                    active
                      ? "border-cyan-fact bg-cyan-fact/20 text-ink font-semibold"
                      : "border-line-subtle bg-input-bg text-ink-muted hover:text-ink hover:border-line-medium"
                  )}
                >
                  {freq}
                </button>
              );
            })}
          </div>
        </FieldWrapper>

        <FieldWrapper
          label="Troca de roupas de cama e toalhas (enxoval)"
          fieldKey="trocaEnxoval"
          meta={meta.trocaEnxoval}
          onMetaChange={onMetaChange}
          isFilled={!!data.trocaEnxoval}
        >
          <div className="flex flex-wrap gap-1.5">
            {ENXOVAL_FREQUENCIAS.map((enx) => {
              const active = data.trocaEnxoval === enx;
              return (
                <button
                  key={enx}
                  type="button"
                  onClick={() => onChange({ trocaEnxoval: enx })}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
                    active
                      ? "border-cyan-fact bg-cyan-fact/20 text-ink font-semibold"
                      : "border-line-subtle bg-input-bg text-ink-muted hover:text-ink hover:border-line-medium"
                  )}
                >
                  {enx}
                </button>
              );
            })}
          </div>
        </FieldWrapper>

        <FieldWrapper
          label="Taxa de limpeza por estadia (se aplicável)"
          fieldKey="taxaLimpezaEstadia"
          optional
          hint="Comum em aluguel de temporada, chalés e flats (deixe vazio se a limpeza estiver 100% inclusa na diária)"
          meta={meta.taxaLimpezaEstadia}
          onMetaChange={onMetaChange}
          isFilled={!!data.taxaLimpezaEstadia}
        >
          <Input
            value={data.taxaLimpezaEstadia ?? ""}
            onChange={(e) => onChange({ taxaLimpezaEstadia: e.target.value })}
            placeholder="Ex.: R$ 150,00 por estadia"
            className="max-w-xs"
          />
        </FieldWrapper>
      </FormSection>

      {/* Hóspedes & Documentos */}
      <FormSection title="Hóspedes & Documentação">
        <FieldWrapper
          label="Idade mínima para check-in"
          fieldKey="idadeMinima"
          optional
          meta={meta.idadeMinima}
          onMetaChange={onMetaChange}
          isFilled={data.idadeMinima !== undefined}
        >
          <Input
            type="number"
            min={0}
            value={data.idadeMinima ?? 18}
            onChange={(e) => onChange({ idadeMinima: Number(e.target.value) })}
            className="max-w-[120px]"
          />
        </FieldWrapper>

        <FieldWrapper
          label="Documentos exigidos no check-in"
          fieldKey="documentos"
          hint="FNRH é preenchida no momento do check-in"
          meta={meta.documentos}
          onMetaChange={onMetaChange}
          isFilled={docs.length > 0}
        >
          <div className="flex flex-wrap gap-1.5">
            {DOCS_LIST.map((doc) => {
              const active = docs.includes(doc);
              return (
                <button
                  key={doc}
                  type="button"
                  onClick={() => toggleDoc(doc)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer border",
                    active
                      ? "border-cyan-fact bg-cyan-fact/20 text-ink font-semibold"
                      : "border-line-subtle bg-input-bg text-ink-muted hover:text-ink hover:border-line-medium"
                  )}
                >
                  {doc}
                </button>
              );
            })}
          </div>
        </FieldWrapper>

        <FieldWrapper
          label="Menores desacompanhados"
          fieldKey="menores"
          meta={meta.menores}
          onMetaChange={onMetaChange}
          isFilled={!!data.menores}
        >
          <div className="flex flex-wrap gap-2">
            {[
              "Não aceita",
              "Aceita com autorização legal dos responsáveis",
            ].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onChange({ menores: opt })}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                  data.menores === opt
                    ? "border-cyan-fact bg-cyan-fact/20 text-ink font-semibold"
                    : "border-line-subtle bg-surface text-ink-secondary hover:text-ink"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </FieldWrapper>
      </FormSection>

      {/* Crianças & Berço */}
      <FormSection title="Crianças & Berço">
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-muted">
              Faixas etárias e regras de cobrança para crianças.
            </p>
            <Button variant="ghost" size="sm" onClick={addChildRule} className="h-7 text-xs cursor-pointer">
              <Plus className="mr-1 size-3.5" /> Adicionar faixa
            </Button>
          </div>

          {criancas.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line-subtle p-3 text-center text-xs text-ink-secondary">
              Nenhuma faixa configurada. Adicione a política de crianças.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {criancas.map((cr, idx) => (
                <div key={cr.id} className="grid grid-cols-1 sm:grid-cols-[70px_70px_130px_100px_80px_1fr_auto] items-center gap-2 rounded-lg border border-line-subtle bg-surface-muted/40 p-2.5">
                  <Input
                    type="number"
                    min={0}
                    value={cr.de}
                    onChange={(e) => updateChildRule(idx, { de: Number(e.target.value) })}
                    placeholder="De"
                  />
                  <Input
                    type="number"
                    min={0}
                    value={cr.ate}
                    onChange={(e) => updateChildRule(idx, { ate: Number(e.target.value) })}
                    placeholder="Até"
                  />
                  <Select
                    value={cr.regra}
                    onChange={(e) => updateChildRule(idx, { regra: e.target.value })}
                  >
                    <option value="Grátis">Grátis</option>
                    <option value="Valor fixo por noite">Valor fixo</option>
                    <option value="% da diária">% diária</option>
                  </Select>
                  <Input
                    value={cr.valor ?? ""}
                    onChange={(e) => updateChildRule(idx, { valor: e.target.value })}
                    placeholder="Valor / %"
                  />
                  <Input
                    type="number"
                    min={1}
                    value={cr.limite ?? 1}
                    onChange={(e) => updateChildRule(idx, { limite: Number(e.target.value) })}
                    placeholder="Máx."
                  />
                  <Input
                    value={cr.obs ?? ""}
                    onChange={(e) => updateChildRule(idx, { obs: e.target.value })}
                    placeholder="Observações"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeChildRule(idx)}
                    className="size-7 text-ink-muted hover:text-feedback-danger cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-line-subtle">
          <FieldWrapper
            label="Disponibilidade de Berço"
            fieldKey="berco"
            optional
            meta={meta.berco}
            onMetaChange={onMetaChange}
            isFilled={!!data.berco}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md">
              <Select
                value={data.berco ?? "Não disponível"}
                onChange={(e) => onChange({ berco: e.target.value })}
              >
                <option value="Não disponível">Não disponível</option>
                <option value="Disponível grátis">Disponível grátis</option>
                <option value="Disponível com taxa">Disponível com taxa</option>
              </Select>
              {data.berco === "Disponível com taxa" && (
                <Input
                  value={data.bercoValor ?? ""}
                  onChange={(e) => onChange({ bercoValor: e.target.value })}
                  placeholder="Valor do berço (ex.: R$ 40/dia)"
                />
              )}
            </div>
          </FieldWrapper>
        </div>
      </FormSection>

      {/* Cancelamento & No-Show */}
      <FormSection title="Cancelamento e Pré-Pagamento">
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-muted">
              Regras escalonadas de cancelamento e reembolso.
            </p>
            <Button variant="ghost" size="sm" onClick={addCancelRule} className="h-7 text-xs cursor-pointer">
              <Plus className="mr-1 size-3.5" /> Adicionar regra
            </Button>
          </div>

          {cancelamento.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line-subtle p-3 text-center text-xs text-ink-secondary">
              Nenhuma regra adicionada. Cadastre a política de reembolso antecipado.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {cancelamento.map((rule, idx) => (
                <div key={rule.id} className="grid grid-cols-[100px_100px_120px_auto] items-center gap-2 rounded-lg border border-line-subtle bg-surface-muted/40 p-2.5 max-w-md">
                  <Input
                    type="number"
                    min={0}
                    value={rule.ant}
                    onChange={(e) => updateCancelRule(idx, { ant: Number(e.target.value) })}
                    placeholder="Tempo"
                  />
                  <Select
                    value={rule.un}
                    onChange={(e) => updateCancelRule(idx, { un: e.target.value as "dias" | "horas" })}
                  >
                    <option value="dias">dias</option>
                    <option value="horas">horas</option>
                  </Select>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={rule.reemb}
                    onChange={(e) => updateCancelRule(idx, { reemb: Number(e.target.value) })}
                    placeholder="% reembolso"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCancelRule(idx)}
                    className="size-7 text-ink-muted hover:text-feedback-danger cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-line-subtle flex flex-col">
          <FieldWrapper
            label="Após o prazo limite de cancelamento"
            fieldKey="cancelDepois"
            optional
            meta={meta.cancelDepois}
            onMetaChange={onMetaChange}
            isFilled={!!data.cancelDepois}
          >
            <Input
              value={data.cancelDepois ?? ""}
              onChange={(e) => onChange({ cancelDepois: e.target.value })}
              placeholder="Ex.: Cobra 100% da primeira diária ou da estadia completa"
            />
          </FieldWrapper>

          <FieldWrapper
            label="Política de No-Show (não comparecimento)"
            fieldKey="noShow"
            optional
            meta={meta.noShow ?? meta.noShowRegra}
            onMetaChange={onMetaChange}
            isFilled={!!(data.noShow || data.noShowRegra)}
          >
            <Input
              value={data.noShow ?? data.noShowRegra ?? ""}
              onChange={(e) => onChange({ noShow: e.target.value, noShowRegra: e.target.value })}
              placeholder="Ex.: Cobra o valor integral da reserva"
            />
          </FieldWrapper>

          <FieldWrapper
            label="Caução / Depósito de segurança"
            fieldKey="caucao"
            optional
            meta={meta.caucao}
            onMetaChange={onMetaChange}
            isFilled={!!data.caucao}
          >
            <Input
              value={typeof data.caucao === "string" ? data.caucao : data.caucaoValor ?? ""}
              onChange={(e) => onChange({ caucao: e.target.value, caucaoValor: e.target.value })}
              placeholder="Ex.: R$ 500 retido no check-in e devolvido na saída"
            />
          </FieldWrapper>
        </div>
      </FormSection>

      {/* Animais de Estimação */}
      <FormSection title="Animais de Estimação (Pets)">
        <FieldWrapper
          label="Aceita pets?"
          fieldKey="pets"
          meta={meta.pets}
          onMetaChange={onMetaChange}
          isFilled={!!data.pets}
        >
          <div className="flex flex-wrap gap-2">
            {[
              "Não aceita",
              "Aceita",
              "Aceita sob consulta",
            ].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onChange({ pets: opt })}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                  data.pets === opt
                    ? "border-cyan-fact bg-cyan-fact/20 text-ink font-semibold"
                    : "border-line-subtle bg-surface text-ink-secondary hover:text-ink"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </FieldWrapper>

        {data.pets && data.pets !== "Não aceita" && (
          <>
            <FieldWrapper
              label="Portes aceitos"
              fieldKey="petPorte"
              meta={meta.petPorte}
              onMetaChange={onMetaChange}
              isFilled={petPortes.length > 0}
            >
              <div className="flex flex-wrap gap-1.5">
                {PET_PORTES.map((porte) => {
                  const active = petPortes.includes(porte);
                  return (
                    <button
                      key={porte}
                      type="button"
                      onClick={() => togglePetPorte(porte)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer border",
                        active
                          ? "border-cyan-fact bg-cyan-fact/20 text-ink font-semibold"
                          : "border-line-subtle bg-input-bg text-ink-muted hover:text-ink hover:border-line-medium"
                      )}
                    >
                      {porte}
                    </button>
                  );
                })}
              </div>
            </FieldWrapper>

            <FieldWrapper
              label="Taxa e quantidade máxima"
              fieldKey="petTaxa"
              meta={meta.petTaxa}
              onMetaChange={onMetaChange}
              isFilled={!!data.petTaxa}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md">
                <Input
                  value={data.petTaxa ?? ""}
                  onChange={(e) => onChange({ petTaxa: e.target.value })}
                  placeholder="Taxa (ex.: R$ 50/diária ou gratuito)"
                />
                <Input
                  type="number"
                  min={1}
                  value={data.petQtd ?? 1}
                  onChange={(e) => onChange({ petQtd: Number(e.target.value) })}
                  placeholder="Máx. por reserva"
                />
              </div>
            </FieldWrapper>

            <FieldWrapper
              label="Regras para pets"
              fieldKey="petRegras"
              optional
              meta={meta.petRegras}
              onMetaChange={onMetaChange}
              isFilled={!!data.petRegras}
            >
              <textarea
                value={data.petRegras ?? ""}
                onChange={(e) => onChange({ petRegras: e.target.value })}
                placeholder="Ex.: Não deixar sozinho no quarto, coleira nas áreas comuns..."
                rows={2}
                className="f resize-y w-full"
              />
            </FieldWrapper>
          </>
        )}
      </FormSection>

      {/* Convivência & Silêncio */}
      <FormSection title="Regras de Convivência & Horários">
        <FieldWrapper
          label="Fumantes"
          fieldKey="fumantes"
          meta={meta.fumantes}
          onMetaChange={onMetaChange}
          isFilled={!!data.fumantes}
        >
          <Select
            value={data.fumantes ?? "Proibido"}
            onChange={(e) => onChange({ fumantes: e.target.value })}
          >
            <option value="Proibido">Proibido</option>
            <option value="Só em áreas específicas">Só em áreas específicas</option>
            <option value="Permitido">Permitido</option>
          </Select>
        </FieldWrapper>

        {data.fumantes && data.fumantes !== "Proibido" && (
          <FieldWrapper
            label="Onde é permitido fumar"
            fieldKey="fumantesDet"
            optional
            meta={meta.fumantesDet}
            onMetaChange={onMetaChange}
            isFilled={!!data.fumantesDet}
          >
            <Input
              value={data.fumantesDet ?? ""}
              onChange={(e) => onChange({ fumantesDet: e.target.value })}
              placeholder="Ex.: Somente na área da piscina e no jardim"
            />
          </FieldWrapper>
        )}

        <FieldWrapper
          label="Festas e eventos"
          fieldKey="festas"
          meta={meta.festas}
          onMetaChange={onMetaChange}
          isFilled={!!data.festas}
        >
          <Select
            value={data.festas ?? "Não permitido"}
            onChange={(e) => onChange({ festas: e.target.value })}
          >
            <option value="Não permitido">Não permitido</option>
            <option value="Sob consulta">Sob consulta</option>
            <option value="Permitido">Permitido</option>
          </Select>
        </FieldWrapper>

        <FieldWrapper
          label="Horário de Silêncio"
          fieldKey="silencioInicio"
          meta={meta.silencioInicio}
          onMetaChange={onMetaChange}
          isFilled={!!data.silencioInicio}
        >
          <div className="grid grid-cols-[auto_1fr_auto_1fr] items-center gap-2 max-w-sm">
            <span className="text-xs text-ink-muted">Das</span>
            <Input
              type="time"
              value={data.silencioInicio ?? "22:00"}
              onChange={(e) => onChange({ silencioInicio: e.target.value })}
            />
            <span className="text-xs text-ink-muted">às</span>
            <Input
              type="time"
              value={data.silencioFim ?? "08:00"}
              onChange={(e) => onChange({ silencioFim: e.target.value })}
            />
          </div>
        </FieldWrapper>

        <FieldWrapper
          label="Visitantes"
          fieldKey="visitantes"
          meta={meta.visitantes}
          onMetaChange={onMetaChange}
          isFilled={!!data.visitantes}
        >
          <Select
            value={data.visitantes ?? "Não permitido"}
            onChange={(e) => onChange({ visitantes: e.target.value })}
          >
            <option value="Não permitido">Não permitido</option>
            <option value="Sob consulta">Sob consulta</option>
            <option value="Permitido">Permitido</option>
            <option value="Permitido com restrições">Permitido com restrições</option>
          </Select>
        </FieldWrapper>

        {data.visitantes && data.visitantes !== "Não permitido" && (
          <FieldWrapper
            label="Regras para visitantes"
            fieldKey="visitantesDet"
            optional
            meta={meta.visitantesDet}
            onMetaChange={onMetaChange}
            isFilled={!!data.visitantesDet}
          >
            <Input
              value={data.visitantesDet ?? ""}
              onChange={(e) => onChange({ visitantesDet: e.target.value })}
              placeholder="Ex.: Apenas nas áreas sociais; proibido nas acomodações"
            />
          </FieldWrapper>
        )}
      </FormSection>

      {/* Taxas na Diária */}
      <FormSection title="Impostos & Taxas na Diária">
        <FieldWrapper
          label="Taxas e tributos adicionais"
          fieldKey="taxaTurismo"
          optional
          meta={meta.taxaTurismo}
          onMetaChange={onMetaChange}
          isFilled={!!(data.iss || data.taxaServico || data.taxaTurismo)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input
              value={data.iss ?? ""}
              onChange={(e) => onChange({ iss: e.target.value })}
              placeholder="ISS (%)"
            />
            <Input
              value={data.taxaServico ?? ""}
              onChange={(e) => onChange({ taxaServico: e.target.value })}
              placeholder="Taxa serviço (%)"
            />
            <Input
              value={data.taxaTurismo ?? ""}
              onChange={(e) => onChange({ taxaTurismo: e.target.value })}
              placeholder="Taxa turismo (R$)"
            />
          </div>
        </FieldWrapper>

        <FieldWrapper
          label="Outras regras ou regulamentos"
          fieldKey="outrasPoliticas"
          optional
          hint="Piscina, uso de churrasqueira, etc."
          meta={meta.outrasPoliticas}
          onMetaChange={onMetaChange}
          isFilled={!!data.outrasPoliticas}
        >
          <textarea
            value={data.outrasPoliticas ?? data.regulamento ?? ""}
            onChange={(e) => onChange({ outrasPoliticas: e.target.value, regulamento: e.target.value })}
            placeholder="Regras adicionais para o hóspede..."
            rows={2}
            className="f resize-y w-full"
          />
        </FieldWrapper>
      </FormSection>
    </div>
  );
}
