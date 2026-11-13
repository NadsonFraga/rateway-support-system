"use client";

import * as React from "react";
import { Plus, Trash2, Utensils, Car, Wifi, Sparkles, ConciergeBell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FieldWrapper, FormSection } from "../components/field-wrapper";
import { cn } from "@/lib/utils";
import type { ChecklistData, FieldMetaRecord, ExtraServiceItem } from "../types";

type FacilityDef = {
  key: string;
  label: string;
  hint: string;
};

const ALL_FACILITIES: FacilityDef[] = [
  { key: "piscina", label: "Piscina", hint: "Externa/coberta, aquecida, horário de uso" },
  { key: "restaurante", label: "Restaurante", hint: "Horário, aberto ao público, refeições servidas" },
  { key: "bar", label: "Bar", hint: "Horário de funcionamento" },
  { key: "gourmet", label: "Área gourmet / churrasqueira", hint: "Uso livre ou com taxa, precisa reservar" },
  { key: "academia", label: "Academia", hint: "Horário de funcionamento" },
  { key: "sauna", label: "Sauna", hint: "Seca/a vapor, horário, taxa" },
  { key: "spa", label: "Spa / massagens", hint: "Pago à parte, agendamento" },
  { key: "playground", label: "Playground", hint: "Idades, estrutura, horário" },
  { key: "jogos", label: "Salão de jogos / bilhar", hint: "Mesa de bilhar, pebolim…" },
  { key: "pesca", label: "Plataforma / área de pesca", hint: "Local, regras, equipamento" },
  { key: "camping", label: "Área de camping", hint: "Regras, valor, estrutura" },
  { key: "jardim", label: "Jardim / área verde", hint: "Área de descanso, bancos, iluminação" },
  { key: "espreguicadeiras", label: "Espreguiçadeiras", hint: "Piscina ou praia" },
  { key: "ducha", label: "Ducha externa", hint: "Área externa" },
  { key: "lavanderia", label: "Lavanderia", hint: "Self-service ou serviço pago, horário" },
  { key: "elevador", label: "Elevador", hint: "Acesso aos andares" },
  { key: "acessibilidade", label: "Acessibilidade para PcD", hint: "Rampas, banheiro adaptado, vaga PCD" },
  { key: "cameras", label: "Segurança / Câmeras 24h", hint: "Onde ficam (Airbnb exige informar)" },
  { key: "extintores", label: "Extintores / detectores de fumaça", hint: "Localização dos equipamentos" },
  { key: "carregador", label: "Carregador de carro elétrico", hint: "Tipo de tomada, pago ou grátis" },
  { key: "pet", label: "Espaço pet", hint: "Área cercada, regras" },
  { key: "eventos", label: "Espaço para eventos", hint: "Capacidade, regras, horário" },
  { key: "coworking", label: "Sala de reuniões / coworking", hint: "Horário, estrutura, reserva" },
  { key: "praia", label: "Praia privativa / Deck", hint: "Acesso, estrutura, regras" },
  { key: "gerador", label: "Gerador elétrico", hint: "Capacidade, atende quartos ou áreas comuns" },
  { key: "transfer", label: "Transfer / translado", hint: "Pago à parte, agendamento, rotas" },
  { key: "mirante", label: "Mirante / Vista panorâmica", hint: "Localização, horário de visita" },
  { key: "cofreCentral", label: "Cofre central na recepção", hint: "Regras e horários de uso" },
];

const REGIMES_PENSAO = [
  "Só acomodação (sem refeição)",
  "Café da manhã incluso",
  "Café da manhã pago à parte",
  "Meia pensão (com almoço)",
  "Meia pensão (com jantar)",
  "Pensão completa (café + almoço + jantar)",
  "All inclusive (tudo incluso)",
];

const CAFE_OPTS = ["Incluso na diária", "Pago à parte", "Não oferece"];
const CAFE_TIPOS = [
  "Buffet",
  "Regional / caseiro",
  "Continental",
  "Servido à mesa",
  "Entregue no quarto",
];

const MEAL_TAGS = [
  "Restaurante próprio",
  "Room service",
  "Bar / Lounge",
  "Cozinha compartilhada de hóspedes",
  "Almoço",
  "Jantar",
  "Lanches / Porções",
];

