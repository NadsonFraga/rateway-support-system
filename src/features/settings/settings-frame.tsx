"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCurrentTabDirtySources } from "@/features/shell/tabs-store";

export type FrameSection = { id: string; label: string; icon: LucideIcon; soon?: boolean; content: React.ReactNode };

// Estrutura das abas de configuração (configuracoes-design-v2.md §1): navegação de 220px à esquerda,
// conteúdo de até 760px. Todas as seções ficam montadas: o rascunho de uma sobrevive à troca para outra.
export function SettingsFrame({ title, sections }: { title: string; sections: FrameSection[] }) {
  const [active, setActive] = React.useState(sections[0].id);
  const dirtySources = useCurrentTabDirtySources();

  return (
    <div className="flex min-h-full">
      <nav aria-label={title} className="w-[220px] shrink-0 border-r border-line-subtle p-3">
        <h1 className="px-2.5 pt-1 pb-3 text-[15px] font-semibold text-ink">{title}</h1>
        <ul className="flex flex-col gap-0.5">
          {sections.map((section) => (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => setActive(section.id)}
                aria-current={active === section.id ? "page" : undefined}
                className={cn(
                  "flex min-h-9 w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm",
                  active === section.id
                    ? "bg-accent-subdued font-medium text-ink"
                    : "text-ink-secondary hover:bg-surface-hover hover:text-ink"
                )}
              >
                <section.icon className="size-[18px] shrink-0 stroke-[1.75]" aria-hidden />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{section.label}</span>
                  {section.soon && <span className="text-xs text-ink-muted">Em breve</span>}
                </span>
                {dirtySources[section.id] && (
                  <span role="img" aria-label="Alterações não salvas" className="size-1.5 shrink-0 rounded-full bg-ink-secondary" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="min-w-0 flex-1 px-10 py-8">
        {sections.map((section) => (
          <div key={section.id} hidden={active !== section.id} className="max-w-[760px]">
            {section.content}
          </div>
        ))}
      </div>
    </div>
  );
}

type SectionHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  escArmed?: boolean;
};

/** Cabeçalho de seção: título à esquerda, ações (Salvar, Adicionar) à direita — nunca flutuantes. */
export function SectionHeader({ title, description, actions, escArmed }: SectionHeaderProps) {
  return (
    <div className="mb-6 flex items-start gap-4 border-b border-line-subtle pb-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {description && <p className="text-[13px] text-ink-secondary">{description}</p>}
      </div>
      {escArmed && (
        <span role="status" className="pt-2 text-[13px] text-amber-fact">
          Esc de novo para descartar
        </span>
      )}
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Aviso de D-87: outra pessoa salvou a mesma seção enquanto você editava. */
export function ConflictNotice({ by, onDiscard }: { by: string | null; onDiscard: () => void }) {
  if (!by) return null;
  return (
    <div role="status" className="mb-5 flex items-center gap-3 rounded-lg bg-accent-subdued px-4 py-2.5 text-[13px] text-ink-secondary">
      <span className="flex-1">
        <strong className="font-medium text-ink">{by}</strong> salvou esta seção agora. Salvar substitui o que foi salvo;
        Esc descarta as suas alterações.
      </span>
      <button type="button" onClick={onDiscard} className="font-medium text-ink underline-offset-2 hover:underline">
        Ver versão salva
      </button>
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mb-5 text-[13px] text-coral">
      {message}
    </p>
  );
}

export function SectionLoading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-2/3" />
    </div>
  );
}
