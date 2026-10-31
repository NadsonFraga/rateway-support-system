"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;

/** Verdadeiro só depois que a página terminou de carregar no navegador (antes disso, botões ainda não funcionam). */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