const ESTAC_OPTS = ["Gratuito", "Pago", "Não possui"];
const ESTAC_TIPOS = [
  "Rotativo por ordem de chegada",
  "Vaga demarcada / privativa",
  "Estacionamento conveniado fora do local",
];
const ESTAC_COBERTURA = ["Coberto", "Descoberto", "Misto"];

const WIFI_OPTS = [
  "Gratuito em todas as áreas",
  "Só nas áreas comuns",
  "Só nos quartos",
  "Pago",
  "Não possui",
];

export function Mod04StructureOperations({
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
  const facilidades = data.facilidades ?? {};
  const servicos = data.servicos ?? [];
  const outrasRefeicoes = data.outrasRefeicoes ?? [];

  const cafeStatus = data.cafe ?? data.cafeFormato ?? "Incluso na diária";

  const regimesAlimentacao = React.useMemo(() => {
    if (data.regimesAlimentacao && data.regimesAlimentacao.length > 0) {
      return data.regimesAlimentacao;
    }
    const defs: string[] = [];
    if (cafeStatus === "Incluso na diária") defs.push("Café da manhã incluso");
    else if (cafeStatus === "Pago à parte") defs.push("Café da manhã pago à parte");
    else if (cafeStatus === "Não oferece") defs.push("Só acomodação (sem refeição)");
    return defs;
  }, [data.regimesAlimentacao, cafeStatus]);

  function toggleRegime(regime: string) {
    const active = regimesAlimentacao.includes(regime);
    const next = active
      ? regimesAlimentacao.filter((r) => r !== regime)
      : [...regimesAlimentacao, regime];

    let syncCafe = data.cafe;
    if (next.includes("Café da manhã incluso")) {
      syncCafe = "Incluso na diária";
    } else if (next.includes("Café da manhã pago à parte")) {
      syncCafe = "Pago à parte";
    } else if (next.length > 0 && !next.some((r) => r.includes("Café"))) {
      syncCafe = "Não oferece";
    }

    onChange({ regimesAlimentacao: next, cafe: syncCafe, cafeFormato: syncCafe });
  }

  function getFacility(label: string, key?: string) {
    return facilidades[label] ?? (key ? facilidades[key] : undefined) ?? { on: false, det: "" };
  }

  function toggleFacility(label: string, key?: string) {
    const cur = getFacility(label, key);
    const nextOn = !cur.on;
    onChange({
      facilidades: {
        ...facilidades,
        [label]: { ...cur, on: nextOn },
      },
    });
  }

  function updateFacilityDet(label: string, key: string | undefined, det: string) {
    const cur = getFacility(label, key);
    onChange({
      facilidades: {
        ...facilidades,
        [label]: { ...cur, on: true, det },
      },
    });
  }

  function toggleMealTag(tag: string) {
    const next = outrasRefeicoes.includes(tag)
      ? outrasRefeicoes.filter((t) => t !== tag)
      : [...outrasRefeicoes, tag];
    onChange({ outrasRefeicoes: next });
  }

  function addService() {
    const novo: ExtraServiceItem = {
      id: crypto.randomUUID(),
      nome: "",
      cobranca: "Incluso",
      valor: "",
      agendamento: false,
      obs: "",
    };
    onChange({ servicos: [...servicos, novo] });
  }

  function updateService(index: number, patch: Partial<ExtraServiceItem>) {
    const updated = servicos.map((s, i) => (i === index ? { ...s, ...patch } : s));
    onChange({ servicos: updated });
  }

  function removeService(index: number) {
    onChange({ servicos: servicos.filter((_, i) => i !== index) });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Alimentação & Regimes de Pensão */}
      <FormSection title="Alimentação & Regimes de Pensão">
        <FieldWrapper
          label="Regimes de alimentação oferecidos"
          fieldKey="regimesAlimentacao"
          hint="Selecione todos os regimes que a propriedade oferece (permite múltiplos regimes simultâneos)"
          meta={meta.regimesAlimentacao ?? meta.cafe}
          onMetaChange={onMetaChange}
          isFilled={regimesAlimentacao.length > 0}
        >
          <div className="flex flex-wrap gap-1.5">
            {REGIMES_PENSAO.map((opt) => {
              const active = regimesAlimentacao.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleRegime(opt)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
                    active
                      ? "border-cyan-fact bg-cyan-fact/20 text-ink font-semibold"
                      : "border-line-subtle bg-input-bg text-ink-muted hover:text-ink hover:border-line-medium"
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </FieldWrapper>

        {(regimesAlimentacao.includes("Café da manhã pago à parte") || cafeStatus === "Pago à parte") && (
          <FieldWrapper
            label="Valor do café da manhã avulso (por pessoa)"
            fieldKey="cafeValor"
            meta={meta.cafeValor}
            onMetaChange={onMetaChange}
            isFilled={!!data.cafeValor}
          >
            <Input
              value={data.cafeValor ?? ""}
              onChange={(e) => onChange({ cafeValor: e.target.value })}
              placeholder="Ex.: R$ 35,00 por pessoa"
            />
          </FieldWrapper>
        )}

        {(regimesAlimentacao.some((r) => r.includes("Café")) || cafeStatus !== "Não oferece") && (
          <>
            <FieldWrapper
              label="Tipo de café da manhã"
              fieldKey="cafeTipo"
              meta={meta.cafeTipo}
              onMetaChange={onMetaChange}
              isFilled={!!data.cafeTipo}
            >
              <Select
                value={data.cafeTipo ?? ""}
                onChange={(e) => onChange({ cafeTipo: e.target.value })}
              >
                <option value="">Selecione o formato</option>
                {CAFE_TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </FieldWrapper>

            <FieldWrapper
              label="Horário do café da manhã"
              fieldKey="cafeInicio"
              meta={meta.cafeInicio ?? meta.cafeHorario}
              onMetaChange={onMetaChange}
              isFilled={!!(data.cafeInicio || data.cafeHorario)}
            >
              <div className="grid grid-cols-[auto_1fr_auto_1fr] items-center gap-2 max-w-sm">
                <span className="text-xs text-ink-muted">Das</span>
                <Input
                  type="time"
                  value={data.cafeInicio ?? ""}
                  onChange={(e) => onChange({ cafeInicio: e.target.value })}
                />
                <span className="text-xs text-ink-muted">às</span>
                <Input
                  type="time"
                  value={data.cafeFim ?? ""}
                  onChange={(e) => onChange({ cafeFim: e.target.value })}
                />
              </div>
            </FieldWrapper>
          </>
        )}

        {regimesAlimentacao.some((r) => r.includes("pensão") || r.includes("Pensão") || r.includes("inclusive") || r.includes("Inclusive")) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-lg border border-line-subtle bg-surface-muted/30 p-3">
            <FieldWrapper
              label="Horário do almoço / refeições"
              fieldKey="almocoHorario"
              optional
              meta={meta.almocoHorario}
              onMetaChange={onMetaChange}
              isFilled={!!data.restauranteHorario}
            >
              <Input
                value={data.restauranteHorario ?? ""}
                onChange={(e) => onChange({ restauranteHorario: e.target.value })}
                placeholder="Ex.: Das 12:00 às 15:00"
              />
            </FieldWrapper>

            <FieldWrapper
              label="Observações / Regras das refeições"
              fieldKey="refeicoesObs"
              optional
              meta={meta.refeicoesObs}
              onMetaChange={onMetaChange}
              isFilled={false}
            >
              <Input
                placeholder="Ex.: Bebidas inclusas no all inclusive; jantar à la carte"
                onChange={(e) => {
                  const s = e.target.value;
                  onChange({ mealPlan: s });
                }}
                value={data.mealPlan ?? ""}
              />
            </FieldWrapper>
          </div>
        )}

        <FieldWrapper
          label="Estrutura gastronômica adicional"
          fieldKey="outrasRefeicoes"
          hint="Selecione estrutura e serviços adicionais da propriedade"
          meta={meta.outrasRefeicoes}
          onMetaChange={onMetaChange}
          isFilled={outrasRefeicoes.length > 0}
        >
          <div className="flex flex-wrap gap-1.5">
            {MEAL_TAGS.map((tag) => {
              const active = outrasRefeicoes.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleMealTag(tag)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer border",
                    active
                      ? "border-cyan-fact bg-cyan-fact/20 text-ink font-semibold"
                      : "border-line-subtle bg-input-bg text-ink-muted hover:text-ink hover:border-line-medium"
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </FieldWrapper>
      </FormSection>

      {/* Estacionamento */}
      <FormSection title="Estacionamento">
        <FieldWrapper
          label="Situação do estacionamento"
          fieldKey="estac"
          meta={meta.estac}
          onMetaChange={onMetaChange}
          isFilled={!!data.estac}
        >
          <div className="flex flex-wrap gap-1.5">
            {ESTAC_OPTS.map((opt) => {
              const active = data.estac === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onChange({ estac: opt })}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
                    active
                      ? "border-cyan-fact bg-cyan-fact/20 text-ink font-semibold"
                      : "border-line-subtle bg-input-bg text-ink-muted hover:text-ink hover:border-line-medium"
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </FieldWrapper>

        {data.estac === "Pago" && (
          <FieldWrapper
            label="Valor da diária do estacionamento"
            fieldKey="estacValor"
            meta={meta.estacValor}
            onMetaChange={onMetaChange}
            isFilled={!!data.estacValor}
          >
            <Input
              value={data.estacValor ?? ""}
              onChange={(e) => onChange({ estacValor: e.target.value })}
              placeholder="Ex.: R$ 30,00 por diária"
            />
          </FieldWrapper>
        )}

        {data.estac && data.estac !== "Não possui" && (
          <>
            <FieldWrapper
              label="Tipo de vaga"
              fieldKey="estacTipo"
              meta={meta.estacTipo}
              onMetaChange={onMetaChange}
              isFilled={!!data.estacTipo}
            >
              <Select
                value={data.estacTipo ?? ""}
                onChange={(e) => onChange({ estacTipo: e.target.value })}
              >
                <option value="">Selecione o tipo de vaga</option>
                {ESTAC_TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </FieldWrapper>

            <FieldWrapper
              label="Cobertura e capacidade"
              fieldKey="estacVagas"
              meta={meta.estacVagas}
              onMetaChange={onMetaChange}
              isFilled={data.estacVagas !== undefined && data.estacVagas > 0}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Select
                  value={data.estacCobertura ?? (data.estacCoberto ? "Coberto" : "")}
                  onChange={(e) =>
                    onChange({
                      estacCobertura: e.target.value,
                      estacCoberto: e.target.value === "Coberto",
                    })
                  }
                >
                  <option value="">Cobertura</option>
                  {ESTAC_COBERTURA.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
                <Input
                  type="number"
                  min={0}
                  value={data.estacVagas ?? ""}
                  onChange={(e) =>
                    onChange({ estacVagas: e.target.value ? Number(e.target.value) : undefined })
                  }
                  placeholder="Total de vagas"
                />
                <label className="flex items-center gap-2 text-xs text-ink cursor-pointer border border-line-subtle rounded-md px-3 bg-surface select-none">
                  <input
                    type="checkbox"
                    checked={data.estacReserva ?? false}
                    onChange={(e) => onChange({ estacReserva: e.target.checked })}
                    className="rounded accent-cyan-fact"
                  />
                  <span>Reserva prévia exigida</span>
                </label>
              </div>
            </FieldWrapper>

            <FieldWrapper
              label="Observações do estacionamento"
              fieldKey="estacObs"
              optional
              hint="Ex.: vagas rotativas, entrada lateral, vans sob consulta"
              meta={meta.estacObs}
              onMetaChange={onMetaChange}
              isFilled={!!data.estacObs}
            >
              <Input
                value={data.estacObs ?? ""}
                onChange={(e) => onChange({ estacObs: e.target.value })}
                placeholder="Ex.: Rotativo por ordem de chegada, 1 vaga por acomodação..."
              />
            </FieldWrapper>
          </>
        )}
      </FormSection>

      {/* Conectividade & Wi-Fi */}
      <FormSection title="Conectividade & Wi-Fi">
        <FieldWrapper
          label="Cobertura do Wi-Fi"
          fieldKey="wifi"
          meta={meta.wifi}
          onMetaChange={onMetaChange}
          isFilled={!!data.wifi}
        >
          <div className="flex flex-wrap gap-1.5">
            {WIFI_OPTS.map((opt) => {
              const active = data.wifi === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onChange({ wifi: opt })}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
                    active
                      ? "border-cyan-fact bg-cyan-fact/20 text-ink font-semibold"
                      : "border-line-subtle bg-input-bg text-ink-muted hover:text-ink hover:border-line-medium"
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </FieldWrapper>
      </FormSection>

      {/* Comodidades gerais (2 columns) com campos de detalhes e horários */}
      <FormSection title="Comodidades e Áreas Comuns">
        <FieldWrapper
          label="Marque todas as áreas e comodidades que a propriedade oferece"
          fieldKey="facilidades"
          hint="Ao marcar cada item, insira horários de funcionamento, regras ou detalhes específicos"
          optional
          meta={meta.facilidades}
          onMetaChange={onMetaChange}
          isFilled={Object.values(facilidades).some((f) => f?.on)}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 py-1">
            {ALL_FACILITIES.map((fac) => {
              const st = getFacility(fac.label, fac.key);
              const isOn = st.on ?? false;
              return (
                <div
                  key={fac.key}
                  className={cn(
                    "flex flex-col gap-1.5 rounded-lg border p-2.5 transition-all",
                    isOn
                      ? "border-cyan-fact/50 bg-surface-muted/50 shadow-xs"
                      : "border-line-subtle/60 bg-surface/30 hover:border-line-medium"
                  )}
                >
                  <label className="flex items-center gap-2.5 text-xs text-ink cursor-pointer hover:text-cyan-fact select-none">
                    <input
                      type="checkbox"
                      checked={isOn}
                      onChange={() => toggleFacility(fac.label, fac.key)}
                      className="size-4 rounded border-line-medium bg-input-bg accent-cyan-fact cursor-pointer"
                    />
                    <span className={cn("font-medium", isOn ? "text-cyan-fact font-semibold" : "text-ink")}>
                      {fac.label}
                    </span>
                  </label>
                  {isOn && (
                    <div className="pl-6 pt-0.5">
                      <Input
                        value={st.det ?? ""}
                        onChange={(e) => updateFacilityDet(fac.label, fac.key, e.target.value)}
                        placeholder={fac.hint || "Horários, regras ou observações..."}
                        className="h-7 text-xs bg-surface border-line-subtle focus:border-cyan-fact placeholder:text-ink-muted/70"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </FieldWrapper>
      </FormSection>

      {/* Serviços Oferecidos */}
      <FormSection title="Serviços Oferecidos">
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-muted">
              Serviços especiais oferecidos aos hóspedes (massagem, passeios, lavanderia, etc.).
            </p>
            <Button variant="ghost" size="sm" onClick={addService} className="h-7 text-xs">
              <Plus className="mr-1 size-3.5" /> Adicionar serviço
            </Button>
          </div>

          {servicos.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line-subtle p-3 text-center text-xs text-ink-secondary">
              Nenhum serviço extra cadastrado.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {servicos.map((srv, idx) => (
                <div key={srv.id} className="grid grid-cols-1 sm:grid-cols-[1fr_120px_110px_130px_1fr_auto] items-center gap-2 rounded-lg border border-line-subtle bg-surface-muted/40 p-2.5">
                  <Input
                    value={srv.nome}
                    onChange={(e) => updateService(idx, { nome: e.target.value })}
                    placeholder="Nome do serviço"
                  />
                  <Select
                    value={srv.cobranca}
                    onChange={(e) => updateService(idx, { cobranca: e.target.value })}
                  >
                    <option value="Incluso">Incluso</option>
                    <option value="Pago à parte">Pago à parte</option>
                  </Select>
                  <Input
                    value={srv.valor ?? ""}
                    onChange={(e) => updateService(idx, { valor: e.target.value })}
                    placeholder="Valor (R$)"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-ink cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={srv.agendamento ?? false}
                      onChange={(e) => updateService(idx, { agendamento: e.target.checked })}
                      className="rounded accent-cyan-fact"
                    />
                    <span>Agendar?</span>
                  </label>
                  <Input
                    value={srv.obs ?? ""}
                    onChange={(e) => updateService(idx, { obs: e.target.value })}
                    placeholder="Observações do serviço"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeService(idx)}
                    className="size-7 text-ink-muted hover:text-feedback-danger"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </FormSection>
    </div>
  );
}
