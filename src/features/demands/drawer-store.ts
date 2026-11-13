"use client";

import { create } from "zustand";

/** O que a nova demanda já traz preenchido (ex.: o cliente, quando criada pela ficha). */
export type DemandPreset = { clientId?: string };

type DrawerState = {
  /** Demanda aberta no painel lateral (código) ou null. */
  code: string | null;
  /** Painel em modo de criação. */
  creating: DemandPreset | null;
  /** Ordem da lista de onde a demanda foi aberta: ↑/↓ navegam por ela. */
  siblings: string[];
  open: (code: string, siblings?: string[]) => void;
  create: (preset?: DemandPreset) => void;
  close: () => void;
};

// Painel lateral único, por cima de qualquer aba (lista, Kanban, ficha do cliente, Início).
export const useDemandDrawer = create<DrawerState>((set) => ({
  code: null,
  creating: null,
  siblings: [],
  open: (code, siblings) => set((state) => ({ code, creating: null, siblings: siblings ?? state.siblings })),
  create: (preset = {}) => set({ code: null, creating: preset }),
  close: () => set({ code: null, creating: null }),
}));
