"use client";

import * as React from "react";
import { Plus, Trash2, Folder, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldWrapper, FormSection } from "../components/field-wrapper";
import type { ChecklistData, FieldMetaRecord, CompetitiveDiff } from "../types";
import { cn } from "@/lib/utils";

const TARGET_AUDIENCES = [
  "Famílias",
  "Casais",
  "Peregrinos / turismo religioso",
  "Pescadores",
  "Viagem a trabalho",
  "Viajantes de passagem",
  "Grupos",
  "Aventura / ecoturismo",
  "Com pets",
];

export function Mod10MediaCopywriting({
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
  const diferenciais = data.diferenciais ?? [];
  const publico = data.publico ?? data.publicos ?? [];

  function toggleAudience(item: string) {
    const next = publico.includes(item) ? publico.filter((a) => a !== item) : [...publico, item];
    onChange({ publico: next, publicos: next });
  }

  function addDiff() {
    if (diferenciais.length >= 5) return;
    const novo: CompetitiveDiff = {
      id: crypto.randomUUID(),
      titulo: "",
      texto: "",
    };
    onChange({ diferenciais: [...diferenciais, novo] });
  }

  function updateDiff(index: number, patch: Partial<CompetitiveDiff>) {
    const updated = diferenciais.map((d, i) => (i === index ? { ...d, ...patch } : d));
    onChange({ diferenciais: updated });
  }

  function removeDiff(index: number) {
    onChange({ diferenciais: diferenciais.filter((_, i) => i !== index) });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Fotos & Google Drive */}
      <FormSection title="Acervo de Fotos (Google Drive)">
        <FieldWrapper
          label="Pasta Mãe no Google Drive (Acervo Geral de Fotos)"
          fieldKey="drivePastaGeral"
          hint="Cole o link da pasta do Google Drive compartilhada contendo todas as fotos"
          meta={meta.drivePastaGeral ?? meta.linkGeral}
          onMetaChange={onMetaChange}
          isFilled={!!(data.drivePastaGeral || data.linkGeral)}
        >
          <Input
            value={data.drivePastaGeral ?? data.linkGeral ?? ""}
            onChange={(e) =>
              onChange({ drivePastaGeral: e.target.value, linkGeral: e.target.value })
            }
            placeholder="https://drive.google.com/drive/folders/..."
          />
        </FieldWrapper>
      </FormSection>

      {/* Descrições da Propriedade */}
      <FormSection title="Descrições Comerciais da Propriedade">
        <FieldWrapper
          label="Sobre a Propriedade (Resumo Curto de Busca)"
          fieldKey="descCurta"
          hint="Resumo para listagens e cards de busca (até 500 caracteres)"
          meta={meta.descCurta ?? meta.sobreCurto}
          onMetaChange={onMetaChange}
          isFilled={!!(data.descCurta || data.sobreCurto)}
        >
          <textarea
            value={data.descCurta ?? data.sobreCurto ?? ""}
            onChange={(e) =>
              onChange({ descCurta: e.target.value, sobreCurto: e.target.value })
            }
            placeholder="Apresentação curta e direta para cards de busca nas plataformas..."
            rows={2}
            maxLength={500}
            className="f resize-y w-full"
          />
        </FieldWrapper>

        <FieldWrapper
          label="Sobre a Propriedade (Apresentação Completa Institucional)"
          fieldKey="descLonga"
          hint="Texto descritivo completo para Booking e Airbnb"
          meta={meta.descLonga ?? meta.sobreLongo}
          onMetaChange={onMetaChange}
          isFilled={!!(data.descLonga || data.sobreLongo)}
        >
          <textarea
            value={data.descLonga ?? data.sobreLongo ?? ""}
            onChange={(e) =>
              onChange({ descLonga: e.target.value, sobreLongo: e.target.value })
            }
            placeholder="Texto completo sobre a pousada, história, ambiente e conforto..."
            rows={4}
            className="f resize-y w-full"
          />
        </FieldWrapper>

        <FieldWrapper
          label="O Espaço (Padrão Airbnb)"
          fieldKey="oEspaco"
          optional
          hint="Estrutura, arquitetura e estilo do espaço"
          meta={meta.oEspaco ?? meta.espaco}
          onMetaChange={onMetaChange}
          isFilled={!!(data.oEspaco || data.espaco)}
        >
          <textarea
            value={data.oEspaco ?? data.espaco ?? ""}
            onChange={(e) =>
              onChange({ oEspaco: e.target.value, espaco: e.target.value })
            }
            placeholder="Como é a propriedade, iluminação, decoração e conforto..."
            rows={2}
            className="f resize-y w-full"
          />
        </FieldWrapper>

        <FieldWrapper
          label="O que o hóspede pode acessar"
          fieldKey="acessoHospede"
          optional
          hint="Áreas livres para circulação e áreas restritas"
          meta={meta.acessoHospede}
          onMetaChange={onMetaChange}
          isFilled={!!data.acessoHospede}
        >
          <textarea
            value={data.acessoHospede ?? ""}
            onChange={(e) => onChange({ acessoHospede: e.target.value })}
            placeholder="Piscina, quiosque, restaurante, estacionamento..."
            rows={2}
            className="f resize-y w-full"
          />
        </FieldWrapper>

        <FieldWrapper
          label="O Bairro / A Vizinhança"
          fieldKey="vizinhanca"
          optional
          hint="Segurança, atmosfera local, comércio e tranquilidade"
          meta={meta.vizinhanca}
          onMetaChange={onMetaChange}
          isFilled={!!data.vizinhanca}
        >
          <textarea
            value={data.vizinhanca ?? ""}
            onChange={(e) => onChange({ vizinhanca: e.target.value })}
            placeholder="Tranquilidade do bairro, distância para praia ou centro..."
            rows={2}
            className="f resize-y w-full"
          />
        </FieldWrapper>

        <FieldWrapper
          label="Como chegar e se locomover"
          fieldKey="locomover"
          optional
          hint="Dicas práticas de deslocamento (Uber, táxi, caminhadas)"
          meta={meta.locomover}
          onMetaChange={onMetaChange}
          isFilled={!!data.locomover}
        >
          <textarea
            value={data.locomover ?? ""}
            onChange={(e) => onChange({ locomover: e.target.value })}
            placeholder="Facilidade de transporte, estacionamento ou vias de acesso..."
            rows={2}
            className="f resize-y w-full"
          />
        </FieldWrapper>

        <FieldWrapper
          label="Outras Informações Importantes"
          fieldKey="outrasInfo"
          optional
          hint="Voltagem (110V/220V), sinal de celular, regras locais"
          meta={meta.outrasInfo}
          onMetaChange={onMetaChange}
          isFilled={!!data.outrasInfo}
        >
          <textarea
            value={data.outrasInfo ?? ""}
            onChange={(e) => onChange({ outrasInfo: e.target.value })}
            placeholder="Avisos essenciais antes da chegada do hóspede..."
            rows={2}
            className="f resize-y w-full"
          />
        </FieldWrapper>
      </FormSection>

      {/* Posicionamento & Diferenciais */}
      <FormSection title="Posicionamento & Público-Alvo">
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-ink">Diferenciais Competitivos</span>
              <span className="text-[11px] text-ink-muted">
                Até 5 argumentos fortes que fazem o cliente escolher essa pousada.
              </span>
            </div>
            {diferenciais.length < 5 && (
              <Button variant="ghost" size="sm" onClick={addDiff} className="h-7 text-xs cursor-pointer">
                <Plus className="mr-1 size-3.5" /> Adicionar diferencial
              </Button>
            )}
          </div>

          {diferenciais.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line-subtle p-3 text-center text-xs text-ink-secondary">
              Nenhum diferencial cadastrado.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {diferenciais.map((d, idx) => (
                <div key={d.id} className="flex flex-col gap-2 rounded-lg border border-line-subtle bg-surface-muted/40 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <Input
                      value={d.titulo}
                      onChange={(e) => updateDiff(idx, { titulo: e.target.value })}
                      placeholder="Título do diferencial (ex.: Pé na areia, Café artesanal premiado)"
                      className="font-medium"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDiff(idx)}
                      className="size-7 text-ink-muted hover:text-feedback-danger shrink-0 cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  <textarea
                    value={d.texto}
                    onChange={(e) => updateDiff(idx, { texto: e.target.value })}
                    placeholder="Descrição detalhada do diferencial..."
                    rows={2}
                    className="f resize-y w-full"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-line-subtle">
          <FieldWrapper
            label="Públicos-alvo prioritários"
            fieldKey="publicos"
            optional
            meta={meta.publicos ?? meta.publico}
            onMetaChange={onMetaChange}
            isFilled={publico.length > 0}
          >
            <div className="flex flex-wrap gap-1.5">
              {TARGET_AUDIENCES.map((aud) => {
                const active = publico.includes(aud);
                return (
                  <button
                    key={aud}
                    type="button"
                    onClick={() => toggleAudience(aud)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer border",
                      active
                        ? "border-cyan-fact bg-cyan-fact/20 text-ink font-semibold"
                        : "border-line-subtle bg-input-bg text-ink-muted hover:text-ink hover:border-line-medium"
                    )}
                  >
                    {aud}
                  </button>
                );
              })}
            </div>
          </FieldWrapper>

          <FieldWrapper
            label="Outro público-alvo"
            fieldKey="publicoOutro"
            optional
            meta={meta.publicoOutro}
            onMetaChange={onMetaChange}
            isFilled={!!data.publicoOutro}
          >
            <Input
              value={data.publicoOutro ?? ""}
              onChange={(e) => onChange({ publicoOutro: e.target.value })}
              placeholder="Ex.: Praticantes de Kitesurf, Observadores de aves..."
            />
          </FieldWrapper>
        </div>
      </FormSection>
    </div>
  );
}
