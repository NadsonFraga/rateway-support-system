"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { ClipboardList, FilePen, Inbox, LogOut, Monitor, Moon, Plus, Settings, Sun, UserRound } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { searchClients } from "@/features/clients/actions";
import { searchDemands } from "@/features/demands/actions";
import { useDemandDrawer } from "@/features/demands/drawer-store";
import { DEMAND_STATUS_LABEL, type DemandStatus } from "@/features/demands/rules";
import { EntityLogo } from "@/features/clients/components/bits";
import { useTheme } from "@/features/settings/use-theme";
import { DEFAULT_SHORTCUTS } from "./action-registry";
import { MODULES, useNextDraftNumber } from "./tab-registry";
import { useTabs } from "./tabs-store";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
  isDev: boolean;
  onSignOut: () => void;
  onSendTestNotification: () => void;
};

// Paleta Ctrl+K: demandas e clientes (título, nome ou código), módulos, conta, tema e sair.
export function CommandPalette({
  open,
  onOpenChange,
  isAdmin,
  isDev,
  onSignOut,
  onSendTestNotification,
}: CommandPaletteProps) {
  const navigate = useTabs((state) => state.navigate);
  const openNew = useTabs((state) => state.open);
  // Ctrl (ou Shift) segurado no Enter/clique abre em aba nova (D-94).
  const newTabRef = React.useRef(false);
  const openTab = (kind: Parameters<typeof navigate>[0], params?: Record<string, string>) =>
    navigate(kind, params, newTabRef.current);
  const nextDraft = useNextDraftNumber();
  const { setPreference } = useTheme();
  const [search, setSearch] = React.useState("");
  const [clients, setClients] = React.useState<{ code: string; name: string; logoUrl: string | null }[]>([]);
  const [demands, setDemands] = React.useState<{ code: string; title: string; status: DemandStatus }[]>([]);
  const openDemand = useDemandDrawer((state) => state.open);

  React.useEffect(() => {
    if (search.trim().length < 2) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void searchClients(search).then((found) => !cancelled && setClients(found));
      void searchDemands(search).then((found) => !cancelled && setDemands(found));
    }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search]);
  const clientResults = search.trim().length < 2 ? [] : clients;
  const demandResults = search.trim().length < 2 ? [] : demands;

  function run(action: () => void) {
    onOpenChange(false);
    action();
  }

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(value) => {
        if (!value) setSearch("");
        onOpenChange(value);
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-canvas/60 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed top-[14vh] left-1/2 z-50 w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-line-medium bg-surface-elevated outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0"
        >
          <DialogPrimitive.Title className="sr-only">Buscar</DialogPrimitive.Title>
          <Command
            loop
            onKeyDown={(event) => {
              newTabRef.current = event.ctrlKey || event.metaKey || event.shiftKey;
            }}
            onPointerDown={(event) => {
              newTabRef.current = event.ctrlKey || event.metaKey || event.shiftKey;
            }}
          >
            <CommandInput
              placeholder="Buscar cliente ou executar um comando"
              aria-label="Buscar cliente ou executar um comando"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>Nada encontrado.</CommandEmpty>
              {demandResults.length > 0 && (
                <CommandGroup heading="Demandas">
                  {demandResults.map((demand) => (
                    <CommandItem
                      key={demand.code}
                      value={`demanda ${demand.code} ${demand.title} ${search}`}
                      onSelect={() => run(() => openDemand(demand.code, []))}
                    >
                      <ClipboardList aria-hidden />
                      <span className="truncate">{demand.title}</span>
                      <CommandShortcut>
                        {DEMAND_STATUS_LABEL[demand.status]} · #{demand.code}
                      </CommandShortcut>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {clientResults.length > 0 && (
                <CommandGroup heading="Clientes">
                  {clientResults.map((client) => (
                    // O texto buscado entra no valor para o filtro da paleta não esconder quem o servidor achou pelo código.
                    <CommandItem
                      key={client.code}
                      value={`cliente ${client.code} ${client.name} ${search}`}
                      onSelect={() => run(() => openTab("cliente", { codigo: client.code }))}
                    >
                      <EntityLogo name={client.name} logoUrl={client.logoUrl} size={16} />
                      {client.name}
                      <CommandShortcut>#{client.code}</CommandShortcut>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              <CommandGroup heading="Ir para">
                {MODULES.map((module) => (
                  <CommandItem key={module.kind} value={`ir ${module.label}`} onSelect={() => run(() => openTab(module.kind))}>
                    <module.icon aria-hidden /> {module.label}
                  </CommandItem>
                ))}
                {isAdmin && (
                  <CommandItem value="ir configurações" onSelect={() => run(() => openTab("configuracoes"))}>
                    <Settings aria-hidden /> Configurações
                  </CommandItem>
                )}
                <CommandItem value="nova aba" onSelect={() => run(() => openNew("nova"))}>
                  <Plus aria-hidden /> Nova aba
                  <CommandShortcut>{DEFAULT_SHORTCUTS["tabs.new"].label}</CommandShortcut>
                </CommandItem>
              </CommandGroup>
              <CommandGroup heading="Conta">
                <CommandItem value="minha conta perfil" onSelect={() => run(() => openTab("minha-conta"))}>
                  <UserRound aria-hidden /> Minha Conta
                </CommandItem>
                <CommandItem value="tema escuro" onSelect={() => run(() => setPreference("escuro"))}>
                  <Moon aria-hidden /> Tema escuro
                </CommandItem>
                <CommandItem value="tema claro" onSelect={() => run(() => setPreference("claro"))}>
                  <Sun aria-hidden /> Tema claro
                </CommandItem>
                <CommandItem value="tema do sistema" onSelect={() => run(() => setPreference("sistema"))}>
                  <Monitor aria-hidden /> Tema do sistema
                </CommandItem>
                <CommandItem value="sair encerrar sessão" onSelect={() => run(onSignOut)}>
                  <LogOut aria-hidden /> Sair
                </CommandItem>
              </CommandGroup>
              {isDev && (
                <CommandGroup heading="Desenvolvimento">
                  <CommandItem
                    value="rascunho de teste"
                    onSelect={() => run(() => openTab("rascunho", { numero: String(nextDraft) }))}
                  >
                    <FilePen aria-hidden /> Novo rascunho de teste
                  </CommandItem>
                  <CommandItem value="enviar notificação de teste" onSelect={() => run(onSendTestNotification)}>
                    <Inbox aria-hidden /> Enviar notificação de teste
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
