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
import { TabStrip } from "./tab-strip";
import { pathForTab, tabForPath } from "./tabs-model";
import { TabsProvider, useTabs, useTabsApi } from "./tabs-store";
import { TopBar, type ShellUser } from "./top-bar";

type AppShellProps = { instanceName: string; user: ShellUser };

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

function Shell({ instanceName, user, isDev }: AppShellProps & { isDev: boolean }) {
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const isAdmin = user.role === ROLES.administrador;

  useUrlSync();
  useShortcuts(() => setPaletteOpen(true));

  async function signOut() {
    await authClient.signOut();
    router.replace("/entrar");
    router.refresh();
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-canvas">
      <TopBar
        instanceName={instanceName}
        user={user}
        onOpenSearch={() => setPaletteOpen(true)}
        onSignOut={() => void signOut()}
      />
      <div className="flex min-h-0 flex-1">
        <Sidebar isAdmin={isAdmin} />
        <main className="flex min-w-0 flex-1 flex-col">
          <TabStrip />
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
    </div>
  );
}

/** Atalhos globais do registro de ações (D-81). Todos usam Alt ou Ctrl, então valem até dentro de campos. */
function useShortcuts(openPalette: () => void) {
  const store = useTabsApi();
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const action = actionForEvent(event);
      if (!action) return;
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
