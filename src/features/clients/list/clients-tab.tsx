"use client";

import * as React from "react";
import { ListFilter, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SkeletonRow } from "@/components/ui/skeleton";
import { StaggerList } from "@/components/ui/stagger-list";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ROLES } from "@/features/auth/permissions";
import { parseCodeQuery } from "@/features/ids/masks";
import { useRealtime } from "@/features/realtime/client";
import { useShellUser } from "@/features/shell/shell-user";
import { useCurrentTab, useTabs, wantsNewTab } from "@/features/shell/tabs-store";
import { listClients } from "../actions";
import { NewClientDialog } from "../client-dialog";
import { EntityLogo, ServicePills } from "../components/bits";
import { CLIENT_STATUS_LABEL, type ClientStatus } from "../rules";
import { DEMANDS_TOPIC } from "@/features/demands/topics";
import { CLIENTS_TOPIC } from "../topics";
import type { ClientSummary } from "../types";

const STATUSES: ClientStatus[] = ["ativo", "pausado", "inativo"];

/** Busca por nome ou código: com ou sem #, sem zeros à esquerda (identificadores-e-formatos.md §5). */
function matches(client: ClientSummary, query: string) {
  const text = query.trim().toLowerCase();
  if (!text) return true;
  if (client.name.toLowerCase().includes(text)) return true;
  if (client.code.toLowerCase().includes(text.replace(/^#/, ""))) return true;
  const parsed = parseCodeQuery(text);
  if (!parsed) return false;
  const [letters, digits] = [client.code.replace(/[^A-Z]/g, ""), client.code.replace(/\D/g, "")];
  return letters === parsed.letters && Number(digits) === parsed.number;
}

// Listagem de Clientes (clientes-design-v2.md 04.1-A).
export function ClientsTab() {
  const me = useShellUser();
  const { tab } = useCurrentTab();
  const navigate = useTabs((state) => state.navigate);
  const [clients, setClients] = React.useState<ClientSummary[] | null>(null);
  const [query, setQuery] = React.useState("");
  const [statuses, setStatuses] = React.useState<ClientStatus[]>(["ativo"]);
  const [services, setServices] = React.useState<string[]>([]);
  const [selected, setSelected] = React.useState(0);
  const [creating, setCreating] = React.useState(false);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const rowsRef = React.useRef<(HTMLDivElement | null)[]>([]);
  const canCreate = me.role === ROLES.administrador || me.role === ROLES.analistaImplantacao;

  const reload = React.useCallback(async () => setClients(await listClients()), []);
  React.useEffect(() => {
    let cancelled = false;
    void listClients().then((list) => !cancelled && setClients(list));
    return () => {
      cancelled = true;
    };
  }, []);
  useRealtime(CLIENTS_TOPIC, () => void reload());
  useRealtime(DEMANDS_TOPIC, () => void reload());

  const allServices = React.useMemo(() => {
    const map = new Map<string, string>();
    clients?.forEach((client) => client.services.forEach((item) => map.set(item.serviceId, item.name)));
    return [...map.entries()];
  }, [clients]);

  const visible = (clients ?? []).filter(
    (client) =>
      statuses.includes(client.status) &&
      (services.length === 0 || client.services.some((item) => services.includes(item.serviceId))) &&
      matches(client, query)
  );
  const filtered = statuses.length !== 1 || statuses[0] !== "ativo" || services.length > 0 || query !== "";

  function open(client: ClientSummary, newTab: boolean) {
    navigate("cliente", { codigo: client.code }, newTab);
  }

  function onListKey(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next = Math.min(visible.length - 1, Math.max(0, selected + (event.key === "ArrowDown" ? 1 : -1)));
      setSelected(next);
      rowsRef.current[next]?.focus();
    } else if (event.key === "Enter" && visible[selected]) {
      open(visible[selected], event.ctrlKey || event.metaKey || event.shiftKey);
    }
  }

  return (
    <div
      className="flex flex-col"
      onKeyDown={(event) => {
        const target = event.target as HTMLElement;
        if (event.key === "/" && target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          event.preventDefault();
          searchRef.current?.focus();
        }
      }}
    >
      <div className="flex flex-col gap-3 border-b border-line-subtle px-8 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-[-0.015em] text-ink">Clientes</h1>
          <span className="tabular text-sm text-ink-muted" aria-label={`${visible.length} clientes`}>
            {visible.length}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 stroke-[1.75] text-ink-muted" aria-hidden />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar nome ou código"
                aria-label="Buscar nome ou código"
                className="h-8 w-64 rounded-lg border border-line-subtle bg-surface pr-8 pl-8 text-sm text-ink outline-none placeholder:text-ink-muted focus-visible:border-line-focus"
              />
              <Kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2">/</Kbd>
            </div>
            <Popover>
              <PopoverTrigger className="inline-flex h-8 items-center gap-2 rounded-lg px-2.5 text-[13px] font-medium text-ink-secondary hover:bg-surface-hover hover:text-ink aria-expanded:bg-surface-hover">
                <ListFilter className="size-[18px] stroke-[1.75]" aria-hidden /> Filtros
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 gap-3 p-3">
                <FilterGroup
                  label="Status do cliente"
                  options={STATUSES.map((status) => [status, CLIENT_STATUS_LABEL[status]])}
                  value={statuses}
                  onChange={(value) => setStatuses(value as ClientStatus[])}
                />
                <FilterGroup label="Serviço" options={allServices} value={services} onChange={setServices} />
              </PopoverContent>
            </Popover>
            {canCreate && (
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus /> Novo cliente
              </Button>
            )}
          </div>
        </div>
        <div className="flex min-h-7 flex-wrap items-center gap-2">
          {statuses.map((status) => (
            <Chip key={status} label={`Status: ${CLIENT_STATUS_LABEL[status]}`} onRemove={() => setStatuses(statuses.filter((item) => item !== status))} />
          ))}
          {services.map((serviceId) => (
            <Chip
              key={serviceId}
              label={`Serviço: ${allServices.find(([id]) => id === serviceId)?.[1] ?? ""}`}
              onRemove={() => setServices(services.filter((item) => item !== serviceId))}
            />
          ))}
          {filtered && (
            <button
              type="button"
              onClick={() => {
                setStatuses(["ativo"]);
                setServices([]);
                setQuery("");
              }}
              className="ml-auto text-[13px] text-ink-secondary hover:text-ink"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      <div role="table" aria-label="Clientes" className="px-4" onKeyDown={onListKey}>
        <div role="row" className="grid h-9 grid-cols-[minmax(180px,2fr)_minmax(140px,2fr)_90px_minmax(100px,1fr)_80px] items-center gap-3 px-4 text-xs text-ink-muted">
          <span role="columnheader">Estabelecimento</span>
          <span role="columnheader">Serviços</span>
          <span role="columnheader">Sistemas</span>
          <span role="columnheader">Cidade/UF</span>
          <span role="columnheader" className="text-right">
            Demandas
          </span>
        </div>
        {!clients ? (
          Array.from({ length: 8 }, (_, index) => <SkeletonRow key={index} />)
        ) : clients.length === 0 ? (
          <EmptyState text="Nenhum cliente cadastrado ainda." action={canCreate ? () => setCreating(true) : undefined} />
        ) : visible.length === 0 ? (
          <EmptyState
            text="Nenhum cliente encontrado com esses filtros."
            actionLabel="Limpar filtros"
            action={() => {
              setStatuses(["ativo"]);
              setServices([]);
              setQuery("");
            }}
          />
        ) : (
          <StaggerList scope={`lista-${tab.id}`}>
            {visible.map((client, index) => (
              <div
                key={client.id}
                ref={(element) => {
                  rowsRef.current[index] = element;
                }}
                role="row"
                data-codigo={client.code}
                tabIndex={selected === index ? 0 : -1}
                onFocus={() => setSelected(index)}
                onClick={(event) => open(client, wantsNewTab(event))}
                onAuxClick={(event) => event.button === 1 && open(client, true)}
                className="grid h-11 cursor-pointer grid-cols-[minmax(180px,2fr)_minmax(140px,2fr)_90px_minmax(100px,1fr)_80px] items-center gap-3 rounded-md border-b border-line-subtle px-4 text-sm transition-colors duration-100 outline-offset-[-2px] hover:bg-surface-hover"
              >
                <span role="cell" className="flex min-w-0 items-center gap-2.5">
                  <EntityLogo name={client.name} logoUrl={client.logoUrl} className={client.status !== "ativo" ? "opacity-60" : undefined} />
                  <span className={cn("truncate font-medium", client.status === "ativo" ? "text-ink" : "text-ink-secondary")} title={client.name}>
                    {client.name}
                  </span>
                </span>
                <span role="cell" className="min-w-0">
                  <ServicePills services={client.services} showAll={client.status !== "ativo"} compact />
                </span>
                <span role="cell">
                  <Systems client={client} />
                </span>
                <span role="cell" className="truncate text-[13px] text-ink-secondary">
                  {[client.city, client.state].filter(Boolean).join(", ")}
                </span>
                <span role="cell" className={cn("tabular text-right", client.openDemands ? "text-ink-secondary" : "text-ink-muted")}>
                  {client.openDemands || "—"}
                </span>
              </div>
            ))}
          </StaggerList>
        )}
      </div>

      <NewClientDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(code) => {
          setCreating(false);
          void reload();
          navigate("cliente", { codigo: code }, true);
        }}
      />
    </div>
  );
}

/** Coluna Sistemas (D-22): ícones de Channel Manager e PMS lado a lado; um só se for o mesmo fornecedor. */
function Systems({ client }: { client: ClientSummary }) {
  const { channelManager: cm, pms } = client;
  if (!cm && !pms) return <span className="text-[13px] text-ink-muted">—</span>;
  const same = cm && pms && cm.id === pms.id;
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <span tabIndex={-1} className="inline-flex items-center gap-1" aria-label={`Channel Manager: ${cm?.name ?? "não informado"}. PMS: ${pms?.name ?? "não informado"}.`}>
          {cm && <EntityLogo name={cm.name} logoUrl={cm.logoUrl} size={16} />}
          {pms && !same && <EntityLogo name={pms.name} logoUrl={pms.logoUrl} size={16} />}
        </span>
      </TooltipTrigger>
      <TooltipContent className="flex flex-col gap-2 py-2">
        {[
          ["Channel Manager", cm],
          ["PMS", pms],
        ].map(([label, item]) => (
          <span key={label as string} className="flex flex-col gap-0.5">
            <span className="text-xs text-ink-muted">{label as string}</span>
            <span className="flex items-center gap-1.5 text-[13px]">
              {item && typeof item === "object" ? (
                <>
                  <EntityLogo name={item.name} logoUrl={item.logoUrl} size={16} /> {item.name}
                </>
              ) : (
                "Não informado"
              )}
            </span>
          </span>
        ))}
      </TooltipContent>
    </Tooltip>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex h-7 items-center gap-1 rounded-md border border-line-subtle bg-surface pr-1 pl-2.5 text-[13px] text-ink">
      {label}
      <button type="button" aria-label={`Remover filtro ${label}`} onClick={onRemove} className="inline-flex size-5 items-center justify-center rounded text-ink-muted hover:text-ink">
        <X className="size-3.5 stroke-[1.75]" />
      </button>
    </span>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: [string, string][];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-0.5">
      <legend className="mb-1 text-xs text-ink-muted">{label}</legend>
      {options.length === 0 && <span className="px-2 text-[13px] text-ink-muted">Nenhum ainda</span>}
      {options.map(([key, text]) => (
        <label key={key} className="flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-sm text-ink hover:bg-surface-hover">
          <input
            type="checkbox"
            checked={value.includes(key)}
            onChange={(event) => onChange(event.target.checked ? [...value, key] : value.filter((item) => item !== key))}
            className="size-3.5 accent-[var(--text-primary)]"
          />
          {text}
        </label>
      ))}
    </fieldset>
  );
}

function EmptyState({ text, action, actionLabel = "Novo cliente" }: { text: string; action?: () => void; actionLabel?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <p className="text-sm text-ink-secondary">{text}</p>
      {action && (
        <Button size="sm" variant={actionLabel === "Novo cliente" ? "primary" : "outline"} onClick={action}>
          {actionLabel === "Novo cliente" && <Plus />} {actionLabel}
        </Button>
      )}
    </div>
  );
}
