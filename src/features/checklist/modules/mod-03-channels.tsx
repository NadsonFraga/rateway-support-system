"use client";

import * as React from "react";
import { Plus, Trash2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldWrapper, FormSection } from "../components/field-wrapper";
import type { ChecklistData, FieldMetaRecord, OtherChannelItem } from "../types";
import { cn } from "@/lib/utils";

const STANDARD_CHANNELS = [
  { id: "booking", name: "Booking.com" },
  { id: "airbnb", name: "Airbnb" },
  { id: "expedia", name: "Expedia" },
  { id: "decolar", name: "Decolar" },
  { id: "google", name: "Google Hotel Ads / Meu Negócio" },
  { id: "trivago", name: "Trivago" },
  { id: "tripadvisor", name: "TripAdvisor" },
];

export function Mod03Channels({
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
  const canais = data.canais ?? {};
  const outrosCanais = data.outrosCanais ?? [];
  const usaFoco = data.usaFoco ?? true;

  function updateChannel(
    channelId: string,
    patch: Partial<{ status: "possui" | "a_cadastrar" | "nao_contratado"; link?: string; idProp?: string; obs?: string }>
  ) {
    const current = canais[channelId] ?? { status: "nao_contratado" };
    onChange({
      canais: {
        ...canais,
        [channelId]: { ...current, ...patch },
      },
    });
  }

  function addOtherChannel() {
    const novo: OtherChannelItem = {
      id: crypto.randomUUID(),
      nome: "",
      situacao: "possui",
      linkId: "",
      obs: "",
    };
    onChange({ outrosCanais: [...outrosCanais, novo] });
  }

  function updateOtherChannel(index: number, patch: Partial<OtherChannelItem>) {
    const updated = outrosCanais.map((it, i) => (i === index ? { ...it, ...patch } : it));
    onChange({ outrosCanais: updated });
  }

  function removeOtherChannel(index: number) {
    onChange({ outrosCanais: outrosCanais.filter((_, i) => i !== index) });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Canais de Venda */}
      <FormSection title="Canais de Venda Trabalhados">
        <div className="p-4 flex flex-col gap-3">
          <p className="text-xs text-ink-muted">
            Marque a situação cadastral de cada canal para que a equipe saiba o que revisar ou cadastrar.
          </p>
          <div className="flex flex-col gap-2.5">
            {STANDARD_CHANNELS.map((ch) => {
              const item = canais[ch.id] ?? { status: "nao_contratado" };
              const isContracted = item.status === "possui" || item.status === "a_cadastrar";

              return (
                <div key={ch.id} className="flex flex-col gap-2.5 rounded-lg border border-line-subtle bg-surface-muted/40 p-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-sm font-medium text-ink">{ch.name}</span>
                    <div className="flex rounded-md border border-line-subtle bg-surface p-0.5">
                      {(
                        [
                          ["possui", "Já possui"],
                          ["a_cadastrar", "Revisão / Cadastro"],
                          ["nao_contratado", "Não contratado"],
                        ] as const
                      ).map(([st, label]) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => updateChannel(ch.id, { status: st })}
                          className={cn(
                            "rounded px-2.5 py-1 text-xs font-medium transition-colors border cursor-pointer",
                            item.status === st
                              ? "bg-cyan-fact/20 text-ink font-semibold border-cyan-fact"
                              : "text-ink-secondary border-transparent hover:text-ink"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {isContracted && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 border-t border-line-subtle pt-2.5">
                      <Input
                        value={item.link ?? ""}
                        onChange={(e) => updateChannel(ch.id, { link: e.target.value })}
                        placeholder="Link do anúncio"
                      />
                      <Input
                        value={item.idProp ?? ""}
                        onChange={(e) => updateChannel(ch.id, { idProp: e.target.value })}
                        placeholder="ID no canal"
                      />
                      <Input
                        value={item.obs ?? ""}
                        onChange={(e) => updateChannel(ch.id, { obs: e.target.value })}
                        placeholder="Acessos / Observações"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </FormSection>

      {/* Outros Canais Secundários */}
      <FormSection title="Outros Canais">
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-muted">
              Canais adicionais como agências regionais, CVC, Despegar, etc.
            </p>
            <Button variant="ghost" size="sm" onClick={addOtherChannel} className="h-7 text-xs">
              <Plus className="mr-1 size-3.5" /> Adicionar canal
            </Button>
          </div>

          {outrosCanais.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line-subtle p-3 text-center text-xs text-ink-secondary">
              Nenhum outro canal cadastrado.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {outrosCanais.map((oc, idx) => (
                <div key={oc.id} className="grid grid-cols-1 sm:grid-cols-[140px_160px_1fr_1fr_auto] items-center gap-2 rounded-lg border border-line-subtle bg-surface-muted/40 p-2.5">
                  <Input
                    value={oc.nome}
                    onChange={(e) => updateOtherChannel(idx, { nome: e.target.value })}
                    placeholder="Nome do canal"
                  />
                  <div className="flex rounded border border-line-subtle bg-surface p-0.5">
                    {(
                      [
                        ["possui", "Já possui"],
                        ["a_cadastrar", "Revisão/Cad."],
                        ["nao_contratado", "Não contr."],
                      ] as const
                    ).map(([st, label]) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => updateOtherChannel(idx, { situacao: st })}
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors cursor-pointer",
                          oc.situacao === st
                            ? "bg-cyan-fact/20 text-ink font-semibold"
                            : "text-ink-secondary hover:text-ink"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <Input
                    value={oc.linkId ?? ""}
                    onChange={(e) => updateOtherChannel(idx, { linkId: e.target.value })}
                    placeholder="Link ou ID do canal"
                  />
                  <Input
                    value={oc.obs ?? ""}
                    onChange={(e) => updateOtherChannel(idx, { obs: e.target.value })}
                    placeholder="Acessos / Observações"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOtherChannel(idx)}
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

      {/* Channel Manager & PMS */}
      <FormSection title="Sistemas (Channel Manager & PMS)">
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-ink">Utiliza o ecossistema FOCO?</span>
              <span className="text-xs text-ink-muted">
                A Rateway possui integração e gestão nativa com a FOCO.
              </span>
            </div>
            <div className="flex rounded-md border border-line-subtle bg-surface p-0.5">
              <button
                type="button"
                onClick={() => onChange({ usaFoco: true })}
                className={cn(
                  "rounded px-3 py-1 text-xs font-medium transition-colors border cursor-pointer",
                  usaFoco
                    ? "bg-cyan-fact/20 text-ink font-semibold border-cyan-fact"
                    : "text-ink-secondary border-transparent hover:text-ink"
                )}
              >
                Sim (FOCO)
              </button>
              <button
                type="button"
                onClick={() => onChange({ usaFoco: false })}
                className={cn(
                  "rounded px-3 py-1 text-xs font-medium transition-colors border cursor-pointer",
                  !usaFoco
                    ? "bg-cyan-fact/20 text-ink font-semibold border-cyan-fact"
                    : "text-ink-secondary border-transparent hover:text-ink"
                )}
              >
                Outro sistema
              </button>
            </div>
          </div>
        </div>

        {!usaFoco && (
          <div className="border-t border-line-subtle flex flex-col">
            <FieldWrapper
              label="Channel Manager"
              fieldKey="cmNome"
              meta={meta.cmNome}
              onMetaChange={onMetaChange}
              isFilled={!!(data.cmNome || data.channelManagerOutro)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  value={data.cmNome ?? data.channelManagerOutro ?? ""}
                  onChange={(e) =>
                    onChange({
                      cmNome: e.target.value,
                      channelManagerOutro: e.target.value,
                    })
                  }
                  placeholder="Nome do Channel Manager (ex.: Cloudbeds, Omnibees)"
                />
                <Input
                  value={data.cmObs ?? ""}
                  onChange={(e) => onChange({ cmObs: e.target.value })}
                  placeholder="Acessos / Observações"
                />
              </div>
            </FieldWrapper>

            <FieldWrapper
              label="PMS"
              fieldKey="pmsNome"
              meta={meta.pmsNome}
              onMetaChange={onMetaChange}
              isFilled={!!(data.pmsNome || data.pmsOutro)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  value={data.pmsNome ?? data.pmsOutro ?? ""}
                  onChange={(e) =>
                    onChange({
                      pmsNome: e.target.value,
                      pmsOutro: e.target.value,
                    })
                  }
                  placeholder="Nome do PMS (ex.: Desbravador, Hospedin)"
                />
                <Input
                  value={data.pmsObs ?? ""}
                  onChange={(e) => onChange({ pmsObs: e.target.value })}
                  placeholder="Acessos / Observações"
                />
              </div>
            </FieldWrapper>
          </div>
        )}

        <div className="border-t border-line-subtle">
          <FieldWrapper
            label="Site da propriedade"
            fieldKey="sitePropriedade"
            optional
            hint="URL oficial do site da propriedade"
            meta={meta.sitePropriedade}
            onMetaChange={onMetaChange}
            isFilled={!!(data.sitePropriedade || data.motorReservasLink || data.site)}
          >
            <Input
              value={data.sitePropriedade ?? data.motorReservasLink ?? data.site ?? ""}
              onChange={(e) =>
                onChange({
                  sitePropriedade: e.target.value,
                  motorReservasLink: e.target.value,
                  site: e.target.value,
                })
              }
              placeholder="https://www.propriedade.com.br"
            />
          </FieldWrapper>
        </div>
      </FormSection>
    </div>
  );
}
