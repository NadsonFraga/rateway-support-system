"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/features/auth/auth-client";
import { ROLES } from "@/features/auth/permissions";
import { sendTestNotification } from "@/features/inbox/actions";
import { useHydrated } from "@/lib/use-hydrated";
import { actionForEvent } from "./action-registry";
import { CommandPalette } from "./command-palette";
import { Sidebar } from "./sidebar";
import { TabHost } from "./tab-host";
import { demandCodeForPath, pathForTab, tabForPath } from "./tabs-model";
import { DemandDrawerHost } from "@/features/demands/drawer/demand-drawer";
import { useDemandDrawer } from "@/features/demands/drawer-store";
import { TabsProvider, useTabs, useTabsApi } from "./tabs-store";
import { TopBar } from "./top-bar";
import { ShellUserProvider, type ShellUser } from "./shell-user";
import { useRealtime } from "@/features/realtime/client";
import { userTopic } from "@/features/realtime/types";
import { INSTANCE_TOPIC } from "@/features/settings/topics";

type InstanceLogos = { dark: string | null; light: string | null };
type AppShellProps = { instanceName: string; instanceLogos: InstanceLogos; user: ShellUser };

// A janela do sistema (objetivos-do-projeto.md): altura fixa, só a área da aba ativa rola.
export function AppShell(props: AppShellProps) {
  const hydrated = useHydrated();
  const isDev = process.env.NODE_ENV !== "production";

  // As abas lembradas ficam no navegador: o servidor não as conhece, então a casca só monta no navegador.
  if (!hydrated) return <ShellSkeleton />;

  return (
    <TabsProvider userId={props.user.id} allowDev={isDev} initialTarget={tabForPath(window.location.pathname)}>
      <Shell {...props} isDev={isDev} />
    </TabsProvider>
  );
}

function Shell({ instanceName, instanceLogos, user, isDev }: AppShellProps & { isDev: boolean }) {
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const isAdmin = user.role === ROLES.administrador;

  useUrlSync();
  useDemandUrl();
  useShortcuts(() => setPaletteOpen(true));

  // Nome ou logos da instância mudaram (Configurações > Identidade): a barra superior se atualiza.
  useRealtime(INSTANCE_TOPIC, () => router.refresh());
  // Conta desativada ou senha refeita pelo Administrador: sai na hora.
  useRealtime(userTopic(user.id), (message) => {
    // Recarga completa de propósito: /sair é uma rota do servidor que apaga o cookie da sessão.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    if (message.event === "conta:encerrada") window.location.assign("/sair");
  });

  async function signOut() {
    await authClient.signOut();
    router.replace("/entrar");
    router.refresh();
  }

  return (
    <ShellUserProvider value={user}>
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-canvas">
      <TopBar
        instanceName={instanceName}
        instanceLogos={instanceLogos}
        user={user}
        onOpenSearch={() => setPaletteOpen(true)}
        onSignOut={() => void signOut()}
      />
      <div className="flex min-h-0 flex-1">
        <Sidebar isAdmin={isAdmin} />
        <main className="flex min-w-0 flex-1 flex-col">
          <TabHost />
        </main>
      </div>
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        isAdmin={isAdmin}
        isDev={isDev}
        onSignOut={() => void signOut()}
        onSendTestNotification={() => void sendTestNotification()}
      />
      <DemandDrawerHost />
    </div>
    </ShellUserProvider>
  );
}

/**
 * Atalhos globais do registro de ações (D-81). Os que usam Alt ou Ctrl valem até dentro de campos;
 * o `C` (nova demanda, D-59) só vale fora de campos de texto e com o painel de demanda fechado.
 */
function useShortcuts(openPalette: () => void) {
  const store = useTabsApi();
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const action = actionForEvent(event);
      if (!action) return;
      if (action === "demand.new") {
        const target = event.target as HTMLElement | null;
        const typing = !!target && (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable);
        const drawer = useDemandDrawer.getState();
        if (typing || drawer.code || drawer.creating || document.querySelector("[role=dialog]")) return;
        event.preventDefault();
        drawer.create();
        return;
      }
      event.preventDefault();
      const state = store.getState();
      if (action === "tabs.new") state.open("nova");
      else if (action === "tabs.close") state.requestClose(state.activeId);
      else if (action === "tabs.next") state.cycle(1);
      else if (action === "tabs.prev") state.cycle(-1);
      else if (action === "command_bar.open") openPalette();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [store, openPalette]);
}

/**
 * O endereço do navegador acompanha a aba ativa, e voltar/avançar no histórico troca de aba.
 * A aba pedida pelo endereço digitado já foi aberta pelo TabsProvider, antes da primeira exibição.
 */
function useUrlSync() {
  const tabs = useTabs((state) => state.tabs);
  const activeId = useTabs((state) => state.activeId);
  const activate = useTabs((state) => state.activate);
  const firstSync = React.useRef(true);

  React.useEffect(() => {
    const active = tabs.find((tab) => tab.id === activeId);
    if (!active) return;
    const path = pathForTab(active);
    if (window.location.pathname === path) return;
    // Na abertura só corrige o endereço; depois, cada troca de aba vira um passo do histórico.
    if (firstSync.current) window.history.replaceState(null, "", path);
    else window.history.pushState(null, "", path);
    firstSync.current = false;
  }, [tabs, activeId]);

  React.useEffect(() => {
    firstSync.current = false;
  }, []);

  React.useEffect(() => {
    function onPopState() {
      // Só volta para abas ainda abertas; uma aba já fechada não reabre pelo histórico.
      const match = tabs.find((tab) => pathForTab(tab) === window.location.pathname);
      if (match) return activate(match.id);
      const active = tabs.find((tab) => tab.id === activeId);
      if (active) window.history.replaceState(null, "", pathForTab(active));
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [tabs, activeId, activate]);
}

/** O painel da demanda aparece no endereço (/demandas/DEM-0042): F5 reabre a mesma demanda. */
function useDemandUrl() {
  const code = useDemandDrawer((state) => state.code);
  const open = useDemandDrawer((state) => state.open);
  const tabs = useTabs((state) => state.tabs);
  const activeId = useTabs((state) => state.activeId);
  const first = React.useRef(true);

  React.useEffect(() => {
    if (!first.current) return;
    first.current = false;
    const initial = demandCodeForPath(window.location.pathname);
    if (initial) open(initial);
  }, [open]);

  React.useEffect(() => {
    const active = tabs.find((tab) => tab.id === activeId);
    const path = code ? `/demandas/${encodeURIComponent(code)}` : active ? pathForTab(active) : null;
    if (path && window.location.pathname !== path) window.history.replaceState(null, "", path);
  }, [code, tabs, activeId]);
}

export function ShellSkeleton() {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-canvas" aria-busy="true">
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-line-subtle bg-sidebar px-3">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="ml-auto h-8 w-40" />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="w-[260px] shrink-0 border-r border-line-subtle bg-sidebar" />
        <div className="flex flex-1 flex-col">
          <div className="h-10 border-b border-line-subtle bg-sidebar" />
        </div>
      </div>
    </div>
  );
}
