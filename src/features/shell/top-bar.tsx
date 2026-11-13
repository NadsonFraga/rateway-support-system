"use client";

import * as React from "react";
import { LogOut, Monitor, Moon, Search, Sun, UserRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTheme } from "@/features/settings/use-theme";
import type { ThemePreference } from "@/features/settings/theme";
import { ROLE_LABEL } from "@/features/auth/permissions";
import type { ShellUser } from "./shell-user";
import { InboxButton } from "@/features/inbox/inbox-button";
import { useConnectionState } from "@/features/realtime/client";
import { TAB_REGISTRY } from "./tab-registry";
import { useTabs } from "./tabs-store";
import { TabStrip } from "./tab-strip";


function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

// Barra superior (barra-superior-e-lateral.md): instância + trilha à esquerda; busca, caixa de entrada e conta à direita.
export function TopBar({
  instanceName,
  instanceLogos,
  user,
  onOpenSearch,
  onSignOut,
}: {
  instanceName: string;
  instanceLogos: { dark: string | null; light: string | null };
  user: ShellUser;
  onOpenSearch: () => void;
  onSignOut: () => void;
}) {
  return (
    <header className="flex h-11 shrink-0 items-end gap-3 border-b border-line-subtle bg-sidebar px-3">
      <span className="inline-flex h-7 max-w-[200px] shrink-0 items-center gap-2 truncate rounded-md bg-surface-hover px-2 text-[12px] font-semibold text-ink self-center">
        <InstanceLogo logos={instanceLogos} />
        <span className="truncate">{instanceName}</span>
      </span>
      <TabStrip />
      <div className="ml-auto flex shrink-0 items-center gap-1.5 self-center pb-0.5">
        <button
          type="button"
          onClick={onOpenSearch}
          className="inline-flex h-7 items-center gap-2 rounded-lg border border-line-subtle bg-surface pr-1.5 pl-2 text-[12px] text-ink-secondary hover:bg-surface-hover hover:text-ink"
        >
          <Search className="size-3.5 stroke-[1.75]" aria-hidden />
          <span className="pr-3">Buscar</span>
          <Kbd>Ctrl K</Kbd>
        </button>
        <InboxButton userId={user.id} />
        <UserCapsule user={user} onSignOut={onSignOut} />
      </div>
    </header>
  );
}

/** Cápsula do usuário: iniciais, nome e o ponto da conexão em tempo real; menu com Minha Conta, Tema e Sair (D-61). */
function UserCapsule({ user, onSignOut }: { user: ShellUser; onSignOut: () => void }) {
  const { preference, setPreference } = useTheme();
  const connection = useConnectionState();
  const openTab = useTabs((state) => state.open);
  const offline = connection === "sem-conexao";

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger
            className="inline-flex h-8 items-center gap-2 rounded-lg pr-2.5 pl-1 hover:bg-surface-hover aria-expanded:bg-surface-hover"
          >
            <span
              aria-hidden
              className="relative inline-flex size-6 items-center justify-center rounded-full border border-line-medium bg-surface-active text-[11px] font-semibold text-ink"
            >
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- foto enviada pelo usuário
                <img src={user.image} alt="" className="size-full rounded-full object-cover" />
              ) : (
                initials(user.name)
              )}
              <span
                data-testid="ponto-conexao"
                data-estado={connection}
                className={cn(
                  "absolute -right-0.5 -bottom-0.5 size-2 rounded-full border-2 border-sidebar",
                  offline ? "bg-coral" : "bg-ink-muted"
                )}
              />
            </span>
            <span className="max-w-[140px] truncate text-[13px] font-medium text-ink">{user.name}</span>
            {offline && <span className="sr-only">, sem conexão</span>}
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>{offline ? "Sem conexão, reconectando" : "Conectado"}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-64">
        <div className="flex flex-col px-2 py-2">
          <span className="truncate text-sm font-medium text-ink">{user.name}</span>
          <span className="truncate font-mono text-xs text-ink-secondary">{user.username}</span>
          <span className="text-xs text-ink-muted">{ROLE_LABEL[user.role]}</span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => openTab("minha-conta")}>
          <UserRound /> Minha Conta
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Tema</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={preference} onValueChange={(value) => setPreference(value as ThemePreference)}>
          <DropdownMenuRadioItem value="escuro">
            <Moon /> Escuro
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="claro">
            <Sun /> Claro
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="sistema">
            <Monitor /> Sistema
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onSignOut}>
          <LogOut /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Logo da instância no tema atual (o do outro tema serve de reserva), ao lado do nome (Configurações > Identidade). */
function InstanceLogo({ logos }: { logos?: { dark: string | null; light: string | null } }) {
  const dark = logos?.dark ?? logos?.light;
  const light = logos?.light ?? logos?.dark;
  if (!dark || !light) return null;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- logo enviado pelo administrador */}
      <img src={dark} alt="" className="hidden h-4 w-auto shrink-0 dark:block" />
      {/* eslint-disable-next-line @next/next/no-img-element -- logo enviado pelo administrador */}
      <img src={light} alt="" className="h-4 w-auto shrink-0 dark:hidden" />
    </>
  );
}
