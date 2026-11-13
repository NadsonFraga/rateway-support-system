"use client";

import * as React from "react";
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, horizontalListSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowDownUp, ArrowUp, Check, ChevronLeft, ChevronRight, Kanban, List, ListFilter, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SkeletonRow } from "@/components/ui/skeleton";
import { StaggerList } from "@/components/ui/stagger-list";
import { parseCodeQuery } from "@/features/ids/masks";
import { useRealtime } from "@/features/realtime/client";
import { useShellUser } from "@/features/shell/shell-user";
import { useCurrentTab } from "@/features/shell/tabs-store";
import { cn } from "@/lib/utils";
import { countDemands, listDemands, moveDemand } from "../actions";
import { DemandBoard } from "../board/demand-board";
import { useDemandDrawer } from "../drawer-store";
import { DEMAND_PRIORITIES, DEMAND_PRIORITY_LABEL, isClosed, type DemandPriority } from "../rules";
import { DEMANDS_TOPIC } from "../topics";
import type { DemandListItem } from "../types";
import { GROUP_LABEL, groupDemands, SORT_LABEL, sortDemands, type GroupKey, type Sort, type SortKey } from "./arrange";
import { COLUMN_LABEL, COLUMN_LIMITS, ColumnOrderContext, columnsTemplate, useColumns, type ColumnKey } from "./columns";
import { DEMAND_COLUMNS, DemandRow } from "./demand-row";

type Scope = "ativas" | "concluidas";
type View = "lista" | "quadro";
type Filters = {
  mine: boolean;
  clientId: string | null;
  platformId: string | null;
  priorities: DemandPriority[];
};
const NO_FILTERS: Filters = {
  mine: false,
  clientId: null,
  platformId: null,
  priorities: [],
};

