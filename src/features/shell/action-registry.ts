// Registro de ações e atalhos (sistema-de-abas.md 3, D-81). Personalização por usuário: Fase 2.

export type ActionId = "tabs.new" | "tabs.close" | "tabs.next" | "tabs.prev" | "command_bar.open" | "demand.new";

export type Shortcut = { code: string; alt?: boolean; ctrl?: boolean; shift?: boolean; label: string };

/**
 * Atalhos padrão. Usa a posição física da tecla (event.code), então funciona igual
 * em qualquer layout de teclado, inclusive ABNT2 de notebook.
 */
export const DEFAULT_SHORTCUTS: Record<ActionId, Shortcut> = {
  "tabs.new": { code: "KeyT", alt: true, label: "Alt+T" },
  "tabs.close": { code: "KeyW", alt: true, label: "Alt+W" },
  "tabs.next": { code: "Period", alt: true, label: "Alt+." },
  "tabs.prev": { code: "Comma", alt: true, label: "Alt+," },
  "command_bar.open": { code: "KeyK", ctrl: true, label: "Ctrl+K" },
  // Sem modificador (D-59): só vale fora de campos de texto.
  "demand.new": { code: "KeyC", label: "C" },
};

export const ACTION_LABEL: Record<ActionId, string> = {
  "tabs.new": "Nova aba",
  "tabs.close": "Fechar aba",
  "tabs.next": "Próxima aba",
  "tabs.prev": "Aba anterior",
  "command_bar.open": "Buscar",
  "demand.new": "Nova demanda",
};

type KeyLike = Pick<KeyboardEvent, "code" | "altKey" | "ctrlKey" | "metaKey" | "shiftKey">;

export function matchesShortcut(event: KeyLike, shortcut: Shortcut) {
  const ctrl = event.ctrlKey || event.metaKey;
  return (
    event.code === shortcut.code &&
    event.altKey === !!shortcut.alt &&
    ctrl === !!shortcut.ctrl &&
    event.shiftKey === !!shortcut.shift
  );
}

/** Qual ação o atalho pressionado dispara (ou null). */
export function actionForEvent(event: KeyLike, shortcuts = DEFAULT_SHORTCUTS): ActionId | null {
  const found = (Object.entries(shortcuts) as [ActionId, Shortcut][]).find(([, shortcut]) =>
    matchesShortcut(event, shortcut)
  );
  return found ? found[0] : null;
}
