"use client";

import * as React from "react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { SaveState } from "@/components/ui/save-button";
import { RecordDialog } from "@/features/clients/components/record-dialog";
import { CATALOG_CATEGORIES, CATALOG_CATEGORY_LABEL } from "@/features/settings/catalog-types";
import { listVaultChannels, loadCredential, saveCredential, type CredentialInput } from "./actions";

type Channel = NonNullable<Awaited<ReturnType<typeof listVaultChannels>>>[number];

const EMPTY: CredentialInput = { catalogItemId: "", label: "", propertyId: "", username: "", password: "", extranetUrl: "" };

/** Adicionar ou editar um acesso do Cofre (só Administrador, D-36). Editar usa a trava "acesso". */
export function CredentialDialog({ clientId, credentialId, onClose }: { clientId: string; credentialId: string | null; onClose: () => void }) {
  const [loaded, setLoaded] = React.useState<{ channels: Channel[]; saved: CredentialInput } | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    void Promise.all([listVaultChannels(), credentialId ? loadCredential(credentialId) : Promise.resolve(null)]).then(([channels, current]) => {
      if (cancelled || !channels) return;
      const saved: CredentialInput = current
        ? {
            ...current,
            password: "",
            extranetUrl: current.extranetUrl || (channels.find((item) => item.id === current.catalogItemId)?.extranetUrl ?? ""),
          }
        : EMPTY;
      setLoaded({ channels, saved });
    });
    return () => {
      cancelled = true;
    };
  }, [credentialId]);
  return loaded ? <CredentialInner clientId={clientId} credentialId={credentialId} {...loaded} onClose={onClose} /> : null;
}

function CredentialInner({
  clientId,
  credentialId,
  channels,
  saved,
  onClose,
}: {
  clientId: string;
  credentialId: string | null;
  channels: Channel[];
  saved: CredentialInput;
  onClose: () => void;
}) {
  const [draft, setDraft] = React.useState<CredentialInput>(saved);
  const [saveState, setSaveState] = React.useState<SaveState>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const creating = credentialId === null;
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  async function save() {
    setSaveState("saving");
    setError(null);
    const result = await saveCredential(clientId, credentialId, draft);
    if (!result.ok) {
      setSaveState("idle");
      setError(result.error);
      return false;
    }
    setSaveState("saved");
    if (!creating) window.setTimeout(onClose, 600);
    return true;
  }

  return (
    <RecordDialog
      open
      onClose={onClose}
      title={creating ? "Adicionar acesso" : "Acesso do Cofre"}
      lock={creating ? null : { entityType: "acesso", entityId: credentialId }}
      canEdit
      dirty={dirty}
      saveState={saveState}
      error={error}
      onSave={save}
      onDiscard={() => {
        setDraft(saved);
        setError(null);
      }}
      saveLabel={creating ? "Adicionar" : undefined}
    >
      {({ editing, markActivity }) => {
        const value = editing ? draft : saved;
        const patch = (next: Partial<CredentialInput>) => {
          setDraft((current) => ({ ...current, ...next }));
          setError(null);
          markActivity();
        };
        return (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Canal" htmlFor="acesso-canal">
                <Select
                  id="acesso-canal"
                  value={value.catalogItemId}
                  disabled={!editing}
                  autoFocus={creating}
                  onChange={(event) => {
                    const channel = channels.find((item) => item.id === event.target.value);
                    patch({ catalogItemId: event.target.value, extranetUrl: channel?.extranetUrl ?? "" });
                  }}
                >
                  <option value="">Escolha o canal</option>
                  {CATALOG_CATEGORIES.map((category) => {
                    const items = channels.filter((item) => item.category === category);
                    return items.length ? (
                      <optgroup key={category} label={CATALOG_CATEGORY_LABEL[category]}>
                        {items.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </optgroup>
                    ) : null;
                  })}
                </Select>
              </Field>
              <Field label="Rótulo (opcional)" htmlFor="acesso-rotulo" help="Para diferenciar duas contas do mesmo canal.">
                <Input id="acesso-rotulo" value={value.label} disabled={!editing} maxLength={40} onChange={(event) => patch({ label: event.target.value })} />
              </Field>
            </div>
            <Field label="ID da propriedade" htmlFor="acesso-id">
              <Input id="acesso-id" className="font-mono" value={value.propertyId} disabled={!editing} maxLength={60} onChange={(event) => patch({ propertyId: event.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Usuário" htmlFor="acesso-usuario">
                <Input id="acesso-usuario" autoComplete="off" value={value.username} disabled={!editing} onChange={(event) => patch({ username: event.target.value })} />
              </Field>
              <Field label="Senha" htmlFor="acesso-senha" help={creating ? undefined : "Deixe vazio para manter a senha atual."}>
                <Input
                  id="acesso-senha"
                  type="password"
                  autoComplete="new-password"
                  value={value.password}
                  disabled={!editing}
                  placeholder={creating ? undefined : "••••••••••••"}
                  onChange={(event) => patch({ password: event.target.value })}
                />
              </Field>
            </div>
            <Field label="URL da extranet" htmlFor="acesso-extranet" help="Vem do catálogo de canais. Mude só se este cliente usar outro endereço.">
              <Input
                id="acesso-extranet"
                type="url"
                placeholder="https://"
                value={value.extranetUrl}
                disabled={!editing}
                onChange={(event) => patch({ extranetUrl: event.target.value })}
              />
            </Field>
          </div>
        );
      }}
    </RecordDialog>
  );
}
