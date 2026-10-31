// Modelo das abas (sistema-de-abas.md, D-81, D-84). Funções puras: fáceis de testar e sem tela.

export type TabKind =
  | "inicio"
  | "demandas"
  | "clientes"
  | "cadastros"
  | "configuracoes"
  | "minha-conta"
  | "nova"
  | "rascunho";

export type Tab = { id: string; kind: TabKind; params?: Record<string, string> };

export type TabsState = { tabs: Tab[]; activeId: string };

/** Módulos que existem uma única vez: abrir de novo só foca a aba que já está aberta. */
const SINGLETONS: TabKind[] = ["inicio", "demandas", "clientes", "cadastros", "configuracoes", "minha-conta"];

export const HOME_TAB: Tab = { id: "inicio", kind: "inicio" };

export function initialTabsState(): TabsState {
  return { tabs: [HOME_TAB], activeId: HOME_TAB.id };
}

function tabIdFor(kind: TabKind, params?: Record<string, string>) {
  if (SINGLETONS.includes(kind)) return kind;
  const suffix = params ? Object.values(params).join("-") : Math.random().toString(36).slice(2, 8);
  return `${kind}-${suffix}`;
}

/** Abre (ou foca, se já aberta) uma aba e a deixa ativa. */
export function openTab(state: TabsState, kind: TabKind, params?: Record<string, string>): TabsState {
  const id = tabIdFor(kind, params);
  const existing = state.tabs.find((tab) => tab.id === id);
  if (existing) return { ...state, activeId: id };
  return { tabs: [...state.tabs, { id, kind, params }], activeId: id };
}

/** Troca o conteúdo da aba "Nova aba" pelo módulo escolhido (ou foca o módulo se ele já estiver aberto). */
export function replaceTab(state: TabsState, tabId: string, kind: TabKind, params?: Record<string, string>): TabsState {
  const id = tabIdFor(kind, params);
  if (state.tabs.some((tab) => tab.id === id)) {
    return { tabs: state.tabs.filter((tab) => tab.id !== tabId), activeId: id };
  }
  return {
    tabs: state.tabs.map((tab) => (tab.id === tabId ? { id, kind, params } : tab)),
    activeId: id,
  };
}

/** Fecha uma aba. A aba Início nunca fecha. Ao fechar a ativa, a vizinha da esquerda assume. */
export function closeTab(state: TabsState, tabId: string): TabsState {
  if (tabId === HOME_TAB.id) return state;
  const index = state.tabs.findIndex((tab) => tab.id === tabId);
  if (index === -1) return state;
  const tabs = state.tabs.filter((tab) => tab.id !== tabId);
  const activeId = state.activeId === tabId ? tabs[Math.max(0, index - 1)].id : state.activeId;
  return { tabs, activeId };
}

/** Próxima (+1) ou anterior (-1), dando a volta nas pontas. */
export function cycleTab(state: TabsState, step: 1 | -1): TabsState {
  const index = state.tabs.findIndex((tab) => tab.id === state.activeId);
  const next = (index + step + state.tabs.length) % state.tabs.length;
  return { ...state, activeId: state.tabs[next].id };
}

/** Garante que o estado restaurado do navegador é válido (D-84): Início sempre primeira, ativa existente. */
export function sanitizeTabsState(state: Partial<TabsState> | undefined, allowDev: boolean): TabsState {
  const tabs = (state?.tabs ?? []).filter(
    (tab, index, all) =>
      tab &&
      typeof tab.id === "string" &&
      tab.id !== HOME_TAB.id &&
      (allowDev || tab.kind !== "rascunho") &&
      all.findIndex((other) => other.id === tab.id) === index
  );
  const all = [HOME_TAB, ...tabs];
  const activeId = all.some((tab) => tab.id === state?.activeId) ? state!.activeId! : HOME_TAB.id;
  return { tabs: all, activeId };
}

// ---- Endereço do navegador ↔ aba ----

const PATH_BY_KIND: Record<Exclude<TabKind, "rascunho">, string> = {
  inicio: "/",
  demandas: "/demandas",
  clientes: "/clientes",
  cadastros: "/cadastros",
  configuracoes: "/configuracoes",
  "minha-conta": "/minha-conta",
  nova: "/nova-aba",
};

export function pathForTab(tab: Tab): string {
  if (tab.kind === "rascunho") return `/rascunho/${tab.params?.numero ?? "1"}`;
  if (tab.kind === "nova") return `${PATH_BY_KIND.nova}/${tab.id.replace(/^nova-/, "")}`;
  return PATH_BY_KIND[tab.kind];
}

/** Lê o endereço e diz qual aba ele representa (null se o endereço não for conhecido). */
export function tabForPath(pathname: string): { kind: TabKind; params?: Record<string, string> } | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  const rascunho = path.match(/^\/rascunho\/(\d{1,4})$/);
  if (rascunho) return { kind: "rascunho", params: { numero: rascunho[1] } };
  if (path.startsWith("/nova-aba")) return { kind: "nova" };
  const entry = Object.entries(PATH_BY_KIND).find(([, value]) => value === path);
  return entry ? { kind: entry[0] as TabKind } : null;
}
