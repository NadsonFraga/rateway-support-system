"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { SaveButton } from "@/components/ui/save-button";
import { useShellUser } from "@/features/shell/shell-user";
import { loadServices, saveServices, type ServiceValue } from "../actions/system";
import { ConflictNotice, FormError, SectionHeader, SectionLoading } from "../settings-frame";
import { settingsTopic } from "../topics";
import { useSectionForm } from "../use-section-form";

const KIND_LABEL = { pontual: "Pontual: pagamento único, com prazo e entrega", continuo: "Contínuo: mensalidade e fidelidade" };

// Serviços (configuracoes-design-v2.md §2.4): nome editável; tipo, fases e regras comerciais só leitura (D-15 a D-19).
export function ServicesSection() {
  const user = useShellUser();
  const load = React.useCallback(async () => {
    const services = await loadServices();
    return services ? { services } : null;
  }, []);
  const save = React.useCallback(async (draft: { services: ServiceValue[] }) => {
    const result = await saveServices(draft.services);
    return result.ok ? { ok: true as const, value: { services: result.value } } : result;
  }, []);
  const form = useSectionForm<{ services: ServiceValue[] }>({
    section: "servicos",
    topic: settingsTopic("servicos"),
    userId: user.id,
    load,
    save,
  });
  const { draft } = form;

  return (
    <section aria-label="Serviços" onKeyDown={form.onKeyDown}>
      <SectionHeader
        title="Serviços"
        description="Os serviços que um cliente pode contratar. O nome pode ser ajustado; tipo e fases seguem as regras do produto."
        escArmed={form.escArmed}
        actions={<SaveButton state={form.saveState} dirty={form.dirty} onSave={() => void form.submit()} />}
      />
      <ConflictNotice by={form.conflictBy} onDiscard={form.discard} />
      <FormError message={form.error} />
      {!draft ? (
        <SectionLoading />
      ) : (
        <div className="flex flex-col gap-5">
          <ul className="overflow-hidden rounded-xl border border-line-subtle bg-surface">
            {draft.services.map((service, index) => (
              <li key={service.id} className="flex flex-col gap-2 border-b border-line-subtle px-4 py-3 last:border-b-0">
                <div className="flex items-center gap-3">
                  <Input
                    aria-label={`Nome do serviço ${index + 1}`}
                    value={service.name}
                    maxLength={40}
                    className="max-w-72"
                    onChange={(event) =>
                      form.update((current) => ({
                        services: current.services.map((item) => (item.id === service.id ? { ...item, name: event.target.value } : item)),
                      }))
                    }
                  />
                  <span className="text-[13px] text-ink-secondary">{KIND_LABEL[service.kind]}</span>
                </div>
                <p className="text-[13px] text-ink-muted">Fases: {service.phases.join(" → ")}</p>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-1 text-[13px] text-ink-secondary">
            <p>A Assessoria já inclui o Cadastro/Revisão: quem tem Assessoria não contrata Cadastro separado.</p>
            <p>A Central de Reservas pode ser contratada sozinha, mas normalmente vem junto com a Assessoria.</p>
          </div>
        </div>
      )}
    </section>
  );
}
