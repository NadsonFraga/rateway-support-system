"use client";

import * as React from "react";

// Colunas da lista de Demandas (D-114): arrastar a divisória à esquerda de cada coluna muda a largura; arrastar o
// título muda a ordem. O título da demanda ocupa o que sobra. Fica guardado só neste navegador (preferência de quem usa).

export type ColumnKey = "cliente" | "situacao" | "atribuidos" | "prazo";
export type ColumnWidths = Record<ColumnKey, number>;

export const COLUMN_DEFAULTS: ColumnWidths = {
  cliente: 240,
  situacao: 150,
  atribuidos: 104,
  prazo: 112,
};
export const COLUMN_ORDER_DEFAULT: ColumnKey[] = ["cliente", "situacao", "atribuidos", "prazo"];
export const COLUMN_LABEL: Record<ColumnKey, string> = {
  cliente: "Cliente",
  situacao: "Situação",
  atribuidos: "Atribuídos",
  prazo: "Prazo",
};
export const COLUMN_LIMITS: Record<ColumnKey, [number, number]> = {
  cliente: [120, 480],
  situacao: [120, 260],
  atribuidos: [72, 220],
  prazo: [88, 200],
};

const WIDTHS_KEY = "demandas:larguras-das-colunas";
const ORDER_KEY = "demandas:ordem-das-colunas";

/** Ordem das colunas que a linha segue. Fora da lista (ficha do cliente, Início) vale a ordem padrão. */
export const ColumnOrderContext = React.createContext<ColumnKey[]>(COLUMN_ORDER_DEFAULT);

/** Concluir · ponto · plataforma · título · colunas na ordem escolhida (sem Cliente quando não se aplica). */
export function columnsTemplate(widths: ColumnWidths, order: ColumnKey[] = COLUMN_ORDER_DEFAULT, showClient = true) {
  return ["20px 16px 20px minmax(180px,1fr)", ...order.filter((key) => showClient || key !== "cliente").map((key) => `${widths[key]}px`)].join(" ");
}

export const clampWidth = (key: ColumnKey, value: number) => Math.round(Math.min(COLUMN_LIMITS[key][1], Math.max(COLUMN_LIMITS[key][0], value)));

function readWidths(): ColumnWidths {
  try {
    const saved = JSON.parse(window.localStorage.getItem(WIDTHS_KEY) ?? "null") as Partial<ColumnWidths> | null;
    if (!saved) return COLUMN_DEFAULTS;
    return Object.fromEntries(
      (Object.keys(COLUMN_DEFAULTS) as ColumnKey[]).map((key) => [key, typeof saved[key] === "number" ? clampWidth(key, saved[key]) : COLUMN_DEFAULTS[key]])
    ) as ColumnWidths;
  } catch {
    return COLUMN_DEFAULTS;
  }
}

/** Só aceita uma ordem com as quatro colunas, cada uma uma vez. */
function readOrder(): ColumnKey[] {
  try {
    const saved = JSON.parse(window.localStorage.getItem(ORDER_KEY) ?? "null") as unknown;
    const valid = Array.isArray(saved) && saved.length === COLUMN_ORDER_DEFAULT.length && COLUMN_ORDER_DEFAULT.every((key) => saved.includes(key));
    return valid ? (saved as ColumnKey[]) : COLUMN_ORDER_DEFAULT;
  } catch {
    return COLUMN_ORDER_DEFAULT;
  }
}

function store(key: string, value: unknown) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sem armazenamento (janela anônima): vale só até fechar a aba.
  }
}

export function useColumns() {
  const [widths, setWidths] = React.useState<ColumnWidths>(COLUMN_DEFAULTS);
  const [order, setOrder] = React.useState<ColumnKey[]>(COLUMN_ORDER_DEFAULT);
  // Lido depois de montar: o servidor não conhece o navegador.
  React.useEffect(() => {
    const savedWidths = readWidths();
    const savedOrder = readOrder();
    if (JSON.stringify(savedWidths) !== JSON.stringify(COLUMN_DEFAULTS)) setWidths(savedWidths); // eslint-disable-line react-hooks/set-state-in-effect -- preferência guardada no navegador
    if (savedOrder.join() !== COLUMN_ORDER_DEFAULT.join()) setOrder(savedOrder);
  }, []);
  const resize = React.useCallback((key: ColumnKey, value: number | null) => {
    setWidths((current) => {
      const next = {
        ...current,
        [key]: value === null ? COLUMN_DEFAULTS[key] : clampWidth(key, value),
      };
      store(WIDTHS_KEY, next);
      return next;
    });
  }, []);
  const reorder = React.useCallback((next: ColumnKey[]) => {
    setOrder(next);
    store(ORDER_KEY, next);
  }, []);
  /** Uma posição para a esquerda (-1) ou para a direita (+1). */
  const move = React.useCallback((key: ColumnKey, delta: -1 | 1) => {
    setOrder((current) => {
      const from = current.indexOf(key);
      const to = from + delta;
      if (to < 0 || to >= current.length) return current;
      const next = [...current];
      [next[from], next[to]] = [next[to], next[from]];
      store(ORDER_KEY, next);
      return next;
    });
  }, []);
  const reset = React.useCallback(() => {
    setWidths(COLUMN_DEFAULTS);
    setOrder(COLUMN_ORDER_DEFAULT);
    store(WIDTHS_KEY, null);
    store(ORDER_KEY, null);
  }, []);
  const customized = order.join() !== COLUMN_ORDER_DEFAULT.join() || JSON.stringify(widths) !== JSON.stringify(COLUMN_DEFAULTS);
  return { widths, order, resize, reorder, move, reset, customized };
}
