"use client";

import * as React from "react";
import { Plus, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FieldWrapper, FormSection } from "../components/field-wrapper";
import type { ChecklistData, FieldMetaRecord, PointOfInterest } from "../types";

const TIPOS_PONTO = [
  "Atrativo turístico",
  "Restaurante",
  "Mercado",
  "Farmácia",
  "Hospital",
  "Praça / centro",
  "Rota / caminho",
  "Transporte",
  "Outro",
];

export function Mod09LocationSurroundings({
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
  const pontos = data.pontos ?? [];

  function addPoint() {
    const novo: PointOfInterest = {
      id: crypto.randomUUID(),
      nome: "",
      tipo: "Atrativo turístico",
      dist: "",
    };
    onChange({ pontos: [...pontos, novo] });
  }

  function updatePoint(index: number, patch: Partial<PointOfInterest>) {
    const updated = pontos.map((p, i) => (i === index ? { ...p, ...patch } : p));
    onChange({ pontos: updated });
  }

  function removePoint(index: number) {
    onChange({ pontos: pontos.filter((_, i) => i !== index) });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Pontos de interesse */}
      <FormSection title="Pontos de Interesse Próximos">
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-muted">
              Praias, cachoeiras, restaurantes, mercados e atrativos locais para destaque nos anúncios.
            </p>
            <Button variant="ghost" size="sm" onClick={addPoint} className="h-7 text-xs cursor-pointer">
              <Plus className="mr-1 size-3.5" /> Adicionar ponto
            </Button>
          </div>

          {pontos.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line-subtle p-3 text-center text-xs text-ink-secondary">
              Nenhum ponto de interesse cadastrado. Adicione os destaques do entorno.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {pontos.map((p, idx) => (
                <div key={p.id} className="grid grid-cols-1 sm:grid-cols-[1fr_160px_160px_auto] items-center gap-2 rounded-lg border border-line-subtle bg-surface-muted/40 p-2.5">
                  <Input
                    value={p.nome}
                    onChange={(e) => updatePoint(idx, { nome: e.target.value })}
                    placeholder="Nome do local (ex.: Praia do Curral, Centro Histórico)"
                  />
                  <Select
                    value={p.tipo}
                    onChange={(e) => updatePoint(idx, { tipo: e.target.value })}
                  >
                    {TIPOS_PONTO.map((tp) => (
                      <option key={tp} value={tp}>
                        {tp}
                      </option>
                    ))}
                  </Select>
                  <Input
                    value={p.dist}
                    onChange={(e) => updatePoint(idx, { dist: e.target.value })}
                    placeholder="Distância (ex.: 200 m, 5 min a pé)"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePoint(idx)}
                    className="size-7 text-ink-muted hover:text-feedback-danger cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </FormSection>

      {/* Acessos e Terminais */}
      <FormSection title="Acessos, Terminais & Eventos">
        <FieldWrapper
          label="Aeroporto mais próximo"
          fieldKey="aeroportoNome"
          optional
          hint="Nome do aeroporto e distância/tempo"
          meta={meta.aeroportoNome ?? meta.aeroporto}
          onMetaChange={onMetaChange}
          isFilled={!!(data.aeroportoNome || data.aeroporto)}
        >
          <Input
            value={data.aeroportoNome ?? data.aeroporto ?? ""}
            onChange={(e) => onChange({ aeroportoNome: e.target.value, aeroporto: e.target.value })}
            placeholder="Ex.: Aeroporto de Congonhas (CGH) - 130 km / 2h30"
          />
        </FieldWrapper>

        <FieldWrapper
          label="Rodoviária mais próxima"
          fieldKey="rodoviariaNome"
          optional
          hint="Nome do terminal rodoviário e distância/tempo"
          meta={meta.rodoviariaNome ?? meta.rodoviaria}
          onMetaChange={onMetaChange}
          isFilled={!!(data.rodoviariaNome || data.rodoviaria)}
        >
          <Input
            value={data.rodoviariaNome ?? data.rodoviaria ?? ""}
            onChange={(e) => onChange({ rodoviariaNome: e.target.value, rodoviaria: e.target.value })}
            placeholder="Ex.: Rodoviária de Ubatuba - 5 km / 12 min"
          />
        </FieldWrapper>

        <FieldWrapper
          label="Rotas, caminhos e referências de acesso"
          fieldKey="rotas"
          optional
          hint="Rodovias, balsas, estradas de terra ou trechos sinuosos"
          meta={meta.rotas}
          onMetaChange={onMetaChange}
          isFilled={!!data.rotas}
        >
          <textarea
            value={data.rotas ?? ""}
            onChange={(e) => onChange({ rotas: e.target.value })}
            placeholder="Ex.: Acesso pela Rodovia Rio-Santos Km 23... seguir pela balsa..."
            rows={2}
            className="f resize-y w-full"
          />
        </FieldWrapper>

        <FieldWrapper
          label="Eventos locais recorrentes"
          fieldKey="eventos"
          optional
          hint="Festivais, feiras gastronômicas, datas fortes da região"
          meta={meta.eventos}
          onMetaChange={onMetaChange}
          isFilled={!!data.eventos}
        >
          <textarea
            value={data.eventos ?? ""}
            onChange={(e) => onChange({ eventos: e.target.value })}
            placeholder="Ex.: Festival da Tainha (julho), Réveillon, Carnaval..."
            rows={2}
            className="f resize-y w-full"
          />
        </FieldWrapper>
      </FormSection>
    </div>
  );
}
