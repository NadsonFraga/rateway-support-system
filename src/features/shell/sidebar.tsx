"use client";

import * as React from "react";
import { Building2, Settings, SlidersHorizontal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { listClients } from "@/features/clients/actions";
import { CLIENT_STATUS_LABEL, phaseKind } from "@/features/clients/rules";
import { CLIENTS_TOPIC } from "@/features/clients/topics";
import type { ClientSummary } from "@/features/clients/types";
import { useRealtime } from "@/features/realtime/client";
import { MODULES } from "./tab-registry";
import { useTabs, wantsNewTab } from "./tabs-store";

const WIDTH_KEY = "sidebar-largura";
const DISPLAY_KEY = "sidebar-exibicao";
export const SIDEBAR_MIN = 200;
export const SIDEBAR_MAX = 420;
export const SIDEBAR_DEFAULT = 220;

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
  const navigate = useTabs((state) => state.navigate);
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
              onClick={(event) => navigate(module.kind, undefined, wantsNewTab(event))}
              onAuxClick={(event) => event.button === 1 && navigate(module.kind, undefined, true)}
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
            onClick={(event) => navigate("configuracoes", undefined, wantsNewTab(event))}
            onAuxClick={(event) => event.button === 1 && navigate("configuracoes", undefined, true)}
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

const SORTERS: Record<SortBy, (a: ClientSummary, b: ClientSummary) => number> = {
  alteracoes: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
  inclusao: (a, b) => a.createdAt.localeCompare(b.createdAt),
  az: (a, b) => a.name.localeCompare(b.name, "pt-BR"),
  za: (a, b) => b.name.localeCompare(a.name, "pt-BR"),
  demandas: (a, b) => b.openDemands - a.openDemands || a.name.localeCompare(b.name, "pt-BR"),
};

/** Grupos da árvore. Inativos não aparecem; no agrupamento por serviço, o cliente aparece em cada serviço ativo. */
function groupClients(clients: ClientSummary[], groupBy: GroupBy, sortBy: SortBy) {
  const visible = clients.filter((client) => client.status !== "inativo").sort(SORTERS[sortBy]);
  if (groupBy === "nenhum") return visible.length ? [{ key: "todos", label: null, items: visible }] : [];
  if (groupBy === "status") {
    return (["ativo", "pausado"] as const)
      .map((status) => ({ key: status, label: CLIENT_STATUS_LABEL[status], items: visible.filter((client) => client.status === status) }))
      .filter((group) => group.items.length);
  }
  const groups = new Map<string, { key: string; label: string; items: ClientSummary[] }>();
  for (const client of visible) {
    for (const service of client.services.filter((item) => phaseKind(item.phase) !== "encerrada")) {
      const group = groups.get(service.serviceId) ?? { key: service.serviceId, label: service.name, items: [] };
      if (!group.items.includes(client)) group.items.push(client);
      groups.set(service.serviceId, group);
    }
  }
  return [...groups.values()];
}

/** Seção "Clientes": Opções de Exibição (Agrupar e Classificar) e a árvore de clientes. */
function ClientTree() {
  const [clients, setClients] = React.useState<ClientSummary[] | null>(null);
  const navigate = useTabs((state) => state.navigate);
  const activeCode = useTabs((state) => {
    const tab = state.tabs.find((item) => item.id === state.activeId);
    return tab?.kind === "cliente" ? tab.params?.codigo : undefined;
  });
  const reload = React.useCallback(async () => setClients(await listClients()), []);
  React.useEffect(() => {
    let cancelled = false;
    void listClients().then((list) => !cancelled && setClients(list));
    return () => {
      cancelled = true;
    };
  }, []);
  useRealtime(CLIENTS_TOPIC, () => void reload());

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
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {clients && clients.every((client) => client.status === "inativo") && (
          <p className="px-2 text-[13px] text-ink-muted">Nenhum cliente ativo.</p>
        )}
        {clients &&
          groupClients(clients, display.groupBy, display.sortBy).map((group) => (
            <div key={group.key} role="group" aria-label={group.label ?? "Clientes"} className="flex flex-col">
              {group.label && <p className="mt-2 flex h-7 items-center px-2 text-xs text-ink-muted">{group.label}</p>}
              {group.items.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={(event) => navigate("cliente", { codigo: client.code }, wantsNewTab(event))}
                  onAuxClick={(event) => event.button === 1 && navigate("cliente", { codigo: client.code }, true)}
                  aria-current={activeCode === client.code ? "page" : undefined}
                  className={cn(
                    "group relative flex h-9 w-full min-w-0 items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] font-medium tracking-[-0.012em] transition-colors",
                    activeCode === client.code
                      ? "bg-accent-subdued font-semibold text-ink before:absolute before:left-0 before:top-1/2 before:h-4 before:w-[3px] before:-translate-y-1/2 before:rounded-r before:bg-yellow-fact"
                      : "text-ink-secondary hover:bg-surface-hover hover:text-ink"
                  )}
                >
                  <Building2
                    className={cn(
                      "size-4 shrink-0 stroke-[1.75]",
                      activeCode === client.code ? "text-ink" : "text-ink-muted group-hover:text-ink"
                    )}
                    aria-hidden
                  />
                  <span className="truncate flex-1">{client.name}</span>
                  {client.openDemands > 0 && (
                    <span className="text-xs font-normal tabular-nums text-ink-muted">
                      {client.openDemands}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
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
