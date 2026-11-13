"use client";

import * as React from "react";
import {
  Building2,
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
import { ClientsTab } from "@/features/clients/list/clients-tab";
import { DemandsTab } from "@/features/demands/list/demands-tab";
import { ClientTab } from "@/features/clients/sheet/client-tab";
import { CadastrosTab } from "@/features/cadastros/cadastros-tab";
import { DashboardTab } from "@/features/dashboard/dashboard-tab";
import type { Tab, TabKind } from "./tabs-model";
import { useCurrentTab, useTabDirty, useTabs } from "./tabs-store";

type TabDefinition = {
  icon: LucideIcon;
  /** `label`: nome conhecido só depois de carregar (ex.: nome do cliente). */
  title: (tab: Tab, label?: string) => string;
  /** Trilha da barra superior (sem o nome da instância). */
  breadcrumb: (tab: Tab, label?: string) => string[];
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

export const TAB_REGISTRY: Record<TabKind, TabDefinition> = {
  inicio: { icon: Home, title: () => "Início", breadcrumb: () => ["Início"], content: DashboardTab },
  demandas: {
    icon: ClipboardList,
    title: () => "Demandas",
    breadcrumb: () => ["Demandas"],
    content: DemandsTab,
  },
  clientes: {
    icon: Building2,
    title: () => "Clientes",
    breadcrumb: () => ["Clientes"],
    content: ClientsTab,
  },
  cliente: {
    icon: Building2,
    title: (tab, label) => label ?? `#${tab.params?.codigo ?? ""}`,
    breadcrumb: (tab, label) => ["Clientes", label ?? `#${tab.params?.codigo ?? ""}`],
    content: ClientTab,
  },
  cadastros: {
    icon: Rocket,
    title: () => "Cadastros",
    breadcrumb: () => ["Cadastros"],
    content: CadastrosTab,
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
