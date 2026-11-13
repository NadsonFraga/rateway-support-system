"use client";

import * as React from "react";
import type { ChecklistData, FieldMetaRecord } from "../types";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

const AMENITY_GROUPS = [
  {
    group: "Quarto & Mobília",
    items: [
      { id: "guardaroupa", label: "Guarda-roupa / Armário" },
      { id: "arara", label: "Arara de roupas" },
      { id: "mesa", label: "Mesa de trabalho / Escrivaninha" },
      { id: "cofre", label: "Cofre de segurança" },
      { id: "blackout", label: "Cortina blackout" },
      { id: "roupacama", label: "Roupa de cama" },
      { id: "travesseiros", label: "Travesseiros extras" },
      { id: "varanda", label: "Varanda / Sacada" },
      { id: "rede", label: "Rede de descanso" },
    ],
  },
  {
    group: "Climatização",
    items: [
      { id: "ar", label: "Ar-condicionado", hint: "Só frio ou quente/frio" },
      { id: "ventilador", label: "Ventilador de teto/portátil" },
      { id: "aquecedor", label: "Aquecedor" },
    ],
  },
  {
    group: "Banheiro no Quarto",
    items: [
      { id: "banheiroPriv", label: "Banheiro privativo" },
      { id: "secador", label: "Secador de cabelo" },
      { id: "banheira", label: "Banheira de imersão" },
      { id: "hidro", label: "Banheira de hidromassagem" },
      { id: "toalhaBanho", label: "Toalhas de banho" },
      { id: "toalhaRosto", label: "Toalhas de rosto" },
    ],
  },
  {
    group: "Entretenimento & Conectividade",
    items: [
      { id: "tv", label: "Televisão", hint: "Tamanho, smart, canais" },
      { id: "streaming", label: "Smart TV / Streaming" },
      { id: "wifiQuarto", label: "Wi-Fi dedicado no quarto" },
    ],
  },
  {
    group: "Cozinha & Frigobar no Quarto",
    items: [
      { id: "frigobar", label: "Frigobar" },
      { id: "geladeira", label: "Geladeira" },
      { id: "microondas", label: "Micro-ondas" },
      { id: "cafeteira", label: "Cafeteira elétrica" },
      { id: "chaleira", label: "Chaleira elétrica" },
      { id: "fogao", label: "Fogão / cooktop" },
      { id: "utensilios", label: "Utensílios de cozinha" },
    ],
  },
  {
    group: "Vista da Acomodação",
    items: [
      { id: "vistaMar", label: "Vista para o mar" },
      { id: "vistaPiscina", label: "Vista para a piscina" },
      { id: "vistaJardim", label: "Vista para jardim" },
      { id: "vistaMontanha", label: "Vista para a montanha" },
      { id: "vistaRio", label: "Vista para o rio" },
      { id: "vistaCidade", label: "Vista para a cidade" },
    ],
  },
  {
    group: "Amenities & Higiene",
    items: [
      { id: "sabonete", label: "Sabonete" },
      { id: "shampoo", label: "Shampoo" },
      { id: "condicionador", label: "Condicionador" },
      { id: "kitDental", label: "Kit dental" },
      { id: "chinelo", label: "Chinelos cortesia" },
      { id: "roupao", label: "Roupão de banho" },
    ],
  },
  {
    group: "Acessibilidade no Quarto",
    items: [
      { id: "terreo", label: "Quarto no térreo (sem escadas)" },
      { id: "barras", label: "Barras de apoio no banheiro" },
      { id: "portaLarga", label: "Portas largas para cadeira de rodas" },
    ],
  },
];

