"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { FilePen, Inbox, LogOut, Monitor, Moon, Plus, Settings, Sun, UserRound } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
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

// Paleta Ctrl+K: ir para módulos, conta, tema e sair. A busca de clientes e demandas entra com cada módulo.
export function CommandPalette({
  open,
  onOpenChange,
  isAdmin,
  isDev,
  onSignOut,
  onSendTestNotification,
}: CommandPaletteProps) {
  const openTab = useTabs((state) => state.open);
  const nextDraft = useNextDraftNumber();
  const { setPreference } = useTheme();

  function run(action: () => void) {
    onOpenChange(false);
    action();
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-canvas/60 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed top-[14vh] left-1/2 z-50 w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-line-medium bg-surface-elevated outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0"
        >
          <DialogPrimitive.Title className="sr-only">Buscar</DialogPrimitive.Title>
          <Command loop>
            <CommandInput placeholder="Buscar ou executar um comando" aria-label="Buscar ou executar um comando" />
            <CommandList>
              <CommandEmpty>Nada encontrado. A busca de clientes e demandas chega com cada módulo.</CommandEmpty>
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
                <CommandItem value="nova aba" onSelect={() => run(() => openTab("nova"))}>
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
