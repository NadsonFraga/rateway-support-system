"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ImageUpload } from "@/features/assets/image-upload";
import type { ClientFields, NewServiceInput } from "../types";

export type FormOptions = {
  services: { id: string; name: string; kind: "pontual" | "continuo"; phases: string[] }[];
  channelManagers: { id: string; name: string }[];
  pmsList: { id: string; name: string }[];
};

export const EMPTY_FIELDS: ClientFields = {
  name: "",
  sigla: "",
  logoUrl: null,
  city: "",
  state: "",
  website: "",
  channelManagerId: null,
  pmsId: null,
  contactType: null,
  contactName: "",
  contactPhone: "",
  contactLink: "",
  financeName: "",
  financePhone: "",
  notice: "",
};

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 border-t border-line-subtle pt-4 first:border-t-0 first:pt-0">
      <legend className="mb-1 text-xs font-semibold tracking-[0.04em] text-ink-muted uppercase">{title}</legend>
      {children}
    </fieldset>
  );
}

/** Campos essenciais do cliente (clientes-design-v2.md 04.3). `disabled` = modo leitura. */
export function ClientFieldsForm({
  value,
  onChange,
  options,
  disabled,
  codePreview,
  editableSigla,
}: {
  value: ClientFields;
  onChange: (patch: Partial<ClientFields>) => void;
  options: FormOptions;
  disabled: boolean;
  codePreview?: string | null;
  editableSigla: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      <Group title="Identidade">
        <div className="grid grid-cols-[1fr_140px] gap-4">
          <Field label="Nome fantasia" htmlFor="cliente-nome">
            <Input id="cliente-nome" value={value.name} disabled={disabled} maxLength={120} autoFocus={editableSigla} onChange={(event) => onChange({ name: event.target.value })} />
          </Field>
          <Field
            label="Sigla"
            htmlFor="cliente-sigla"
            help={editableSigla ? (codePreview ? `Código: #${codePreview}` : "3 a 4 letras") : "O código não muda depois de criado."}
          >
            <Input
              id="cliente-sigla"
              value={value.sigla}
              disabled={disabled || !editableSigla}
              maxLength={4}
              className="font-mono uppercase"
              onChange={(event) => onChange({ sigla: event.target.value.toUpperCase().replace(/[^A-Z]/g, "") })}
            />
          </Field>
        </div>
        <ImageUpload label="Logo" value={value.logoUrl} onChange={(logoUrl) => !disabled && onChange({ logoUrl })} />
      </Group>

      <Group title="Localização e site">
        <div className="grid grid-cols-[1fr_90px] gap-4">
          <Field label="Cidade" htmlFor="cliente-cidade">
            <Input id="cliente-cidade" value={value.city} disabled={disabled} maxLength={80} onChange={(event) => onChange({ city: event.target.value })} />
          </Field>
          <Field label="UF" htmlFor="cliente-uf">
            <Input
              id="cliente-uf"
              value={value.state}
              disabled={disabled}
              maxLength={2}
              className="uppercase"
              onChange={(event) => onChange({ state: event.target.value.toUpperCase() })}
            />
          </Field>
        </div>
        <Field label="Site oficial ou motor de reservas" htmlFor="cliente-site">
          <Input id="cliente-site" type="url" placeholder="https://" value={value.website} disabled={disabled} onChange={(event) => onChange({ website: event.target.value })} />
        </Field>
      </Group>

      <Group title="Sistemas">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Channel Manager" htmlFor="cliente-cm">
            <Select
              id="cliente-cm"
              value={value.channelManagerId ?? ""}
              disabled={disabled}
              onChange={(event) => onChange({ channelManagerId: event.target.value || null })}
            >
              <option value="">Não informado</option>
              {options.channelManagers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="PMS" htmlFor="cliente-pms">
            <Select id="cliente-pms" value={value.pmsId ?? ""} disabled={disabled} onChange={(event) => onChange({ pmsId: event.target.value || null })}>
              <option value="">Não informado</option>
              {options.pmsList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Group>

      <Group title="Contato principal">
        <SegmentedControl<"pessoa" | "grupo" | "nenhum">
          label="Tipo de contato principal"
          value={value.contactType ?? "nenhum"}
          onChange={(type) => !disabled && onChange({ contactType: type === "nenhum" ? null : type })}
          options={[
            { value: "nenhum", label: "Nenhum" },
            { value: "pessoa", label: "Pessoa" },
            { value: "grupo", label: "Grupo de WhatsApp" },
          ]}
        />
        {value.contactType && (
          <div className="grid grid-cols-2 gap-4">
            <Field label={value.contactType === "pessoa" ? "Nome" : "Nome do grupo"} htmlFor="cliente-contato-nome">
              <Input id="cliente-contato-nome" value={value.contactName} disabled={disabled} onChange={(event) => onChange({ contactName: event.target.value })} />
            </Field>
            {value.contactType === "pessoa" ? (
              <Field label="Telefone (com DDD)" htmlFor="cliente-contato-telefone">
                <Input
                  id="cliente-contato-telefone"
                  type="tel"
                  inputMode="tel"
                  value={value.contactPhone}
                  disabled={disabled}
                  onChange={(event) => onChange({ contactPhone: event.target.value })}
                />
              </Field>
            ) : (
              <Field label="Link de convite do grupo" htmlFor="cliente-contato-link">
                <Input
                  id="cliente-contato-link"
                  type="url"
                  placeholder="https://chat.whatsapp.com/"
                  value={value.contactLink}
                  disabled={disabled}
                  onChange={(event) => onChange({ contactLink: event.target.value })}
                />
              </Field>
            )}
          </div>
        )}
      </Group>

      <Group title="Contato financeiro">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nome" htmlFor="cliente-financeiro-nome">
            <Input id="cliente-financeiro-nome" value={value.financeName} disabled={disabled} onChange={(event) => onChange({ financeName: event.target.value })} />
          </Field>
          <Field label="WhatsApp (com DDD)" htmlFor="cliente-financeiro-telefone" help="Usado no botão Cobrar no WhatsApp.">
            <Input
              id="cliente-financeiro-telefone"
              type="tel"
              inputMode="tel"
              value={value.financePhone}
              disabled={disabled}
              onChange={(event) => onChange({ financePhone: event.target.value })}
            />
          </Field>
        </div>
      </Group>

      <Group title="Aviso importante">
        <Field label="Aviso" htmlFor="cliente-aviso" help="Aparece numa faixa no topo da ficha. Deixe vazio para não mostrar.">
          <Input id="cliente-aviso" value={value.notice} disabled={disabled} maxLength={300} onChange={(event) => onChange({ notice: event.target.value })} />
        </Field>
      </Group>
    </div>
  );
}

/** Serviços iniciais do cliente novo: serviço, fase e vencimento. */
export function InitialServicesForm({
  value,
  onChange,
  options,
}: {
  value: NewServiceInput[];
  onChange: (value: NewServiceInput[]) => void;
  options: FormOptions;
}) {
  function update(index: number, patch: Partial<NewServiceInput>) {
    onChange(value.map((item, position) => (position === index ? { ...item, ...patch } : item)));
  }

  return (
    <Group title="Serviços contratados">
      {value.map((item, index) => {
        const service = options.services.find((entry) => entry.id === item.serviceId);
        return (
          <div key={index} className="grid grid-cols-[1fr_1fr_150px_32px] items-end gap-3">
            <Field label="Serviço" htmlFor={`servico-${index}`}>
              <Select
                id={`servico-${index}`}
                value={item.serviceId}
                onChange={(event) => {
                  const next = options.services.find((entry) => entry.id === event.target.value);
                  update(index, { serviceId: event.target.value, phase: next?.phases[0] ?? "", billingDay: null, dueDate: null });
                }}
              >
                {options.services.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Fase" htmlFor={`fase-${index}`}>
              <Select id={`fase-${index}`} value={item.phase} onChange={(event) => update(index, { phase: event.target.value })}>
                {service?.phases.map((phase) => (
                  <option key={phase} value={phase}>
                    {phase}
                  </option>
                ))}
              </Select>
            </Field>
            {service?.kind === "continuo" ? (
              <Field label="Dia do vencimento" htmlFor={`vencimento-${index}`}>
                <Input
                  id={`vencimento-${index}`}
                  type="number"
                  min={1}
                  max={31}
                  value={item.billingDay ?? ""}
                  onChange={(event) => update(index, { billingDay: event.target.value ? Number(event.target.value) : null })}
                />
              </Field>
            ) : (
              <Field label="Vencimento" htmlFor={`vencimento-${index}`}>
                <Input id={`vencimento-${index}`} type="date" value={item.dueDate ?? ""} onChange={(event) => update(index, { dueDate: event.target.value || null })} />
              </Field>
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remover serviço ${index + 1}`}
              disabled={value.length === 1}
              onClick={() => onChange(value.filter((_, position) => position !== index))}
            >
              <Trash2 />
            </Button>
          </div>
        );
      })}
      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        onClick={() => {
          const first = options.services[0];
          onChange([...value, { serviceId: first.id, phase: first.phases[0], billingDay: null, dueDate: null }]);
        }}
      >
        <Plus /> Adicionar serviço
      </Button>
    </Group>
  );
}
