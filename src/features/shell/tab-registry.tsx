"use client";

import * as React from "react";
import {
  Activity,
  Building2,
  LayoutGrid,
  ClipboardList,
  FilePen,
  Home,
  Plus,
  Rocket,
  Settings,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { ComingSoon } from "@/components/ui/coming-soon";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ListRow } from "@/components/ui/list-row";
import { Kbd } from "@/components/ui/kbd";
import { Button } from "@/components/ui/button";
import { AccountTab } from "@/features/settings/account/account-tab";
import { SystemSettingsTab } from "@/features/settings/system/settings-tab";
import type { Tab, TabKind } from "./tabs-model";
import { useCurrentTab, useTabDirty, useTabs } from "./tabs-store";

type TabDefinition = {
  icon: LucideIcon;
  title: (tab: Tab) => string;
  /** Trilha da barra superior (sem o nome da instância). */
  breadcrumb: (tab: Tab) => string[];
  content: React.ComponentType;
};

function ModulePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-8 py-8">
      <h1 className="text-lg font-semibold text-ink">{title}</h1>
      <ComingSoon title={`${title} em construção`} description={description} />
    </div>
  );
}

const placeholder = (title: string, description: string) =>
  function Placeholder() {
    return <ModulePlaceholder title={title} description={description} />;
  };

/** Módulos que aparecem no seletor de nova aba e na navegação. */
export const MODULES: { kind: TabKind; label: string; icon: LucideIcon }[] = [
  { kind: "inicio", label: "Início", icon: Home },
  { kind: "demandas", label: "Demandas", icon: ClipboardList },
  { kind: "clientes", label: "Clientes", icon: Building2 },
  { kind: "cadastros", label: "Cadastros", icon: Rocket },
];

function NewTabLauncher() {
  const { tab } = useCurrentTab();
  const replace = useTabs((state) => state.replace);
  const isDev = process.env.NODE_ENV !== "production";
  const nextDraft = useNextDraftNumber();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-8 py-10">
      <h1 className="text-lg font-semibold text-ink">Nova aba</h1>
      <p className="text-[13px] text-ink-secondary">
        Escolha o que abrir aqui, ou use <Kbd>Ctrl</Kbd> <Kbd>K</Kbd> para buscar.
      </p>
      <div className="overflow-hidden rounded-xl border border-line-subtle bg-surface">
        {MODULES.map((module) => (
          <ListRow
            key={module.kind}
            role="button"
            tabIndex={0}
            onClick={() => replace(tab.id, module.kind)}
            onKeyDown={(event) => event.key === "Enter" && replace(tab.id, module.kind)}
            className="last:border-b-0"
          >
            <module.icon className="text-ink-secondary" aria-hidden />
            <span>{module.label}</span>
          </ListRow>
        ))}
        {isDev && (
          <ListRow
            role="button"
            tabIndex={0}
            onClick={() => replace(tab.id, "rascunho", { numero: String(nextDraft) })}
            onKeyDown={(event) => event.key === "Enter" && replace(tab.id, "rascunho", { numero: String(nextDraft) })}
            className="border-b-0"
          >
            <FilePen className="text-ink-secondary" aria-hidden />
            <span>Rascunho de teste</span>
            <span className="ml-auto text-[13px] text-ink-muted">Desenvolvimento</span>
          </ListRow>
        )}
      </div>
    </div>
  );
}

/** Próximo número livre para um rascunho de teste. */
export function useNextDraftNumber() {
  const tabs = useTabs((state) => state.tabs);
  const used = tabs.filter((tab) => tab.kind === "rascunho").map((tab) => Number(tab.params?.numero ?? 0));
  return used.length ? Math.max(...used) + 1 : 1;
}

/** Aba de teste (só em desenvolvimento): prova o keep-alive e o ponto de alterações não salvas. */
function ScratchTab() {
  const [title, setTitle] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const { tab } = useCurrentTab();
  useTabDirty(title !== "" || notes !== "");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 px-8 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold text-ink">Rascunho de teste {tab.params?.numero}</h1>
        <p className="text-[13px] text-ink-secondary">
          Digite algo, troque de aba e volte: o texto continua aqui. Com texto, a aba mostra o ponto de alterações não
          salvas e pede confirmação ao fechar.
        </p>
      </div>
      <Field label="Título" htmlFor={`${tab.id}-titulo`}>
        <Input id={`${tab.id}-titulo`} value={title} onChange={(event) => setTitle(event.target.value)} />
      </Field>
      <Field label="Anotações" htmlFor={`${tab.id}-notas`}>
        <textarea
          id={`${tab.id}-notas`}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={8}
          className="w-full resize-none rounded-lg border border-line-subtle bg-surface px-3 py-2 text-sm text-ink outline-none focus-visible:border-line-focus"
        />
      </Field>
      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        onClick={() => {
          setTitle("");
          setNotes("");
        }}
      >
        Limpar
      </Button>
    </div>
  );
}

function HomeTab() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-8 py-8">
      <h1 className="text-lg font-semibold text-ink">Início</h1>
      <ComingSoon
        title="Resumo do dia em construção"
        description="Mural de avisos, minhas demandas e indicadores de implantação chegam na Etapa 1.7."
      />
      {process.env.NODE_ENV !== "production" && (
        <nav aria-label="Telas de teste" className="flex flex-wrap gap-2">
          {[
            { href: "/dev/tempo-real", label: "Teste de tempo real", icon: Activity },
            { href: "/dev/componentes", label: "Catálogo de componentes", icon: LayoutGrid },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="inline-flex h-8 items-center gap-2 rounded-lg border border-line-medium bg-surface px-3 text-[13px] font-medium text-ink hover:bg-surface-hover"
            >
              <link.icon className="size-4 stroke-[1.75]" aria-hidden /> {link.label}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}

export const TAB_REGISTRY: Record<TabKind, TabDefinition> = {
  inicio: { icon: Home, title: () => "Início", breadcrumb: () => ["Início"], content: HomeTab },
  demandas: {
    icon: ClipboardList,
    title: () => "Demandas",
    breadcrumb: () => ["Demandas"],
    content: placeholder("Demandas", "Lista, quadro Kanban e o painel de cada demanda chegam na Etapa 1.4."),
  },
  clientes: {
    icon: Building2,
    title: () => "Clientes",
    breadcrumb: () => ["Clientes"],
    content: placeholder("Clientes", "Listagem, ficha do cliente e Cofre de acessos chegam na Etapa 1.3."),
  },
  cadastros: {
    icon: Rocket,
    title: () => "Cadastros",
    breadcrumb: () => ["Cadastros"],
    content: placeholder("Cadastros", "Matriz geral e Fila de prioridades chegam na Etapa 1.6."),
  },
  configuracoes: {
    icon: Settings,
    title: () => "Configurações",
    breadcrumb: () => ["Configurações"],
    content: SystemSettingsTab,
  },
  "minha-conta": {
    icon: UserRound,
    title: () => "Minha Conta",
    breadcrumb: () => ["Minha Conta"],
    content: AccountTab,
  },
  nova: { icon: Plus, title: () => "Nova aba", breadcrumb: () => ["Nova aba"], content: NewTabLauncher },
  rascunho: {
    icon: FilePen,
    title: (tab) => `Rascunho de teste ${tab.params?.numero ?? ""}`.trim(),
    breadcrumb: (tab) => ["Desenvolvimento", `Rascunho de teste ${tab.params?.numero ?? ""}`.trim()],
    content: ScratchTab,
  },
};
