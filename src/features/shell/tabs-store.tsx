"use client";

import * as React from "react";
import { createStore, useStore, type StoreApi } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  closeTab,
  cycleTab,
  initialTabsState,
  openTab,
  replaceTab,
  sanitizeTabsState,
  type Tab,
  type TabKind,
  type TabsState,
} from "./tabs-model";

type TabsStore = TabsState & {
  /** Abas com alterações não salvas (não vão para o navegador: D-64). */
  dirty: Record<string, boolean>;
  /** Aba esperando confirmação para fechar com alterações não salvas. */
  pendingClose: string | null;
  open: (kind: TabKind, params?: Record<string, string>) => void;
  replace: (tabId: string, kind: TabKind, params?: Record<string, string>) => void;
  activate: (tabId: string) => void;
  requestClose: (tabId: string) => void;
  confirmClose: () => void;
  cancelClose: () => void;
  cycle: (step: 1 | -1) => void;
  setDirty: (tabId: string, dirty: boolean) => void;
};

function createTabsStore(userId: string, allowDev: boolean) {
  return createStore<TabsStore>()(
    persist(
      (set, get) => {
        const apply = (next: TabsState) => set({ tabs: next.tabs, activeId: next.activeId });
        return {
          ...initialTabsState(),
          dirty: {},
          pendingClose: null,
          open: (kind, params) => apply(openTab(get(), kind, params)),
          replace: (tabId, kind, params) => apply(replaceTab(get(), tabId, kind, params)),
          activate: (tabId) => set({ activeId: tabId }),
          requestClose: (tabId) => {
            if (get().dirty[tabId]) return set({ pendingClose: tabId });
            apply(closeTab(get(), tabId));
          },
          confirmClose: () => {
            const tabId = get().pendingClose;
            if (!tabId) return;
            const dirty = { ...get().dirty };
            delete dirty[tabId];
            set({ dirty, pendingClose: null });
            apply(closeTab(get(), tabId));
          },
          cancelClose: () => set({ pendingClose: null }),
          cycle: (step) => apply(cycleTab(get(), step)),
          setDirty: (tabId, dirty) =>
            set((state) => (state.dirty[tabId] === dirty ? state : { dirty: { ...state.dirty, [tabId]: dirty } })),
        };
      },
      {
        // Uma lista por usuário: o computador é compartilhado (D-84).
        name: `abas:${userId}`,
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ tabs: state.tabs, activeId: state.activeId }),
        merge: (persisted, current) => ({ ...current, ...sanitizeTabsState(persisted as Partial<TabsState>, allowDev) }),
      }
    )
  );
}

const TabsStoreContext = React.createContext<StoreApi<TabsStore> | null>(null);

export function TabsProvider({
  userId,
  allowDev,
  initialTarget,
  children,
}: {
  userId: string;
  allowDev: boolean;
  /** Aba pedida pelo endereço digitado: abre antes da primeira exibição. */
  initialTarget?: { kind: TabKind; params?: Record<string, string> } | null;
  children: React.ReactNode;
}) {
  const [store] = React.useState(() => {
    const created = createTabsStore(userId, allowDev);
    if (initialTarget && (allowDev || initialTarget.kind !== "rascunho")) {
      created.getState().open(initialTarget.kind, initialTarget.params);
    }
    return created;
  });
  return <TabsStoreContext.Provider value={store}>{children}</TabsStoreContext.Provider>;
}

export function useTabs<T>(selector: (state: TabsStore) => T): T {
  const store = React.useContext(TabsStoreContext);
  if (!store) throw new Error("useTabs precisa estar dentro de <TabsProvider>.");
  return useStore(store, selector);
}

export function useTabsApi() {
  const store = React.useContext(TabsStoreContext);
  if (!store) throw new Error("useTabsApi precisa estar dentro de <TabsProvider>.");
  return store;
}

// ---- Contexto da aba atual (para o conteúdo saber quem é e marcar "não salvo") ----

const CurrentTabContext = React.createContext<{ tab: Tab; active: boolean } | null>(null);

export function CurrentTabProvider({
  tab,
  active,
  children,
}: {
  tab: Tab;
  active: boolean;
  children: React.ReactNode;
}) {
  const value = React.useMemo(() => ({ tab, active }), [tab, active]);
  return <CurrentTabContext.Provider value={value}>{children}</CurrentTabContext.Provider>;
}

export function useCurrentTab() {
  const value = React.useContext(CurrentTabContext);
  if (!value) throw new Error("useCurrentTab precisa estar dentro de uma aba.");
  return value;
}

/** O conteúdo da aba avisa se tem alterações não salvas: aparece o ponto na aba e o fechar pede confirmação. */
export function useTabDirty(dirty: boolean) {
  const { tab } = useCurrentTab();
  const setDirty = useTabs((state) => state.setDirty);
  React.useEffect(() => {
    setDirty(tab.id, dirty);
  }, [tab.id, dirty, setDirty]);
  React.useEffect(() => () => setDirty(tab.id, false), [tab.id, setDirty]);
}
