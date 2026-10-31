"use client";

import * as React from "react";
import { ChevronRight, LogOut, Monitor, Moon, Search, Sun, UserRound } from "lucide-react";
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
import { ROLE_LABEL, type Role } from "@/features/auth/permissions";
import { InboxButton } from "@/features/inbox/inbox-button";
import { useConnectionState } from "@/features/realtime/client";
import { TAB_REGISTRY } from "./tab-registry";
import { useTabs } from "./tabs-store";

export type ShellUser = { id: string; name: string; username: string; role: Role };

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

// Barra superior (barra-superior-e-lateral.md): instância + trilha à esquerda; busca, caixa de entrada e conta à direita.
export function TopBar({
  instanceName,
  user,
  onOpenSearch,
  onSignOut,
}: {
  instanceName: string;
  user: ShellUser;
  onOpenSearch: () => void;
  onSignOut: () => void;
}) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line-subtle bg-sidebar px-3">
      <span className="inline-flex h-7 max-w-[240px] items-center truncate rounded-md bg-surface-hover px-2.5 text-[13px] font-semibold text-ink">
        {instanceName}
      </span>
      <Breadcrumb />
      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenSearch}
          className="inline-flex h-8 items-center gap-2 rounded-lg border border-line-subtle bg-surface pr-1.5 pl-2.5 text-[13px] text-ink-secondary hover:bg-surface-hover hover:text-ink"
        >
          <Search className="size-4 stroke-[1.75]" aria-hidden />
          <span className="pr-6">Buscar</span>
          <Kbd>Ctrl K</Kbd>
        </button>
        <InboxButton userId={user.id} />
        <UserCapsule user={user} onSignOut={onSignOut} />
      </div>
    </header>
  );
}

/** Trilha no estilo Windows 11: cada parte é clicável e leva à aba correspondente. */
function Breadcrumb() {
  const tabs = useTabs((state) => state.tabs);
  const activeId = useTabs((state) => state.activeId);
  const tab = tabs.find((item) => item.id === activeId);
  if (!tab) return null;
  const parts = TAB_REGISTRY[tab.kind].breadcrumb(tab);

  return (
    <nav aria-label="Você está em" className="flex min-w-0 items-center gap-1 text-[13px]">
      {parts.map((part, index) => (
        <React.Fragment key={`${part}-${index}`}>
          <ChevronRight className="size-4 shrink-0 stroke-[1.75] text-ink-muted" aria-hidden />
          <span
            className={cn("truncate", index === parts.length - 1 ? "text-ink" : "text-ink-secondary")}
            aria-current={index === parts.length - 1 ? "page" : undefined}
          >
            {part}
          </span>
        </React.Fragment>
      ))}
    </nav>
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
              {initials(user.name)}
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
