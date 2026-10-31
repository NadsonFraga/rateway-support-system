"use client";

import * as React from "react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { SaveState } from "@/components/ui/save-button";
import { addClientService, loadClientFormOptions, updateClientService } from "../actions";
import type { FormOptions } from "../components/client-form";
import { RecordDialog } from "../components/record-dialog";
import type { ClientServiceView, NewServiceInput } from "../types";

type Draft = { phase: string; billingDay: number | null; dueDate: string | null };

function BillingField({
  kind,
  value,
  disabled,
  onChange,
  id,
  help,
}: {
  kind: "pontual" | "continuo";
  value: Draft;
  disabled: boolean;
  onChange: (patch: Partial<Draft>) => void;
  id: string;
  help?: string;
}) {
  return kind === "continuo" ? (
    <Field label="Dia do vencimento" htmlFor={id} help={help}>
      <Input
        id={id}
        type="number"
        min={1}
        max={31}
        value={value.billingDay ?? ""}
        disabled={disabled}
        onChange={(event) => onChange({ billingDay: event.target.value ? Number(event.target.value) : null })}
      />
    </Field>
  ) : (
    <Field label="Data de vencimento" htmlFor={id} help={help}>
      <Input id={id} type="date" value={value.dueDate ?? ""} disabled={disabled} onChange={(event) => onChange({ dueDate: event.target.value || null })} />
    </Field>
  );
}

/** Serviço do cliente (trava "servico"): fase por Administrador e Analista (D-90), vencimento só Administrador (D-40). */
export function ServiceDialog({ item, onClose, canEditBilling }: { item: ClientServiceView; onClose: () => void; canEditBilling: boolean }) {
  const saved = React.useMemo<Draft>(() => ({ phase: item.phase, billingDay: item.billingDay, dueDate: item.dueDate }), [item]);
  const [draft, setDraft] = React.useState<Draft>(saved);
  const [saveState, setSaveState] = React.useState<SaveState>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  async function save() {
    setSaveState("saving");
    setError(null);
    const result = await updateClientService(item.id, draft);
    if (!result.ok) {
      setSaveState("idle");
      setError(result.error);
      return false;
    }
    setSaveState("saved");
    window.setTimeout(onClose, 600);
    return true;
  }

  return (
    <RecordDialog
      open
      onClose={onClose}
      title={item.serviceName}
      lock={{ entityType: "servico", entityId: item.id }}
      canEdit
      dirty={dirty}
      saveState={saveState}
      error={error}
      onSave={save}
      onDiscard={() => {
        setDraft(saved);
        setError(null);
      }}
    >
      {({ editing, markActivity }) => {
        const value = editing ? draft : saved;
        const patch = (next: Partial<Draft>) => {
          setDraft((current) => ({ ...current, ...next }));
          markActivity();
        };
        return (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Fase" htmlFor="servico-fase">
              <Select id="servico-fase" value={value.phase} disabled={!editing} onChange={(event) => patch({ phase: event.target.value })}>
                {item.phases.map((phase) => (
                  <option key={phase} value={phase}>
                    {phase}
                  </option>
                ))}
              </Select>
            </Field>
            <BillingField
              id="servico-vencimento"
              kind={item.kind}
              value={value}
              disabled={!editing || !canEditBilling}
              onChange={patch}
              help={canEditBilling ? undefined : "Só o Administrador muda o vencimento."}
            />
          </div>
        );
      }}
    </RecordDialog>
  );
}

/** Contratar serviço (só Administrador, D-40). */
export function AddServiceDialog({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const [options, setOptions] = React.useState<FormOptions | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    void loadClientFormOptions().then((value) => !cancelled && setOptions(value));
    return () => {
      cancelled = true;
    };
  }, []);
  return options ? <AddServiceInner clientId={clientId} options={options} onClose={onClose} /> : null;
}

function AddServiceInner({ clientId, options, onClose }: { clientId: string; options: FormOptions; onClose: () => void }) {
  const [draft, setDraft] = React.useState<NewServiceInput>(() => ({
    serviceId: options.services[0].id,
    phase: options.services[0].phases[0],
    billingDay: null,
    dueDate: null,
  }));
  const [saveState, setSaveState] = React.useState<SaveState>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const service = options.services.find((entry) => entry.id === draft.serviceId) ?? options.services[0];

  async function save() {
    setSaveState("saving");
    setError(null);
    const result = await addClientService(clientId, draft);
    if (!result.ok) {
      setSaveState("idle");
      setError(result.error);
      return false;
    }
    setSaveState("saved");
    return true;
  }

  return (
    <RecordDialog
      open
      onClose={onClose}
      title="Adicionar serviço"
      lock={null}
      canEdit
      dirty
      saveState={saveState}
      error={error}
      onSave={save}
      onDiscard={() => undefined}
      saveLabel="Adicionar"
    >
      {() => (
        <div className="grid grid-cols-3 gap-4">
          <Field label="Serviço" htmlFor="novo-servico">
            <Select
              id="novo-servico"
              value={draft.serviceId}
              onChange={(event) => {
                const next = options.services.find((entry) => entry.id === event.target.value);
                setDraft({ serviceId: event.target.value, phase: next?.phases[0] ?? "", billingDay: null, dueDate: null });
                setError(null);
              }}
            >
              {options.services.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fase" htmlFor="novo-servico-fase">
            <Select id="novo-servico-fase" value={draft.phase} onChange={(event) => setDraft({ ...draft, phase: event.target.value })}>
              {service.phases.map((phase) => (
                <option key={phase} value={phase}>
                  {phase}
                </option>
              ))}
            </Select>
          </Field>
          <BillingField id="novo-servico-vencimento" kind={service.kind} value={draft} disabled={false} onChange={(patch) => setDraft({ ...draft, ...patch })} />
        </div>
      )}
    </RecordDialog>
  );
}