export function Mod06AmenitiesMatrix({
  data,
  onChange,
}: {
  data: ChecklistData;
  meta: FieldMetaRecord;
  onChange: (patch: Partial<ChecklistData>) => void;
  onMetaChange: (fieldKey: string, val: any) => void;
}) {
  const comodidades = data.comodidades ?? {};
  const categorias = data.categorias ?? [];

  function setScope(itemId: string, escopo: "todas" | "algumas" | "nenhuma") {
    const cur = comodidades[itemId] ?? { escopo: "nenhuma", categoriasIds: [] };
    onChange({
      comodidades: {
        ...comodidades,
        [itemId]: {
          ...cur,
          escopo,
          // If switching to todas, optionally clear specific ids
          categoriasIds: escopo === "todas" ? [] : cur.categoriasIds ?? [],
        },
      },
    });
  }

  function toggleCategoryForAmenity(itemId: string, catId: string) {
    const cur = comodidades[itemId] ?? { escopo: "algumas", categoriasIds: [] };
    const currentIds = cur.categoriasIds ?? [];
    const nextIds = currentIds.includes(catId)
      ? currentIds.filter((id) => id !== catId)
      : [...currentIds, catId];

    onChange({
      comodidades: {
        ...comodidades,
        [itemId]: {
          ...cur,
          escopo: "algumas",
          categoriasIds: nextIds,
        },
      },
    });
  }

  function updateAmenityDet(itemId: string, det: string) {
    const cur = comodidades[itemId] ?? { escopo: "todas", categoriasIds: [] };
    onChange({
      comodidades: {
        ...comodidades,
        [itemId]: {
          ...cur,
          det,
        },
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-line-subtle pb-3">
        <h3 className="text-sm font-semibold text-ink">Matriz de Comodidades dos Quartos</h3>
        <p className="text-xs text-ink-secondary">
          Defina de forma rápida o que está presente em todas as acomodações, em algumas específicas ou em nenhuma.
          Ao marcar &quot;Algumas&quot;, selecione quais quartos possuem a comodidade.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {AMENITY_GROUPS.map((grp) => (
          <div key={grp.group} className="flex flex-col gap-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{grp.group}</h4>
            <div className="flex flex-col divide-y divide-line-subtle rounded-lg border border-line-subtle bg-surface overflow-hidden">
              {grp.items.map((item) => {
                const cur = comodidades[item.id] ?? { escopo: "nenhuma", categoriasIds: [] };
                const isSome = cur.escopo === "algumas";

                return (
                  <div key={item.id} className="flex flex-col px-3 py-2.5 transition-colors">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-ink">{item.label}</span>
                        {item.hint && (
                          <span className="text-[11px] text-ink-muted">{item.hint}</span>
                        )}
                      </div>

                      <div className="flex rounded-md border border-line-subtle bg-surface-muted/50 p-0.5">
                        {(
                          [
                            ["todas", "Todas"],
                            ["algumas", "Algumas"],
                            ["nenhuma", "Nenhuma"],
                          ] as const
                        ).map(([sc, label]) => (
                          <button
                            key={sc}
                            type="button"
                            onClick={() => setScope(item.id, sc)}
                            className={cn(
                              "rounded px-3 py-1 text-xs font-medium transition-colors cursor-pointer border",
                              cur.escopo === sc
                                ? "bg-cyan-fact/20 text-ink font-semibold border-cyan-fact"
                                : "text-ink-secondary border-transparent hover:text-ink"
                            )}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sub-container quando 'Algumas' está selecionado */}
                    {isSome && (
                      <div className="mt-2.5 rounded-md border border-line-subtle/80 bg-surface-muted/40 p-2.5 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">
                            Quais acomodações possuem {item.label.toLowerCase()}?
                          </span>
                          {categorias.length > 0 && (
                            <span className="text-[11px] text-ink-muted">
                              {(cur.categoriasIds || []).length} de {categorias.length} selecionada(s)
                            </span>
                          )}
                        </div>

                        {categorias.length === 0 ? (
                          <div className="flex items-center gap-2 rounded bg-amber-500/10 p-2 text-xs text-amber-300 border border-amber-500/20">
                            <AlertCircle className="size-4 shrink-0" />
                            <span>
                              Nenhuma categoria cadastrada no <strong>Módulo 05 (Acomodações)</strong> ainda.
                              Cadastre as acomodações lá primeiro para vinculá-las aqui.
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {categorias.map((cat) => {
                              const checked = (cur.categoriasIds || []).includes(cat.id);
                              return (
                                <label
                                  key={cat.id}
                                  className={cn(
                                    "flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs cursor-pointer select-none transition-colors",
                                    checked
                                      ? "border-cyan-fact bg-cyan-fact/15 text-ink font-medium"
                                      : "border-line-subtle bg-surface text-ink-secondary hover:border-line-medium"
                                  )}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleCategoryForAmenity(item.id, cat.id)}
                                    className="size-3.5 rounded accent-cyan-fact"
                                  />
                                  <span>{cat.nome || "Categoria sem nome"}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Especificação / detalhe da comodidade (ex.: voltagem, tipo, tamanho) */}
                    {cur.escopo !== "nenhuma" && (
                      <div className="mt-2 pt-1 border-t border-line-subtle/30">
                        <input
                          type="text"
                          value={cur.det ?? ""}
                          onChange={(e) => updateAmenityDet(item.id, e.target.value)}
                          placeholder={
                            item.hint
                              ? `Observações / especificações (Ex.: ${item.hint})`
                              : "Observações, especificações ou regras deste item (opcional)"
                          }
                          className="w-full rounded border border-line-subtle bg-surface-muted/30 px-2.5 py-1 text-xs text-ink placeholder:text-ink-muted/60 focus:border-cyan-fact focus:outline-none transition-colors"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
