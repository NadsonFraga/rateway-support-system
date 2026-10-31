"use client";

import * as React from "react";
import { SaveButton } from "@/components/ui/save-button";
import { useShellUser } from "@/features/shell/shell-user";
import { loadMessages, saveMessages, type MessageValues } from "../actions/system";
import { fillTemplate, MESSAGE_VARIABLES, unknownVariables } from "../message-template";
import { ConflictNotice, FormError, SectionHeader, SectionLoading } from "../settings-frame";
import { settingsTopic } from "../topics";
import { useSectionForm } from "../use-section-form";

// Mensagens (configuracoes-design-v2.md §2.5, D-38): modelo de cobrança via WhatsApp com variáveis e prévia.
export function MessagesSection() {
  const user = useShellUser();
  const [instanceName, setInstanceName] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const load = React.useCallback(async () => {
    const value = await loadMessages();
    if (!value) return null;
    setInstanceName(value.instanceName);
    return { template: value.template };
  }, []);
  const form = useSectionForm<MessageValues>({
    section: "mensagens",
    topic: settingsTopic("mensagens"),
    userId: user.id,
    load,
    save: saveMessages,
  });
  const { draft } = form;

  function insertVariable(key: string) {
    const element = textareaRef.current;
    if (!element || !draft) return;
    const token = `{{${key}}}`;
    const start = element.selectionStart ?? draft.template.length;
    const end = element.selectionEnd ?? start;
    form.update({ template: draft.template.slice(0, start) + token + draft.template.slice(end) });
    requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(start + token.length, start + token.length);
    });
  }

  const unknown = draft ? unknownVariables(draft.template) : [];

  return (
    <section aria-label="Mensagens" onKeyDown={form.onKeyDown}>
      <SectionHeader
        title="Mensagens"
        description="Texto usado pelo botão Cobrar no WhatsApp, na ficha do cliente."
        escArmed={form.escArmed}
        actions={<SaveButton state={form.saveState} dirty={form.dirty} onSave={() => void form.submit()} />}
      />
      <ConflictNotice by={form.conflictBy} onDiscard={form.discard} />
      <FormError message={form.error} />
      {!draft ? (
        <SectionLoading />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="mensagem-cobranca" className="text-[13px] text-ink-secondary">
              Modelo de cobrança
            </label>
            <div className="flex flex-wrap gap-1.5" aria-label="Inserir variável">
              {MESSAGE_VARIABLES.map((variable) => (
                <button
                  key={variable.key}
                  type="button"
                  onClick={() => insertVariable(variable.key)}
                  className="inline-flex h-7 items-center rounded-md border border-line-medium px-2 font-mono text-xs text-ink-secondary hover:bg-surface-hover hover:text-ink"
                >
                  {variable.key}
                </button>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              id="mensagem-cobranca"
              value={draft.template}
              maxLength={1000}
              onChange={(event) => form.update({ template: event.target.value })}
              className="h-40 w-full resize-none rounded-lg border border-line-subtle bg-surface px-3 py-2 text-sm text-ink outline-none focus-visible:border-line-focus"
            />
            {unknown.length > 0 && (
              <p role="alert" className="text-xs text-coral">
                Variável desconhecida: {unknown.map((key) => `{{${key}}}`).join(", ")}. Use os botões acima.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[13px] text-ink-secondary">Prévia com um cliente de exemplo</span>
            <div className="rounded-xl bg-surface-elevated px-4 py-3 text-sm whitespace-pre-wrap text-ink">
              {fillTemplate(draft.template, {
                "contato_financeiro.nome": "Contato de exemplo",
                "cliente.nome": "Cliente de exemplo",
                "instancia.nome": instanceName,
                servico: "Assessoria",
                vencimento: "dia 20",
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
