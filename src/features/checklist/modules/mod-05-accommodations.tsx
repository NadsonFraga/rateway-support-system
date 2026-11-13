"use client";

import * as React from "react";
import { Plus, Trash2, Copy, ChevronUp, ChevronDown, BedDouble, Split, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ChecklistData, FieldMetaRecord, RoomCategoryItem, BedConfig, UnitDiff } from "../types";

const TIPOS_VENDA = [
  "Quarto / suíte privativo",
  "Cama em quarto compartilhado (hostel)",
  "Unidade inteira (casa / apê)",
];

const TIPOS_QUARTO = [
  "Suíte",
  "Quarto standard",
  "Quarto luxo",
  "Quarto duplo",
  "Quarto triplo",
  "Quarto quádruplo",
  "Quarto família",
  "Chalé",
  "Bangalô",
  "Dormitório compartilhado",
  "Casa de temporada",
  "Apartamento",
  "Studio / Flat",
  "Outro",
];

const VISTAS = [
  "Vista para o mar",
  "Vista para o jardim",
  "Vista para a piscina",
  "Vista para a montanha",
  "Vista para a cidade",
  "Vista interna / sem vista",
  "Outro",
];

const CHUVEIROS = ["Elétrico", "A gás", "Aquecimento solar", "Caldeira central"];
const CAMA_EXTRA_OPTS = ["Não disponível", "Disponível grátis", "Disponível com taxa"];

