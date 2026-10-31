"use client";

import * as React from "react";
import type { SaveState } from "@/components/ui/save-button";
import { createClient, loadClientFormOptions, previewClientCode, suggestCode, updateClient } from "./actions";
import { ClientFieldsForm, EMPTY_FIELDS, InitialServicesForm, type FormOptions } from "./components/client-form";
import { RecordDialog } from "./components/record-dialog";
import type { ClientDetail, ClientFields, NewServiceInput } from "./types";

function fieldsOf(client: ClientDetail): ClientFields {
  return {
    name: client.name,
    sigla: client.sigla,
    logoUrl: client.logoUrl,
    city: client.city ?? "",
    state: client.state ?? "",
    website: client.website,
    channelManagerId: client.channelManagerId,
    pmsId: client.pmsId,
    contactType: client.contactType,
    contactName: client.contactName,
    contactPhone: client.contactPhone,
    contactLink: client.contactLink,
    financeName: client.financeName,
    financePhone: client.financePhone,
    notice: client.notice,
  };
}

function useFormOptions(open: boolean) {
  const [options, setOptions] = React.useState<FormOptions | null>(null);
  React.useEffect(() => {
    if (!open || options) return;
    let cancelled = false;
    void loadClientFormOptions().then((value) => !cancelled && value && setOptions(value));
    return () => {
      cancelled = true;
    };
  }, [open, options]);
  return options;
}

/** Novo Cliente: sigla sugerida pelo nome (editável, D-74) e serviços iniciais. */
export function NewClientDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (code: string) => void }) {
  const options = useFormOptions(open);
  return open && options ? <NewClientInner options={options} onClose={onClose} onCreated={onCreated} /> : null;
}

function NewClientInner({ options, onClose, onCreated }: { options: FormOptions; onClose: () => void; onCreated: (code: string) => void }) {
  const [fields, setFields] = React.useState<ClientFields>(EMPTY_FIELDS);
  const [services, setServices] = React.useState<NewServiceInput[]>(() => {
    const first = options.services[0];
    return [{ serviceId: first.id, phase: first.phases[0], billingDay: null, dueDate: null }];
  });
  const [preview, setPreview] = React.useState<string | null>(null);
  const [saveState, setSaveState] = React.useState<SaveState>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const siglaTouched = React.useRef(false);

  // Sugere a sigla enquanto o nome é digitado (até a pessoa mexer na sigla).
  React.useEffect(() => {
    if (siglaTouched.current || fields.name.trim().length < 2) return;
    const timer = window.setTimeout(() => {
      void suggestCode(fields.name).then((value) => {
        if (!value || siglaTouched.current) return;
        setFields((current) => ({ ...current, sigla: value.sigla }));
        setPreview(value.sigla.length >= 3 ? value.preview : null);
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [fields.name]);

  React.useEffect(() => {
    if (!siglaTouched.current || fields.sigla.length < 3) return;
    let cancelled = false;
    void previewClientCode(fields.sigla).then((value) => !cancelled && setPreview(value));
    return () => {
      cancelled = true;
    };
  }, [fields.sigla]);

  async function save() {
    setSaveState("saving");
    setError(null);
    const result = await createClient(fields, services);
    if (!result.ok) {
      setSaveState("idle");
      setError(result.error);
      return false;
    }
    setSaveState("saved");
    onCreated(result.value.code);
    return true;
  }

  return (
    <RecordDialog
      open
      onClose={onClose}
      title="Novo cliente"
      lock={null}
      canEdit
      dirty={fields.name.trim().length > 0}
      saveState={saveState}
      error={error}
      onSave={save}
      onDiscard={() => setFields(EMPTY_FIELDS)}
      saveLabel="Criar cliente"
    >
      {() => (
        <div className="flex flex-col gap-5">
          <ClientFieldsForm
            value={fields}
            onChange={(patch) => {
              if ("sigla" in patch) siglaTouched.current = true;
              setFields((current) => ({ ...current, ...patch }));
              setError(null);
            }}
            options={options}
            disabled={false}
            codePreview={fields.sigla.length >= 3 ? preview : null}
            editableSigla
          />
          <InitialServicesForm value={services} onChange={setServices} options={options} />
        </div>
      )}
    </RecordDialog>
  );
}

/** Configurações do cliente (modal único de edição, 04.3): leitura → Editar com trava → Salvar. */
export function EditClientDialog({
  client,
  open,
  onClose,
  canEdit,
  onSaved,
}: {
  client: ClientDetail;
  open: boolean;
  onClose: () => void;
  canEdit: boolean;
  onSaved: (client: ClientDetail) => void;
}) {
  const options = useFormOptions(open);
  return open && options ? (
    <EditClientInner client={client} options={options} onClose={onClose} canEdit={canEdit} onSaved={onSaved} />
  ) : null;
}

function EditClientInner({
  client,
  options,
  onClose,
  canEdit,
  onSaved,
}: {
  client: ClientDetail;
  options: FormOptions;
  onClose: () => void;
  canEdit: boolean;
  onSaved: (client: ClientDetail) => void;
}) {
  const saved = React.useMemo(() => fieldsOf(client), [client]);
  const [fields, setFields] = React.useState<ClientFields>(saved);
  const [saveState, setSaveState] = React.useState<SaveState>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const dirty = JSON.stringify(fields) !== JSON.stringify(saved);

  async function save() {
    setSaveState("saving");
    setError(null);
    const result = await updateClient(client.id, fields);
    if (!result.ok) {
      setSaveState("idle");
      setError(result.error);
      return false;
    }
    setSaveState("saved");
    window.setTimeout(() => setSaveState("idle"), 1200);
    onSaved(result.value);
    return true;
  }

  return (
    <RecordDialog
      open
      onClose={onClose}
      title={`Configurações de ${client.name}`}
      lock={{ entityType: "cliente", entityId: client.id }}
      canEdit={canEdit}
      dirty={dirty}
      saveState={saveState}
      error={error}
      onSave={save}
      onDiscard={() => {
        setFields(saved);
        setError(null);
      }}
    >
      {({ editing, markActivity }) => (
        <ClientFieldsForm
          value={editing ? fields : saved}
          onChange={(patch) => {
            setFields((current) => ({ ...current, ...patch }));
            markActivity();
          }}
          options={options}
          disabled={!editing}
          editableSigla={false}
        />
      )}
    </RecordDialog>
  );
}
