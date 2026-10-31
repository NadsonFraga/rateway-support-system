import { describe, expect, it } from "vitest";
import {
  closeTab,
  cycleTab,
  HOME_TAB,
  initialTabsState,
  openTab,
  pathForTab,
  replaceTab,
  sanitizeTabsState,
  tabForPath,
} from "@/features/shell/tabs-model";
import { actionForEvent } from "@/features/shell/action-registry";

const key = (code: string, mods: Partial<Record<"altKey" | "ctrlKey" | "metaKey" | "shiftKey", boolean>> = {}) => ({
  code,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  ...mods,
});

describe("abas", () => {
  it("começa só com o Início, que nunca fecha", () => {
    const state = initialTabsState();
    expect(state.tabs).toEqual([HOME_TAB]);
    expect(closeTab(state, "inicio")).toBe(state);
  });

  it("módulos não duplicam: abrir de novo só foca", () => {
    let state = openTab(initialTabsState(), "demandas");
    state = openTab(state, "clientes");
    state = openTab(state, "demandas");
    expect(state.tabs.map((tab) => tab.id)).toEqual(["inicio", "demandas", "clientes"]);
    expect(state.activeId).toBe("demandas");
  });

  it("fechar a ativa passa para a vizinha da esquerda", () => {
    let state = openTab(openTab(initialTabsState(), "demandas"), "clientes");
    state = closeTab(state, "clientes");
    expect(state.activeId).toBe("demandas");
    state = closeTab(state, "demandas");
    expect(state.activeId).toBe("inicio");
  });

  it("próxima e anterior dão a volta nas pontas", () => {
    let state = openTab(openTab(initialTabsState(), "demandas"), "clientes");
    state = cycleTab(state, 1);
    expect(state.activeId).toBe("inicio");
    state = cycleTab(state, -1);
    expect(state.activeId).toBe("clientes");
  });

  it("nova aba vira o módulo escolhido, ou some se o módulo já estiver aberto", () => {
    let state = openTab(openTab(initialTabsState(), "demandas"), "nova");
    const nova = state.activeId;
    state = replaceTab(state, nova, "cadastros");
    expect(state.tabs.map((tab) => tab.id)).toEqual(["inicio", "demandas", "cadastros"]);
    state = openTab(state, "nova");
    state = replaceTab(state, state.activeId, "demandas");
    expect(state.tabs.map((tab) => tab.id)).toEqual(["inicio", "demandas", "cadastros"]);
    expect(state.activeId).toBe("demandas");
  });

  it("estado restaurado do navegador é corrigido (D-84)", () => {
    const restored = sanitizeTabsState(
      {
        tabs: [
          { id: "demandas", kind: "demandas" },
          { id: "demandas", kind: "demandas" },
          { id: "rascunho-1", kind: "rascunho", params: { numero: "1" } },
        ],
        activeId: "sumiu",
      },
      false
    );
    expect(restored.tabs.map((tab) => tab.id)).toEqual(["inicio", "demandas"]);
    expect(restored.activeId).toBe("inicio");
  });

  it("endereço e aba se correspondem", () => {
    expect(pathForTab({ id: "demandas", kind: "demandas" })).toBe("/demandas");
    expect(tabForPath("/demandas/")).toEqual({ kind: "demandas" });
    expect(tabForPath("/")).toEqual({ kind: "inicio" });
    expect(tabForPath("/rascunho/2")).toEqual({ kind: "rascunho", params: { numero: "2" } });
    expect(tabForPath("/nao-existe")).toBeNull();
  });
});

describe("atalhos (D-81)", () => {
  it("Alt+T, Alt+W, Alt+. e Alt+, pela posição da tecla", () => {
    expect(actionForEvent(key("KeyT", { altKey: true }))).toBe("tabs.new");
    expect(actionForEvent(key("KeyW", { altKey: true }))).toBe("tabs.close");
    expect(actionForEvent(key("Period", { altKey: true }))).toBe("tabs.next");
    expect(actionForEvent(key("Comma", { altKey: true }))).toBe("tabs.prev");
    expect(actionForEvent(key("KeyK", { ctrlKey: true }))).toBe("command_bar.open");
  });

  it("não dispara sem o modificador ou com modificador a mais", () => {
    expect(actionForEvent(key("KeyT"))).toBeNull();
    expect(actionForEvent(key("KeyW", { ctrlKey: true }))).toBeNull();
    expect(actionForEvent(key("KeyT", { altKey: true, shiftKey: true }))).toBeNull();
  });
});
