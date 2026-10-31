"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  readThemePreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from "./theme";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function applyTheme(preference: ThemePreference, animate: boolean) {
  const root = document.documentElement;
  if (animate) {
    root.classList.add("theme-transition");
    window.setTimeout(() => root.classList.remove("theme-transition"), 220);
  }
  root.setAttribute("data-theme", resolveTheme(preference));
}

export function useTheme() {
  const preference = useSyncExternalStore(
    subscribe,
    readThemePreference,
    () => "sistema" as ThemePreference
  );

  const setPreference = useCallback((next: ThemePreference) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Sem armazenamento: o tema muda só nesta página.
    }
    applyTheme(next, true);
    listeners.forEach((listener) => listener());
  }, []);

  // Em "Sistema", acompanha a troca de tema do sistema operacional em tempo real.
  useEffect(() => {
    if (preference !== "sistema") return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => applyTheme("sistema", true);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preference]);

  return { preference, setPreference };
}
