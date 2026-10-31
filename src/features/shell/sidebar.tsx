"use client";

import * as React from "react";
import { Settings, SlidersHorizontal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { MODULES } from "./tab-registry";
import { useTabs } from "./tabs-store";

const WIDTH_KEY = "sidebar-largura";
const DISPLAY_KEY = "sidebar-exibicao";
export const SIDEBAR_MIN = 200;
export const SIDEBAR_MAX = 420;
export const SIDEBAR_DEFAULT = 260;

type GroupBy = "servico" | "status" | "nenhum";
type SortBy = "alteracoes" | "inclusao" | "az" | "za" | "demandas";

const GROUP_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: "servico", label: "Serviço" },
  { value: "status", label: "Status do cliente" },
  { value: "nenhum", label: "Sem agrupamento" },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "alteracoes", label: "Últimas alterações" },
  { value: "inclusao", label: "Data de inclusão" },
  { value: "az", label: "Ordem alfabética A–Z" },
  { value: "za", label: "Ordem alfabética Z–A" },
  { value: "demandas", label: "Mais demandas abertas" },
];

function readStored<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Armazenamento bloqueado: vale só nesta página.
  }
}

// Sidebar redimensionável (barra-superior-e-lateral.md 3, D-82): navegação fixa, árvore de clientes e rodapé.
export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const [width, setWidth] = React.useState(() => readStored(WIDTH_KEY, SIDEBAR_DEFAULT));
  const activeId = useTabs((state) => state.activeId);
  const tabs = useTabs((state) => state.tabs);
  const openTab = useTabs((state) => state.open);
  const activeKind = tabs.find((tab) => tab.id === activeId)?.kind;

  const clamp = (value: number) => Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, Math.round(value)));
  const applyWidth = (value: number) => {
    const next = clamp(value);
    setWidth(next);
    writeStored(WIDTH_KEY, next);
  };

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = width;
    const onMove = (move: PointerEvent) => setWidth(clamp(startWidth + move.clientX - startX));
    const onUp = (up: PointerEvent) => {
      applyWidth(startWidth + up.clientX - startX);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
    };
    document.body.style.cursor = "col-resize";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <aside
      style={{ width }}
      aria-label="Barra lateral"
      data-testid="sidebar"
      className="relative flex shrink-0 flex-col border-r border-line-subtle bg-sidebar"
    >
      <nav aria-label="Módulos" className="flex flex-col gap-0.5 p-2">
        {MODULES.map((module) => {
          const active = activeKind === module.kind;
          return (
            <button
              key={module.kind}
              type="button"
              onClick={() => openTab(module.kind)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm",
                active ? "bg-accent-subdued font-medium text-ink" : "text-ink-secondary hover:bg-surface-hover hover:text-ink"
              )}
            >
              <module.icon className="size-[18px] shrink-0 stroke-[1.75]" aria-hidden />
              {module.label}
            </button>
          );
        })}
      </nav>

      <ClientTree />

      {isAdmin && (
        <div className="border-t border-line-subtle p-2">
          <button
            type="button"
            onClick={() => openTab("configuracoes")}
            aria-current={activeKind === "configuracoes" ? "page" : undefined}
            className={cn(
              "flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm",
              activeKind === "configuracoes"
                ? "bg-accent-subdued font-medium text-ink"
                : "text-ink-secondary hover:bg-surface-hover hover:text-ink"
            )}
          >
            <Settings className="size-[18px] shrink-0 stroke-[1.75]" aria-hidden />
            Configurações
          </button>
        </div>
      )}

      {/* Divisor arrastável: mouse, duplo clique (volta ao padrão) ou setas do teclado. */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Largura da barra lateral"
        aria-valuemin={SIDEBAR_MIN}
        aria-valuemax={SIDEBAR_MAX}
        aria-valuenow={width}
        tabIndex={0}
        data-testid="divisor-sidebar"
        onPointerDown={startDrag}
        onDoubleClick={() => applyWidth(SIDEBAR_DEFAULT)}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") applyWidth(width + 16);
          if (event.key === "ArrowLeft") applyWidth(width - 16);
        }}
        className="absolute inset-y-0 -right-[3px] z-10 w-1.5 cursor-col-resize outline-offset-0 hover:bg-line-medium focus-visible:bg-line-strong"
      />
    </aside>
  );
}

/** Seção "Clientes": Opções de Exibição (Agrupar e Classificar) e a árvore, que recebe dados na Etapa 1.3. */
function ClientTree() {
  const [display, setDisplay] = React.useState(() =>
    readStored<{ groupBy: GroupBy; sortBy: SortBy }>(DISPLAY_KEY, { groupBy: "nenhum", sortBy: "alteracoes" })
  );

  const update = (patch: Partial<typeof display>) => {
    const next = { ...display, ...patch };
    setDisplay(next);
    writeStored(DISPLAY_KEY, next);
  };

  return (
    <section aria-label="Clientes" className="flex min-h-0 flex-1 flex-col border-t border-line-subtle">
      <div className="flex h-10 items-center justify-between pr-2 pl-4">
        <h2 className="text-xs font-semibold tracking-[0.04em] text-ink-muted uppercase">Clientes</h2>
        <Popover>
          <PopoverTrigger
            aria-label="Opções de exibição"
            className="inline-flex size-7 items-center justify-center rounded-md text-ink-muted hover:bg-surface-hover hover:text-ink aria-expanded:bg-surface-hover"
          >
            <SlidersHorizontal className="size-4 stroke-[1.75]" aria-hidden />
          </PopoverTrigger>
          <PopoverContent align="start" side="right" className="w-64 gap-3 p-3">
            <OptionGroup
              label="Agrupar por"
              value={display.groupBy}
              options={GROUP_OPTIONS}
              onChange={(groupBy) => update({ groupBy })}
            />
            <OptionGroup
              label="Classificar por"
              value={display.sortBy}
              options={SORT_OPTIONS}
              onChange={(sortBy) => update({ sortBy })}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3">
        <p className="text-[13px] text-ink-muted">Os clientes aparecem aqui a partir da Etapa 1.3.</p>
      </div>
    </section>
  );
}

function OptionGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  const name = React.useId();
  return (
    <fieldset className="flex flex-col gap-0.5">
      <legend className="mb-1 text-xs text-ink-muted">{label}</legend>
      {options.map((option) => (
        <label
          key={option.value}
          className="flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-sm text-ink hover:bg-surface-hover has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-line-focus"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="size-3.5 accent-[var(--text-primary)]"
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}