export function Mod05Accommodations({
  data,
  onChange,
}: {
  data: ChecklistData;
  meta: FieldMetaRecord;
  onChange: (patch: Partial<ChecklistData>) => void;
  onMetaChange: (fieldKey: string, val: any) => void;
}) {
  const categorias = data.categorias ?? [];
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(
    categorias.length > 0 ? 0 : null
  );

  function addCategory() {
    const nova: RoomCategoryItem = {
      id: crypto.randomUUID(),
      nome: "",
      tipoVenda: "Quarto / suíte privativo",
      tipoQuarto: "Suíte",
      quantidade: 1,
      identificacao: "",
      maxAdultos: 2,
      maxCriancas: 1,
      maxTotal: 3,
      ocupPadrao: 2,
      camas: [
        {
          id: crypto.randomUUID(),
          casal: 1,
          queen: 0,
          king: 0,
          solteiro: 0,
          beliche: 0,
          treliche: 0,
          sofa: 0,
          camaAuxiliar: 0,
          outro: 0,
          outroDesc: "",
          obs: "",
        },
      ],
      banheiro: "Privativo dentro da acomodação",
      chuveiro: "A gás",
      camaExtra: "Não disponível",
      acessivel: false,
      difs: [],
    };
    const next = [...categorias, nova];
    onChange({ categorias: next });
    setExpandedIndex(next.length - 1);
  }

  function duplicateCategory(index: number) {
    const orig = categorias[index];
    if (!orig) return;
    const dup: RoomCategoryItem = {
      ...orig,
      id: crypto.randomUUID(),
      nome: orig.nome ? `${orig.nome} (Cópia)` : "Nova categoria (Cópia)",
      camas: orig.camas.map((c) => ({ ...c, id: crypto.randomUUID() })),
      difs: orig.difs ? orig.difs.map((d) => ({ ...d, id: crypto.randomUUID() })) : [],
    };
    const next = [...categorias.slice(0, index + 1), dup, ...categorias.slice(index + 1)];
    onChange({ categorias: next });
    setExpandedIndex(index + 1);
  }

  function moveCategory(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= categorias.length) return;
    const reordered = [...categorias];
    const [removed] = reordered.splice(index, 1);
    reordered.splice(target, 0, removed);
    onChange({ categorias: reordered });
    setExpandedIndex(target);
  }

  function updateCategory(index: number, patch: Partial<RoomCategoryItem>) {
    const updated = categorias.map((c, i) => (i === index ? { ...c, ...patch } : c));
    onChange({ categorias: updated });
  }

  function removeCategory(index: number) {
    onChange({ categorias: categorias.filter((_, i) => i !== index) });
    if (expandedIndex === index) {
      setExpandedIndex(null);
    }
  }

  // Camas
  function addBedConfig(catIndex: number) {
    const cat = categorias[catIndex];
    const novaCama: BedConfig = {
      id: crypto.randomUUID(),
      casal: 0,
      queen: 0,
      king: 0,
      solteiro: 2,
      beliche: 0,
      treliche: 0,
      sofa: 0,
      camaAuxiliar: 0,
      outro: 0,
      outroDesc: "",
      obs: "",
    };
    updateCategory(catIndex, { camas: [...cat.camas, novaCama] });
  }

  function updateBedConfig(catIndex: number, bedIndex: number, patch: Partial<BedConfig>) {
    const cat = categorias[catIndex];
    const updated = cat.camas.map((c, i) => (i === bedIndex ? { ...c, ...patch } : c));
    updateCategory(catIndex, { camas: updated });
  }

  function removeBedConfig(catIndex: number, bedIndex: number) {
    const cat = categorias[catIndex];
    if (cat.camas.length <= 1) return;
    const updated = cat.camas.filter((_, i) => i !== bedIndex);
    updateCategory(catIndex, { camas: updated });
  }

  // Diferenças entre unidades
  function addUnitDiff(catIndex: number) {
    const cat = categorias[catIndex];
    const novaDiff: UnitDiff = {
      id: crypto.randomUUID(),
      unidade: "",
      andar: "",
      vista: "",
      tamanho: "",
      tem: "",
      naoTem: "",
      acessivel: false,
      obs: "",
    };
    updateCategory(catIndex, { difs: [...(cat.difs || []), novaDiff] });
  }

  function updateUnitDiff(catIndex: number, diffIndex: number, patch: Partial<UnitDiff>) {
    const cat = categorias[catIndex];
    const updated = (cat.difs || []).map((d, i) => (i === diffIndex ? { ...d, ...patch } : d));
    updateCategory(catIndex, { difs: updated });
  }

  function removeUnitDiff(catIndex: number, diffIndex: number) {
    const cat = categorias[catIndex];
    const updated = (cat.difs || []).filter((_, i) => i !== diffIndex);
    updateCategory(catIndex, { difs: updated });
  }

  return (
    <div className="flex flex-col gap-4">
      {categorias.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-subtle p-8 text-center text-xs text-ink-secondary bg-surface/50">
          <p className="font-medium text-ink">Nenhuma categoria cadastrada ainda.</p>
          <p className="text-[11px] text-ink-muted mt-1">
            Cadastre uma ficha para cada tipo de quarto, suíte, chalé ou unidade da propriedade.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={addCategory}
            className="mt-3 h-8 border-line-medium cursor-pointer"
          >
            <Plus className="mr-1 size-3.5 text-cyan-fact" /> Nova categoria
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {categorias.map((cat, idx) => {
            const isExpanded = expandedIndex === idx;
            const isFilled = !!cat.nome.trim() && cat.quantidade > 0;
            const summaryTitle = [
              cat.nome || "Sem nome",
              cat.identificacao ? cat.identificacao : null,
              cat.quantidade ? `${cat.quantidade} un.` : null,
              cat.maxTotal ? `até ${cat.maxTotal} pessoas` : null,
            ]
              .filter(Boolean)
              .join(" · ");

            const isDorm = cat.tipoVenda?.includes("compartilhado") || cat.tipoQuarto?.includes("Dormitório");
            const isUnidadeInteira = cat.tipoVenda?.includes("inteira") || cat.tipoQuarto?.includes("Casa") || cat.tipoQuarto?.includes("Apartamento");

            return (
              <div
                key={cat.id}
                className={cn(
                  "rounded-lg border border-line-subtle bg-surface transition-all overflow-hidden",
                  isExpanded ? "ring-1 ring-line-medium" : "hover:border-line-medium"
                )}
              >
                {/* Accordion Header matching Image 1 */}
                <div className="flex items-center gap-2 px-3 py-2 bg-surface-elevated/40 border-b border-line-subtle/60 text-xs">
                  <button
                    type="button"
                    onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                    className="flex-1 min-w-0 text-left font-medium text-ink truncate hover:text-cyan-fact transition-colors cursor-pointer"
                  >
                    <span>{summaryTitle}</span>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => duplicateCategory(idx)}
                      className="h-7 px-2 text-[11px] text-ink-secondary hover:text-ink gap-1 cursor-pointer"
                      title="Duplicar categoria"
                    >
                      <Copy className="size-3" />
                      <span>Duplicar</span>
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={idx === 0}
                      onClick={() => moveCategory(idx, -1)}
                      className="size-7 text-ink-muted hover:text-ink disabled:opacity-30 cursor-pointer"
                      title="Mover para cima"
                    >
                      <ChevronUp className="size-3.5" />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={idx === categorias.length - 1}
                      onClick={() => moveCategory(idx, 1)}
                      className="size-7 text-ink-muted hover:text-ink disabled:opacity-30 cursor-pointer"
                      title="Mover para baixo"
                    >
                      <ChevronDown className="size-3.5" />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCategory(idx)}
                      className="size-7 text-ink-muted hover:text-feedback-danger cursor-pointer"
                      title="Remover categoria"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>

                    <span
                      className={cn(
                        "size-2 rounded-full ml-1 shrink-0",
                        isFilled ? "bg-cyan-fact" : "bg-feedback-danger"
                      )}
                      title={isFilled ? "Preenchido" : "Incompleto"}
                    />
                  </div>
                </div>

                {/* Collapsible Body */}
                {isExpanded && (
                  <div className="p-4 flex flex-col gap-5 bg-surface">
                    {/* Seção 1: Identificação Básica */}
                    <div className="flex flex-col gap-3">
                      <span className="text-xs font-semibold text-ink uppercase tracking-wider">
                        Identificação da Categoria
                      </span>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2">
                          <label className="text-xs font-medium text-ink">Nome Comercial da Categoria</label>
                          <Input
                            value={cat.nome}
                            onChange={(e) => updateCategory(idx, { nome: e.target.value })}
                            placeholder="Ex.: Suíte Frente Mar - Suítes Peroba e Tremembé"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-ink">Tipo de Venda</label>
                          <Select
                            value={cat.tipoVenda}
                            onChange={(e) => updateCategory(idx, { tipoVenda: e.target.value })}
                            className="mt-1"
                          >
                            {TIPOS_VENDA.map((tv) => (
                              <option key={tv} value={tv}>
                                {tv}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-xs font-medium text-ink">Tipo de Acomodação</label>
                          <Select
                            value={cat.tipoQuarto}
                            onChange={(e) => updateCategory(idx, { tipoQuarto: e.target.value })}
                            className="mt-1"
                          >
                            {TIPOS_QUARTO.map((tq) => (
                              <option key={tq} value={tq}>
                                {tq}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-ink">Quantidade de Unidades</label>
                          <Input
                            type="number"
                            min={1}
                            value={cat.quantidade}
                            onChange={(e) => updateCategory(idx, { quantidade: Number(e.target.value) })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-ink">Numeração / Quartos</label>
                          <Input
                            value={cat.identificacao}
                            onChange={(e) => updateCategory(idx, { identificacao: e.target.value })}
                            placeholder="Ex.: 01, 02 ou Chalés 1 a 4"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-ink">Tamanho (m²)</label>
                          <Input
                            type="number"
                            value={cat.tamanho ?? ""}
                            onChange={(e) =>
                              updateCategory(idx, {
                                tamanho: e.target.value ? Number(e.target.value) : undefined,
                              })
                            }
                            placeholder="Ex.: 32"
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-ink">Andar / Piso / Localização</label>
                          <Input
                            value={cat.andar ?? ""}
                            onChange={(e) => updateCategory(idx, { andar: e.target.value })}
                            placeholder="Ex.: Térreo, Superior, Bloco B"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-ink">Vista da Acomodação</label>
                          <Select
                            value={cat.vista ?? ""}
                            onChange={(e) => updateCategory(idx, { vista: e.target.value })}
                            className="mt-1"
                          >
                            <option value="">Selecione a vista principal</option>
                            {VISTAS.map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Seção 2: Capacidade & Ocupação */}
                    <div className="flex flex-col gap-3 border-t border-line-subtle pt-4">
                      <span className="text-xs font-semibold text-ink uppercase tracking-wider">
                        Capacidade de Hóspedes & Ocupação
                      </span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-xs font-medium text-ink">Máx. Adultos</label>
                          <Input
                            type="number"
                            min={1}
                            value={cat.maxAdultos}
                            onChange={(e) => updateCategory(idx, { maxAdultos: Number(e.target.value) })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-ink">Máx. Crianças</label>
                          <Input
                            type="number"
                            min={0}
                            value={cat.maxCriancas}
                            onChange={(e) => updateCategory(idx, { maxCriancas: Number(e.target.value) })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-ink">Capacidade Máx. Total</label>
                          <Input
                            type="number"
                            min={1}
                            value={cat.maxTotal}
                            onChange={(e) => updateCategory(idx, { maxTotal: Number(e.target.value) })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-ink">Ocupação Base da Tarifa</label>
                          <Input
                            type="number"
                            min={1}
                            value={cat.ocupPadrao}
                            onChange={(e) => updateCategory(idx, { ocupPadrao: Number(e.target.value) })}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Seção 3: Configuração de Camas (com Suporte a Alternativas "ou", Treliche, Outro) */}
                    <div className="flex flex-col gap-3 border-t border-line-subtle pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BedDouble className="size-4 text-cyan-fact" />
                          <span className="text-xs font-semibold text-ink uppercase tracking-wider">
                            Disposição e Tipos de Leito
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addBedConfig(idx)}
                          className="h-7 text-xs text-cyan-fact hover:text-cyan-fact cursor-pointer"
                        >
                          <Plus className="mr-1 size-3" /> Alternativa de camas ("ou")
                        </Button>
                      </div>

                      <div className="flex flex-col gap-3">
                        {cat.camas.map((cama, cIdx) => (
                          <div
                            key={cama.id}
                            className="flex flex-col gap-3 rounded-lg border border-line-subtle bg-surface-muted/40 p-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-ink">
                                Configuração {String.fromCharCode(65 + cIdx)}
                                {cIdx > 0 && " (Opção alternativa)"}
                              </span>
                              {cat.camas.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeBedConfig(idx, cIdx)}
                                  className="size-6 text-ink-muted hover:text-feedback-danger cursor-pointer"
                                  title="Remover alternativa"
                                >
                                  <Trash2 className="size-3" />
                                </Button>
                              )}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                              {[
                                { key: "casal", label: "Casal" },
                                { key: "queen", label: "Queen" },
                                { key: "king", label: "King" },
                                { key: "solteiro", label: "Solteiro" },
                                { key: "beliche", label: "Beliche" },
                                { key: "treliche", label: "Treliche" },
                                { key: "sofa", label: "Sofá-cama" },
                                { key: "camaAuxiliar", label: "Cama Aux." },
                              ].map((item) => (
                                <div key={item.key} className="flex flex-col gap-1">
                                  <span className="text-[11px] text-ink-muted">{item.label}</span>
                                  <Input
                                    type="number"
                                    min={0}
                                    value={(cama as any)[item.key] ?? 0}
                                    onChange={(e) =>
                                      updateBedConfig(idx, cIdx, {
                                        [item.key]: Number(e.target.value),
                                      })
                                    }
                                  />
                                </div>
                              ))}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-[100px_1fr_1fr] gap-2 pt-1">
                              <div className="flex flex-col gap-1">
                                <span className="text-[11px] text-ink-muted">Outro leito</span>
                                <Input
                                  type="number"
                                  min={0}
                                  value={cama.outro ?? 0}
                                  onChange={(e) =>
                                    updateBedConfig(idx, cIdx, {
                                      outro: Number(e.target.value),
                                    })
                                  }
                                  placeholder="Qtd"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[11px] text-ink-muted">Tipo do outro leito</span>
                                <Input
                                  value={cama.outroDesc ?? ""}
                                  onChange={(e) =>
                                    updateBedConfig(idx, cIdx, {
                                      outroDesc: e.target.value,
                                    })
                                  }
                                  placeholder="Ex.: Tatame, Futon, Rede suspensa..."
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[11px] text-ink-muted">Observação dos leitos</span>
                                <Input
                                  value={cama.obs ?? ""}
                                  onChange={(e) =>
                                    updateBedConfig(idx, cIdx, {
                                      obs: e.target.value,
                                    })
                                  }
                                  placeholder="Ex.: Solteiros reversíveis para casal king"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Seção 4: Banheiro, Chuveiro e Cama Extra */}
                    <div className="flex flex-col gap-3 border-t border-line-subtle pt-4">
                      <span className="text-xs font-semibold text-ink uppercase tracking-wider">
                        Banheiro & Condições Especiais
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="text-xs font-medium text-ink">Banheiro</label>
                          <Select
                            value={cat.banheiro}
                            onChange={(e) => updateCategory(idx, { banheiro: e.target.value })}
                            className="mt-1"
                          >
                            <option value="Privativo dentro da acomodação">Privativo (dentro)</option>
                            <option value="Compartilhado fora da acomodação">Compartilhado (fora)</option>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-ink">Chuveiro</label>
                          <Select
                            value={cat.chuveiro}
                            onChange={(e) => updateCategory(idx, { chuveiro: e.target.value })}
                            className="mt-1"
                          >
                            {CHUVEIROS.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-ink">Cama Extra</label>
                          <Select
                            value={cat.camaExtra}
                            onChange={(e) => updateCategory(idx, { camaExtra: e.target.value })}
                            className="mt-1"
                          >
                            {CAMA_EXTRA_OPTS.map((ce) => (
                              <option key={ce} value={ce}>
                                {ce}
                              </option>
                            ))}
                          </Select>
                        </div>
                        {cat.camaExtra === "Disponível com taxa" ? (
                          <div>
                            <label className="text-xs font-medium text-ink">Valor Cama Extra</label>
                            <Input
                              value={cat.camaExtraValor ?? ""}
                              onChange={(e) => updateCategory(idx, { camaExtraValor: e.target.value })}
                              placeholder="Ex.: R$ 80,00"
                              className="mt-1"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center pt-5">
                            <label className="flex items-center gap-2 text-xs text-ink cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={cat.acessivel ?? false}
                                onChange={(e) => updateCategory(idx, { acessivel: e.target.checked })}
                                className="rounded accent-cyan-fact"
                              />
                              <span>Acomodação acessível a PcD</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Condicional para Hostel / Dormitório */}
                    {isDorm && (
                      <div className="flex flex-col gap-3 rounded-lg border border-line-subtle bg-surface-muted/30 p-3">
                        <span className="text-xs font-semibold text-ink">
                          Especificidades de Dormitório Compartilhado
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                          <div>
                            <label className="text-xs font-medium text-ink">Gênero do Dormitório</label>
                            <Select
                              value={cat.dormGenero ?? "Misto"}
                              onChange={(e) => updateCategory(idx, { dormGenero: e.target.value })}
                              className="mt-1"
                            >
                              <option value="Misto">Misto</option>
                              <option value="Feminino">Feminino</option>
                              <option value="Masculino">Masculino</option>
                            </Select>
                          </div>
                          <label className="flex items-center gap-2 text-xs text-ink cursor-pointer pt-4 select-none">
                            <input
                              type="checkbox"
                              checked={cat.dormLockers ?? false}
                              onChange={(e) => updateCategory(idx, { dormLockers: e.target.checked })}
                              className="rounded accent-cyan-fact"
                            />
                            <span>Armários com chave (lockers)</span>
                          </label>
                          <label className="flex items-center gap-2 text-xs text-ink cursor-pointer pt-4 select-none">
                            <input
                              type="checkbox"
                              checked={cat.dormBanheiroDentro ?? false}
                              onChange={(e) =>
                                updateCategory(idx, { dormBanheiroDentro: e.target.checked })
                              }
                              className="rounded accent-cyan-fact"
                            />
                            <span>Banheiro dentro do dormitório</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Condicional para Casa / Unidade Inteira */}
                    {isUnidadeInteira && (
                      <div className="flex flex-col gap-3 rounded-lg border border-line-subtle bg-surface-muted/30 p-3">
                        <span className="text-xs font-semibold text-ink">
                          Estrutura de Unidade Inteira
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-center">
                          <div>
                            <label className="text-xs font-medium text-ink">Nº de Quartos</label>
                            <Input
                              type="number"
                              min={1}
                              value={cat.unidadeQuartos ?? 1}
                              onChange={(e) =>
                                updateCategory(idx, { unidadeQuartos: Number(e.target.value) })
                              }
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-ink">Nº de Banheiros</label>
                            <Input
                              type="number"
                              min={1}
                              value={cat.unidadeBanheiros ?? 1}
                              onChange={(e) =>
                                updateCategory(idx, { unidadeBanheiros: Number(e.target.value) })
                              }
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-ink">Cozinha</label>
                            <Select
                              value={cat.unidadeCozinha ?? "Completa"}
                              onChange={(e) => updateCategory(idx, { unidadeCozinha: e.target.value })}
                              className="mt-1"
                            >
                              <option value="Completa">Completa</option>
                              <option value="Compacta / copa">Compacta / copa</option>
                              <option value="Não possui">Não possui</option>
                            </Select>
                          </div>
                          <label className="flex items-center gap-2 text-xs text-ink cursor-pointer pt-4 select-none">
                            <input
                              type="checkbox"
                              checked={cat.unidadeAreaExterna ?? false}
                              onChange={(e) =>
                                updateCategory(idx, { unidadeAreaExterna: e.target.checked })
                              }
                              className="rounded accent-cyan-fact"
                            />
                            <span>Área externa privativa</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Seção 5: Diferenças entre Unidades da Mesma Categoria */}
                    <div className="flex flex-col gap-3 border-t border-line-subtle pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Split className="size-4 text-ink-muted" />
                          <span className="text-xs font-semibold text-ink uppercase tracking-wider">
                            Diferenças entre Unidades desta Categoria
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addUnitDiff(idx)}
                          className="h-7 text-xs text-ink-secondary hover:text-ink cursor-pointer"
                        >
                          <Plus className="mr-1 size-3" /> Adicionar unidade com variação
                        </Button>
                      </div>

                      {(cat.difs || []).length === 0 ? (
                        <p className="text-xs text-ink-muted italic">
                          Todas as unidades desta categoria são homogêneas (mesmo padrão). Se alguma tiver
                          variação de vista, andar ou tamanho, adicione acima.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-2.5">
                          {(cat.difs || []).map((diff, dIdx) => (
                            <div
                              key={diff.id}
                              className="grid grid-cols-1 sm:grid-cols-[110px_100px_120px_1fr_1fr_auto] items-center gap-2 rounded-lg border border-line-subtle bg-surface-muted/30 p-2.5"
                            >
                              <Input
                                value={diff.unidade}
                                onChange={(e) =>
                                  updateUnitDiff(idx, dIdx, { unidade: e.target.value })
                                }
                                placeholder="Nº/Quarto"
                              />
                              <Input
                                value={diff.andar ?? ""}
                                onChange={(e) => updateUnitDiff(idx, dIdx, { andar: e.target.value })}
                                placeholder="Andar"
                              />
                              <Input
                                value={diff.vista ?? ""}
                                onChange={(e) => updateUnitDiff(idx, dIdx, { vista: e.target.value })}
                                placeholder="Vista"
                              />
                              <Input
                                value={diff.tem ?? ""}
                                onChange={(e) => updateUnitDiff(idx, dIdx, { tem: e.target.value })}
                                placeholder="O que tem a mais (ex.: varanda)"
                              />
                              <Input
                                value={diff.naoTem ?? ""}
                                onChange={(e) => updateUnitDiff(idx, dIdx, { naoTem: e.target.value })}
                                placeholder="O que não tem (ex.: sem sacada)"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeUnitDiff(idx, dIdx)}
                                className="size-7 text-ink-muted hover:text-feedback-danger cursor-pointer"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Seção 6: Descrição */}
                    <div className="flex flex-col gap-3 border-t border-line-subtle pt-4">
                      <span className="text-xs font-semibold text-ink uppercase tracking-wider">
                        Textos de Apresentação da Categoria
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-ink">Descrição Curta</label>
                          <textarea
                            value={cat.descricaoCurta ?? ""}
                            onChange={(e) => updateCategory(idx, { descricaoCurta: e.target.value })}
                            placeholder="Resumo para canais e cartões de reserva..."
                            rows={2}
                            className="f resize-y w-full mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-ink">Descrição Completa</label>
                          <textarea
                            value={cat.descricaoLonga ?? ""}
                            onChange={(e) => updateCategory(idx, { descricaoLonga: e.target.value })}
                            placeholder="Detalhes de espaço, mobília e atmosfera..."
                            rows={2}
                            className="f resize-y w-full mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCategory}
              className="h-8 border-line-medium text-ink hover:bg-surface-hover gap-1 text-xs cursor-pointer"
            >
              <Plus className="size-3.5 text-cyan-fact" />
              <span>Nova categoria</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