function matchesQuery(demand: DemandListItem, query: string) {
  const text = query.trim().toLowerCase();
  if (!text) return true;
  if (demand.title.toLowerCase().includes(text) || demand.code.toLowerCase().includes(text.replace(/^#/, ""))) return true;
  const parsed = parseCodeQuery(text);
  return !!parsed && Number(demand.code.replace(/\D/g, "")) === parsed.number;
}

// Módulo Demandas (demandas-spec.md §2 e §3): Ativas e Concluídas; Lista operacional e Quadro Kanban.
export function DemandsTab() {
  const me = useShellUser();
  const { tab } = useCurrentTab();
  const openDrawer = useDemandDrawer((state) => state.open);
  const createDemand = useDemandDrawer((state) => state.create);
  const [scope, setScope] = React.useState<Scope>("ativas");
  const [view, setView] = React.useState<View>("lista");
  const [demands, setDemands] = React.useState<DemandListItem[] | null>(null);
  const [counts, setCounts] = React.useState<{
    ativas: number;
    concluidas: number;
  } | null>(null);
  const [query, setQuery] = React.useState("");
  const [filters, setFilters] = React.useState<Filters>(NO_FILTERS);
  const [selected, setSelected] = React.useState(0);
  const [sort, setSort] = React.useState<Sort>({ key: "urgencia", dir: "asc" });
  const [group, setGroup] = React.useState<GroupKey>("prioridade");
  const [collapsed, setCollapsed] = React.useState<string[]>([]);
  const columns = useColumns();
  // Arrastar o título só começa depois de 6px: um clique continua classificando.
  const headerSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  /** Logo depois de soltar uma coluna, o clique que o navegador ainda dispara não classifica. */
  const justDragged = React.useRef(false);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const rowsRef = React.useRef<(HTMLDivElement | null)[]>([]);
  const source = view === "quadro" ? "quadro" : scope;

  const reload = React.useCallback(async () => {
    const [list, totals] = await Promise.all([listDemands(source), countDemands()]);
    setDemands(list);
    setCounts(totals);
  }, [source]);

  React.useEffect(() => {
    let cancelled = false;
    void Promise.all([listDemands(source), countDemands()]).then(([list, totals]) => {
      if (cancelled) return;
      setDemands(list);
      setCounts(totals);
    });
    return () => {
      cancelled = true;
    };
  }, [source]);

  // Várias gravações seguidas (ex.: arrastar no quadro) viram uma só recarga.
  const timer = React.useRef<number | null>(null);
  useRealtime(DEMANDS_TOPIC, () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void reload(), 120);
  });

  const all = demands ?? [];
  const clients = [...new Map(all.flatMap((item) => (item.client ? [[item.client.id, item.client] as const] : []))).values()];
  const platforms = [...new Map(all.flatMap((item) => (item.platform ? [[item.platform.id, item.platform] as const] : []))).values()];
  const matching = all.filter(
    (item) =>
      (!filters.mine || item.assignees.some((person) => person.id === me.id)) &&
      (!filters.clientId || item.client?.id === filters.clientId) &&
      (!filters.platformId || item.platform?.id === filters.platformId) &&
      (filters.priorities.length === 0 || filters.priorities.includes(item.priority)) &&
      matchesQuery(item, query)
  );
  // Concluídas chegam do servidor da mais recente para a mais antiga; "urgência" mantém essa ordem.
  const visible = view === "lista" && scope === "concluidas" && sort.key === "urgencia" ? matching : sortDemands(matching, sort);
  const groups = view === "lista" ? groupDemands(visible, group) : [];
  /** Linhas na ordem da tela (sem os grupos recolhidos): base do teclado e do ↑/↓ do painel. */
  const entries = groups.flatMap((item) => (collapsed.includes(item.key) ? [] : item.items.map((demand) => ({ group: item.key, demand }))));
  const filtered = scope === "concluidas" || filters.mine || !!filters.clientId || !!filters.platformId || filters.priorities.length > 0 || query !== "";

  // Concluir pela lista (D-107): risca na hora e só grava depois de 2s; clicar de novo nesse intervalo desfaz.
  const [finishing, setFinishing] = React.useState<string[]>([]);
  const [listError, setListError] = React.useState<string | null>(null);
  const finishTimers = React.useRef(new Map<string, number>());

  const commitDone = React.useCallback(async (id: string) => {
    finishTimers.current.delete(id);
    const result = await moveDemand(id, "concluida");
    setFinishing((current) => current.filter((item) => item !== id));
    if (!result.ok) setListError(result.error);
  }, []);

  // Ao sair da aba, o que estava riscado é gravado na hora.
  React.useEffect(() => {
    const timers = finishTimers.current;
    return () => {
      for (const [id, handle] of timers) {
        window.clearTimeout(handle);
        void moveDemand(id, "concluida");
      }
      timers.clear();
    };
  }, []);

  async function toggleDone(demand: DemandListItem) {
    setListError(null);
    if (isClosed(demand.status)) {
      const result = await moveDemand(demand.id, "a_fazer");
      if (!result.ok) setListError(result.error);
      return;
    }
    const pending = finishTimers.current.get(demand.id);
    if (pending) {
      window.clearTimeout(pending);
      finishTimers.current.delete(demand.id);
      setFinishing((current) => current.filter((item) => item !== demand.id));
      return;
    }
    setFinishing((current) => [...current, demand.id]);
    finishTimers.current.set(
      demand.id,
      window.setTimeout(() => void commitDone(demand.id), 2000)
    );
  }

  const open = (demand: DemandListItem, list: DemandListItem[] = entries.map((item) => item.demand)) =>
    openDrawer(
      demand.code,
      list.map((item) => item.code)
    );
  const clear = () => {
    setFilters(NO_FILTERS);
    setQuery("");
    setScope("ativas");
  };
  const showClosed = (value: boolean) => {
    setScope(value ? "concluidas" : "ativas");
    setSelected(0);
  };
  const sortBy = (key: SortKey) =>
    !justDragged.current && setSort((current) => (current.key === key ? { key, dir: current.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  function onColumnDrop(event: DragEndEvent) {
    justDragged.current = true;
    window.setTimeout(() => (justDragged.current = false), 0);
    if (!event.over || event.active.id === event.over.id) return;
    const from = columns.order.indexOf(event.active.id as ColumnKey);
    const to = columns.order.indexOf(event.over.id as ColumnKey);
    columns.reorder(arrayMove(columns.order, from, to));
  }

  function onListKey(event: React.KeyboardEvent) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const next = Math.min(entries.length - 1, Math.max(0, selected + (event.key === "ArrowDown" ? 1 : -1)));
    setSelected(next);
    rowsRef.current[next]?.focus();
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      onKeyDown={(event) => {
        const target = event.target as HTMLElement;
        if (event.key === "/" && target.tagName !== "INPUT" && target.tagName !== "TEXTAREA" && !target.isContentEditable) {
          event.preventDefault();
          searchRef.current?.focus();
        }
      }}
    >
      <div className="flex shrink-0 flex-col gap-3 border-b border-line-subtle px-8 pt-5 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex flex-col min-w-0">
            <h1 className="text-lg font-semibold tracking-[-0.015em] text-ink">Demandas</h1>
            {counts && (
              <span className="text-xs text-ink-muted">
                {counts.ativas} abertas · {counts.concluidas} finalizadas
              </span>
            )}
          </div>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <div className="inline-flex rounded-lg border border-line-subtle bg-surface p-0.5 text-xs">
              <button
                type="button"
                onClick={() => showClosed(false)}
                className={cn(
                  "rounded-md px-3 py-1 font-medium transition-colors",
                  scope === "ativas" ? "bg-surface-elevated text-ink shadow-xs" : "text-ink-secondary hover:text-ink"
                )}
              >
                Abertas
              </button>
              <button
                type="button"
                onClick={() => showClosed(true)}
                className={cn(
                  "rounded-md px-3 py-1 font-medium transition-colors",
                  scope === "concluidas" ? "bg-surface-elevated text-ink shadow-xs" : "text-ink-secondary hover:text-ink"
                )}
              >
                Finalizadas
              </button>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 stroke-[1.75] text-ink-muted" aria-hidden />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar demandas"
                aria-label="Buscar demandas"
                className="h-8 w-48 rounded-lg border border-line-subtle bg-surface pr-8 pl-8 text-xs text-ink outline-none placeholder:text-ink-muted focus-visible:border-line-focus xl:w-56"
              />
              <Kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2">/</Kbd>
            </div>
            <Popover>
              <PopoverTrigger className="inline-flex h-8 items-center gap-2 rounded-lg px-2.5 text-[13px] font-medium text-ink-secondary hover:bg-surface-hover hover:text-ink aria-expanded:bg-surface-hover">
                <ListFilter className="size-[18px] stroke-[1.75]" aria-hidden /> Filtros
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 gap-3 p-3">
                {view === "lista" && (
                  <label className="flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-sm text-ink hover:bg-surface-hover">
                    <input
                      type="checkbox"
                      checked={scope === "concluidas"}
                      onChange={(event) => showClosed(event.target.checked)}
                      className="size-3.5 accent-[var(--text-primary)]"
                    />
                    Ver concluídas{counts ? ` (${counts.concluidas})` : ""}
                  </label>
                )}
                <label className="flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-sm text-ink hover:bg-surface-hover">
                  <input
                    type="checkbox"
                    checked={filters.mine}
                    onChange={(event) => setFilters({ ...filters, mine: event.target.checked })}
                    className="size-3.5 accent-[var(--text-primary)]"
                  />
                  Atribuídas a mim
                </label>
                <FilterSelect
                  label="Cliente"
                  value={filters.clientId}
                  options={clients.map((item) => [item.id, item.name])}
                  onChange={(clientId) => setFilters({ ...filters, clientId })}
                />
                <FilterSelect
                  label="Plataforma"
                  value={filters.platformId}
                  options={platforms.map((item) => [item.id, item.name])}
                  onChange={(platformId) => setFilters({ ...filters, platformId })}
                />
                <fieldset className="flex flex-col gap-0.5">
                  <legend className="mb-1 text-xs text-ink-muted">Prioridade</legend>
                  {DEMAND_PRIORITIES.map((priority) => (
                    <label key={priority} className="flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-sm text-ink hover:bg-surface-hover">
                      <input
                        type="checkbox"
                        checked={filters.priorities.includes(priority)}
                        onChange={(event) =>
                          setFilters({
                            ...filters,
                            priorities: event.target.checked ? [...filters.priorities, priority] : filters.priorities.filter((item) => item !== priority),
                          })
                        }
                        className="size-3.5 accent-[var(--text-primary)]"
                      />
                      {DEMAND_PRIORITY_LABEL[priority]}
                    </label>
                  ))}
                </fieldset>
              </PopoverContent>
            </Popover>
            <DisplayMenu
              view={view}
              onView={setView}
              group={group}
              onGroup={(value) => {
                setGroup(value);
                setCollapsed([]);
                setSelected(0);
              }}
              sort={sort}
              onSort={setSort}
              columns={columns}
            />
            <Button size="sm" onClick={() => createDemand()} aria-keyshortcuts="C">
              <Plus /> Nova demanda <Kbd className="ml-1 border-transparent bg-transparent text-ink-inverse/70">C</Kbd>
            </Button>
          </div>
        </div>
        {filtered && (
          <div className="flex min-h-7 flex-wrap items-center gap-2">
            {scope === "concluidas" && view === "lista" && <Chip label="Concluídas" onRemove={() => showClosed(false)} />}
            {filters.mine && <Chip label="Atribuídas a mim" onRemove={() => setFilters({ ...filters, mine: false })} />}
            {filters.clientId && (
              <Chip
                label={`Cliente: ${clients.find((item) => item.id === filters.clientId)?.name ?? ""}`}
                onRemove={() => setFilters({ ...filters, clientId: null })}
              />
            )}
            {filters.platformId && (
              <Chip
                label={`Plataforma: ${platforms.find((item) => item.id === filters.platformId)?.name ?? ""}`}
                onRemove={() => setFilters({ ...filters, platformId: null })}
              />
            )}
            {filters.priorities.map((priority) => (
              <Chip
                key={priority}
                label={`Prioridade: ${DEMAND_PRIORITY_LABEL[priority]}`}
                onRemove={() =>
                  setFilters({
                    ...filters,
                    priorities: filters.priorities.filter((item) => item !== priority),
                  })
                }
              />
            ))}
            <button type="button" onClick={clear} className="ml-auto text-[13px] text-ink-secondary hover:text-ink">
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {view === "quadro" ? (
        demands ? (
          <div className="flex min-h-0 flex-1 flex-col pt-4">
            <DemandBoard
              demands={visible}
              onOpen={open}
              onMoved={(id, status) => setDemands((current) => current?.map((item) => (item.id === id ? { ...item, status } : item)) ?? current)}
              onShowHistory={() => {
                setView("lista");
                setScope("concluidas");
              }}
            />
          </div>
        ) : (
          <div className="px-8 pt-4">
            {Array.from({ length: 6 }, (_, index) => (
              <SkeletonRow key={index} />
            ))}
          </div>
        )
      ) : (
        <div
          role="table"
          aria-label={scope === "ativas" ? "Demandas ativas" : "Demandas concluídas"}
          className="min-h-0 flex-1 overflow-y-auto px-5"
          onKeyDown={onListKey}
          style={
            {
              "--demandas-colunas": columnsTemplate(columns.widths, columns.order),
              "--demandas-colunas-sem-cliente": columnsTemplate(columns.widths, columns.order, false),
            } as React.CSSProperties
          }
        >
          {listError && (
            <p role="alert" className="px-3 pt-3 text-[13px] text-coral">
              {listError}
            </p>
          )}
          <div role="row" className={cn("grid h-9 items-center gap-3 px-3 text-xs text-ink-muted", DEMAND_COLUMNS)}>
            <span role="columnheader">
              <span className="sr-only">Concluir</span>
            </span>
            <span role="columnheader">
              <span className="sr-only">Ponto de situação</span>
            </span>
            <span role="columnheader">
              <span className="sr-only">Plataforma</span>
            </span>
            <SortHeader label="Demanda" sortKey="titulo" sort={sort} onSort={sortBy} />
            {/* Os textos de leitor de tela do arrastar vão para o fim da página, fora da linha de títulos. */}
            <DndContext
              sensors={headerSensors}
              collisionDetection={closestCenter}
              onDragEnd={onColumnDrop}
              accessibility={{ container: typeof document === "undefined" ? undefined : document.body }}
            >
              <SortableContext items={columns.order} strategy={horizontalListSortingStrategy}>
                {columns.order.map((key) => (
                  <MovableHeader
                    key={key}
                    column={key}
                    sort={sort}
                    onSort={sortBy}
                    width={columns.widths[key]}
                    onResize={(value) => columns.resize(key, value)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
          {!demands ? (
            Array.from({ length: 8 }, (_, index) => <SkeletonRow key={index} />)
          ) : all.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <p className="text-sm text-ink-secondary">{scope === "ativas" ? "Nenhuma demanda ativa." : "Nenhuma demanda concluída ainda."}</p>
              {scope === "ativas" && (
                <Button size="sm" onClick={() => createDemand()}>
                  <Plus /> Nova demanda
                </Button>
              )}
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <p className="text-sm text-ink-secondary">Nenhuma demanda encontrada com esses filtros.</p>
              <Button size="sm" variant="outline" onClick={clear}>
                Limpar filtros
              </Button>
            </div>
          ) : (
            <ColumnOrderContext.Provider value={columns.order}>
              <StaggerList scope={`demandas-${tab.id}-${scope}`}>
                {groups.flatMap((item) => {
                  const closedGroup = collapsed.includes(item.key);
                  const rows = closedGroup
                    ? []
                    : item.items.map((demand) => {
                        const index = entries.findIndex((entry) => entry.group === item.key && entry.demand.id === demand.id);
                        return (
                          <DemandRow
                            key={`${item.key}-${demand.id}`}
                            demand={demand}
                            selected={selected === index}
                            finishing={finishing.includes(demand.id)}
                            onFocus={() => setSelected(index)}
                            onOpen={() => open(demand)}
                            onToggleDone={() => void toggleDone(demand)}
                            rowRef={(element) => {
                              rowsRef.current[index] = element;
                            }}
                          />
                        );
                      });
                  if (group === "nenhum") return rows;
                  return [
                    <div key={`grupo-${item.key}`} role="row" className="mt-2 flex h-9 items-center border-b border-line-subtle">
                      <span role="cell" className="flex">
                        <button
                          type="button"
                          aria-expanded={!closedGroup}
                          onClick={() => setCollapsed((current) => (closedGroup ? current.filter((key) => key !== item.key) : [...current, item.key]))}
                          className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[13px] font-medium text-ink hover:bg-surface-hover"
                        >
                          <ChevronRight className={cn("size-4 stroke-[1.75] text-ink-muted transition-transform", !closedGroup && "rotate-90")} aria-hidden />
                          {group === "prioridade" && (
                            <span
                              className={cn(
                                "size-2 rounded-full shrink-0",
                                (item.key === "urgente" || item.key === "critica") && "bg-[#ff5c7f]",
                                item.key === "alta" && "bg-[#ff5c7f] ring-1 ring-[#ff5c7f] bg-transparent",
                                (item.key === "media" || item.key === "normal") && "bg-[#ffe269]",
                                item.key === "baixa" && "bg-[#6c6f78]"
                              )}
                            />
                          )}
                          {item.label}
                          <span className="tabular font-normal text-ink-muted">{item.items.length}</span>
                        </button>
                      </span>
                    </div>,
                    ...rows,
                  ];
                })}
              </StaggerList>
            </ColumnOrderContext.Provider>
          )}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: [string, string][];
  onChange: (value: string | null) => void;
}) {
  const id = React.useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs text-ink-muted">
        {label}
      </label>
      <select
        id={id}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
        className="h-8 rounded-lg border border-line-subtle bg-surface px-2 text-sm text-ink outline-none focus-visible:border-line-focus"
      >
        <option value="">Todos</option>
        {options.map(([key, text]) => (
          <option key={key} value={key}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex h-7 items-center gap-1 rounded-md border border-line-subtle bg-surface pr-1 pl-2.5 text-[13px] text-ink">
      {label}
      <button
        type="button"
        aria-label={`Remover filtro ${label}`}
        onClick={onRemove}
        className="inline-flex size-5 items-center justify-center rounded text-ink-muted hover:text-ink"
      >
        <X className="size-3.5 stroke-[1.75]" />
      </button>
    </span>
  );
}

/** Título de coluna que classifica: 1º clique crescente, 2º decrescente; o padrão volta a ser a urgência. */
function SortHeader({
  label,
  sortKey,
  sort,
  onSort,
  align = "left",
  resize,
  drag,
}: {
  label: string;
  sortKey: SortKey;
  sort: Sort;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
  /** Divisória à esquerda da coluna: arrastar muda a largura (D-114). */
  resize?: {
    column: ColumnKey;
    width: number;
    onResize: (value: number | null) => void;
  };
  /** Arrastar o título muda a ordem da coluna (D-114). */
  drag?: {
    ref: (element: HTMLElement | null) => void;
    style: React.CSSProperties;
    listeners?: Record<string, unknown>;
    dragging: boolean;
  };
}) {
  const active = sort.key === sortKey;
  const Arrow = sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <span
      role="columnheader"
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
      ref={drag?.ref}
      style={drag?.style}
      {...drag?.listeners}
      title={drag ? "Clique para ordenar. Arraste para mudar a coluna de lugar." : undefined}
      className={cn(
        "relative flex min-w-0",
        align === "right" && "justify-end",
        drag && "cursor-grab touch-none",
        drag?.dragging && "z-20 cursor-grabbing rounded-md bg-surface-active shadow-sm"
      )}
    >
      {resize && <ResizeHandle label={label} {...resize} />}
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn("-mx-1 inline-flex h-7 items-center gap-1 rounded px-1 hover:bg-surface-hover hover:text-ink", active ? "text-ink" : "text-ink-muted")}
      >
        {label}
        {active && <Arrow className="size-3.5 stroke-[1.75]" aria-hidden />}
      </button>
    </span>
  );
}

/** Título de Cliente, Situação, Atribuídos ou Prazo: classifica, muda de largura e muda de lugar. */
function MovableHeader({
  column,
  sort,
  onSort,
  width,
  onResize,
}: {
  column: ColumnKey;
  sort: Sort;
  onSort: (key: SortKey) => void;
  width: number;
  onResize: (value: number | null) => void;
}) {
  const { setNodeRef, listeners, transform, transition, isDragging } = useSortable({ id: column });
  return (
    <SortHeader
      label={COLUMN_LABEL[column]}
      sortKey={column}
      sort={sort}
      onSort={onSort}
      align={column === "prazo" ? "right" : "left"}
      resize={{ column, width, onResize }}
      drag={{
        ref: setNodeRef,
        style: {
          transform: CSS.Translate.toString(transform && { ...transform, y: 0 }),
          transition,
        },
        listeners,
        dragging: isDragging,
      }}
    />
  );
}

/**
 * Menu "Exibição" (D-113): forma (Lista ou Quadro), agrupar e ordenar num só lugar, ancorado no botão.
 * O botão resume o que está valendo, ex.: "Lista · Situação".
 */
function DisplayMenu({
  view,
  onView,
  group,
  onGroup,
  sort,
  onSort,
  columns,
}: {
  view: View;
  onView: (value: View) => void;
  group: GroupKey;
  onGroup: (value: GroupKey) => void;
  sort: Sort;
  onSort: (value: Sort) => void;
  columns: ReturnType<typeof useColumns>;
}) {
  const ViewIcon = view === "lista" ? List : Kanban;
  const summary = view === "quadro" ? "Quadro" : group === "nenhum" ? "Lista" : `Lista · ${GROUP_LABEL[group]}`;
  return (
    <Popover>
      <PopoverTrigger
        aria-label={`Exibição: ${summary}`}
        className="inline-flex h-8 items-center gap-2 rounded-lg border border-line-subtle bg-surface px-2.5 text-[13px] font-medium text-ink hover:bg-surface-hover aria-expanded:bg-surface-hover"
      >
        <ViewIcon className="size-4 stroke-[1.75] text-ink-secondary" aria-hidden />
        {summary}
        <SlidersHorizontal className="size-4 stroke-[1.75] text-ink-muted" aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 gap-4 p-3">
        <div role="radiogroup" aria-label="Forma de exibição" className="grid grid-cols-2 gap-2">
          {(
            [
              ["lista", "Lista", List],
              ["quadro", "Quadro", Kanban],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={view === value}
              onClick={() => onView(value)}
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-1.5 rounded-lg border text-[13px] font-medium transition-colors",
                view === value ? "border-line-strong bg-surface-active text-ink" : "border-line-subtle text-ink-secondary hover:bg-surface-hover hover:text-ink"
              )}
            >
              <Icon className="size-5 stroke-[1.75]" aria-hidden />
              {label}
            </button>
          ))}
        </div>
        {view === "lista" ? (
          <>
            <OptionList label="Agrupar por" options={GROUP_LABEL} value={group} onChange={onGroup} />
            <OptionList
              label="Ordenar por"
              options={SORT_LABEL}
              value={sort.key}
              onChange={(key) => onSort({ key, dir: sort.key === key ? sort.dir : "asc" })}
              aside={
                <button
                  type="button"
                  onClick={() =>
                    onSort({
                      ...sort,
                      dir: sort.dir === "asc" ? "desc" : "asc",
                    })
                  }
                  className="inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-xs text-ink-secondary hover:bg-surface-hover hover:text-ink"
                >
                  <ArrowDownUp className="size-3.5 stroke-[1.75]" aria-hidden />
                  {sort.dir === "asc" ? "Crescente" : "Decrescente"}
                </button>
              }
            />
            <ColumnOrder columns={columns} />
          </>
        ) : (
          <p className="text-[13px] text-ink-secondary">No quadro, cada coluna é uma situação, da mais urgente para a menos urgente.</p>
        )}
      </PopoverContent>
    </Popover>
  );
}

function OptionList<T extends string>({
  label,
  options,
  value,
  onChange,
  aside,
}: {
  label: string;
  options: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
  aside?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex h-6 items-center px-1">
        <span className="text-xs text-ink-muted">{label}</span>
        {aside && <span className="ml-auto">{aside}</span>}
      </div>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-0.5">
        {(Object.keys(options) as T[]).map((key) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={value === key}
            onClick={() => onChange(key)}
            className={cn(
              "flex h-8 items-center gap-2 rounded-md px-2 text-left text-sm",
              value === key ? "bg-surface-active text-ink" : "text-ink-secondary hover:bg-surface-hover hover:text-ink"
            )}
          >
            <span className="flex-1 truncate">{options[key]}</span>
            {value === key && <Check className="size-3.5 stroke-[1.75]" aria-hidden />}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Divisória arrastável entre colunas. Arrastar para a esquerda alarga a coluna; setas fazem o mesmo pelo teclado;
 * clique duplo volta à largura padrão.
 */
function ResizeHandle({ label, column, width, onResize }: { label: string; column: ColumnKey; width: number; onResize: (value: number | null) => void }) {
  const [dragging, setDragging] = React.useState(false);
  const start = React.useRef<{ x: number; width: number } | null>(null);
  return (
    <span
      role="separator"
      aria-orientation="vertical"
      aria-label={`Largura da coluna ${label}`}
      aria-valuenow={width}
      aria-valuemin={COLUMN_LIMITS[column][0]}
      aria-valuemax={COLUMN_LIMITS[column][1]}
      tabIndex={0}
      title="Arraste para ajustar a largura. Clique duplo volta ao padrão."
      onPointerDown={(event) => {
        event.preventDefault();
        event.stopPropagation(); // não começa a arrastar a coluna
        event.currentTarget.setPointerCapture(event.pointerId);
        start.current = { x: event.clientX, width };
        setDragging(true);
      }}
      onPointerMove={(event) => {
        if (start.current) onResize(start.current.width - (event.clientX - start.current.x));
      }}
      onPointerUp={() => {
        start.current = null;
        setDragging(false);
      }}
      onDoubleClick={() => onResize(null)}
      onKeyDown={(event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        event.stopPropagation();
        onResize(width + (event.key === "ArrowLeft" ? 16 : -16));
      }}
      className="group/handle absolute top-0 -left-[10px] z-10 flex h-full w-2 cursor-col-resize touch-none justify-center outline-none"
    >
      <span
        className={cn(
          "h-full w-px transition-colors",
          dragging ? "bg-line-focus" : "bg-transparent group-hover/handle:bg-line-strong group-focus-visible/handle:bg-line-focus"
        )}
      />
    </span>
  );
}

/** Ordem das colunas pelo menu (alternativa ao arrastar, também pelo teclado) e volta ao padrão. */
function ColumnOrder({ columns }: { columns: ReturnType<typeof useColumns> }) {
  const arrow =
    "inline-flex size-7 items-center justify-center rounded-md text-ink-secondary hover:bg-surface-hover hover:text-ink disabled:pointer-events-none disabled:opacity-35";
  return (
    <div className="flex flex-col gap-1">
      <div className="flex h-6 items-center px-1">
        <span className="text-xs text-ink-muted">Colunas</span>
        {columns.customized && (
          <button
            type="button"
            onClick={columns.reset}
            className="ml-auto inline-flex h-6 items-center rounded-md px-1.5 text-xs text-ink-secondary hover:bg-surface-hover hover:text-ink"
          >
            Restaurar padrão
          </button>
        )}
      </div>
      <ol aria-label="Ordem das colunas" className="flex flex-col gap-0.5">
        {columns.order.map((key, index) => (
          <li key={key} className="flex h-8 items-center gap-1 rounded-md pr-0.5 pl-2 text-sm text-ink">
            <span className="tabular w-4 text-xs text-ink-muted">{index + 1}</span>
            <span className="flex-1 truncate">{COLUMN_LABEL[key]}</span>
            <button
              type="button"
              aria-label={`Mover ${COLUMN_LABEL[key]} para a esquerda`}
              disabled={index === 0}
              onClick={() => columns.move(key, -1)}
              className={arrow}
            >
              <ChevronLeft className="size-4 stroke-[1.75]" aria-hidden />
            </button>
            <button
              type="button"
              aria-label={`Mover ${COLUMN_LABEL[key]} para a direita`}
              disabled={index === columns.order.length - 1}
              onClick={() => columns.move(key, 1)}
              className={arrow}
            >
              <ChevronRight className="size-4 stroke-[1.75]" aria-hidden />
            </button>
          </li>
        ))}
      </ol>
      <p className="px-1 text-xs text-ink-muted">Também dá para arrastar o título da coluna na lista.</p>
    </div>
  );
}
