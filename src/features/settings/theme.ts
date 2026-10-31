// Tema da interface: Escuro | Claro | Sistema (configuracoes-design-v2.md, seção 3.3).
// A preferência fica no navegador; o script inline aplica o tema antes da primeira pintura.

export type ThemePreference = "escuro" | "claro" | "sistema";
export type ResolvedTheme = "dark" | "light";

export const THEME_STORAGE_KEY = "tema";

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === "escuro") return "dark";
  if (preference === "claro") return "light";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function readThemePreference(): ThemePreference {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (value === "escuro" || value === "claro" || value === "sistema") return value;
  } catch {
    // Armazenamento bloqueado: segue o padrão.
  }
  return "sistema";
}

/** Roda no <head>, antes de o navegador pintar a tela, para nunca piscar o tema errado. */
export const themeBootScript = `(function(){try{var p=localStorage.getItem("${THEME_STORAGE_KEY}");var t=p==="claro"?"light":p==="escuro"?"dark":(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");document.documentElement.setAttribute("data-theme",t)}catch(e){document.documentElement.setAttribute("data-theme","dark")}})()`;
