"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SaveButton } from "@/components/ui/save-button";
import { Select } from "@/components/ui/select";
import { applyMask, CLIENT_CODE_MASKS } from "@/features/ids/masks";
import { useShellUser } from "@/features/shell/shell-user";
import { loadIdentifiers, saveIdentifiers, type IdentifierValues } from "../actions/system";
import { ConflictNotice, FormError, SectionHeader, SectionLoading } from "../settings-frame";
import { settingsTopic } from "../topics";
import { useSectionForm } from "../use-section-form";

const EXAMPLE_SIGLA = "ABC";

// Identificadores (configuracoes-design-v2.md §2.2, identificadores-e-formatos.md).
export function IdentifiersSection() {
  const user = useShellUser();
  const [nextDemand, setNextDemand] = React.useState(1);
  const load = React.useCallback(async () => {
    const value = await loadIdentifiers();
    if (!value) return null;
    const { nextDemandNumber, ...values } = value;
    setNextDemand(nextDemandNumber);
    return values;
  }, []);
  const form = useSectionForm<IdentifierValues>({
    section: "identificadores",
    topic: settingsTopic("identificadores"),
    userId: user.id,
    load,
    save: saveIdentifiers,
  });
  const { draft } = form;

  return (
    <section aria-label="Identificadores" onKeyDown={form.onKeyDown}>
      <SectionHeader
        title="Identificadores"
        description="Formato dos códigos de clientes e demandas. Códigos já criados não mudam."
        escArmed={form.escArmed}
        actions={<SaveButton state={form.saveState} dirty={form.dirty} onSave={() => void form.submit()} />}
      />
      <ConflictNotice by={form.conflictBy} onDiscard={form.discard} />
      <FormError message={form.error} />
      {!draft ? (
        <SectionLoading />
      ) : (
        <div className="flex flex-col gap-6">
          <Field label="Máscara do código de cliente" htmlFor="identificadores-mascara">
            <Select
              id="identificadores-mascara"
              value={draft.clientCodeMask}
              onChange={(event) => form.update({ clientCodeMask: event.target.value })}
            >
              {CLIENT_CODE_MASKS.map((mask) => (
                <option key={mask} value={mask}>
                  {mask}, exemplo {applyMask(mask, { sigla: EXAMPLE_SIGLA, seq: 1 }, () => 0.5)}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Palavras ignoradas na sugestão de sigla"
            htmlFor="identificadores-palavras"
            help="Digite e aperte Enter. Essas palavras não entram nas iniciais (ex.: Pousada Sol vira PS, não PSO)."
          >
            <TagInput
              id="identificadores-palavras"
              values={draft.ignoredWords}
              onChange={(ignoredWords) => form.update({ ignoredWords })}
            />
          </Field>
          <Field label="Prefixo das demandas" htmlFor="identificadores-prefixo" help="De 2 a 5 letras, sem acento.">
            <Input
              id="identificadores-prefixo"
              value={draft.demandPrefix}
              maxLength={5}
              className="w-32 font-mono uppercase"
              onChange={(event) => form.update({ demandPrefix: event.target.value.toUpperCase() })}
            />
          </Field>
          <p className="rounded-lg border border-line-subtle bg-surface px-4 py-3 font-mono text-sm text-ink">
            Próximo cliente: #{applyMask(draft.clientCodeMask, { sigla: EXAMPLE_SIGLA, seq: 1 }, () => 0.5)} · Próxima demanda: #
            {applyMask("{PREFIXO}-{SEQ:4}", { prefixo: draft.demandPrefix || "DEM", seq: nextDemand })}
            <span className="mt-1 block font-sans text-xs text-ink-muted">
              {EXAMPLE_SIGLA} é só um exemplo: a sigla de cada cliente é sugerida pelo nome dele.
            </span>
          </p>
        </div>
      )}
    </section>
  );
}

/** Campo de etiquetas: Enter ou vírgula adiciona; o × de cada etiqueta remove. */
function TagInput({ id, values, onChange }: { id: string; values: string[]; onChange: (values: string[]) => void }) {
  const [text, setText] = React.useState("");

  function add() {
    const word = text.trim().replace(/,$/, "");
    if (word && !values.some((value) => value.toLowerCase() === word.toLowerCase())) onChange([...values, word]);
    setText("");
  }

  return (
    <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border border-line-subtle bg-surface px-2 py-1.5 focus-within:border-line-focus">
      {values.map((value) => (
        <span key={value} className="inline-flex h-6 items-center gap-1 rounded-md bg-surface-active pr-1 pl-2 text-[13px] text-ink">
          {value}
          <button
            type="button"
            aria-label={`Remover ${value}`}
            onClick={() => onChange(values.filter((item) => item !== value))}
            className="inline-flex size-4 items-center justify-center rounded text-ink-muted hover:text-ink"
          >
            <X className="size-3 stroke-[1.75]" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            add();
          } else if (event.key === "Backspace" && !text && values.length) {
            onChange(values.slice(0, -1));
          }
        }}
        onBlur={add}
        className="h-6 min-w-24 flex-1 bg-transparent text-sm text-ink outline-none"
      />
    </div>
  );
}
