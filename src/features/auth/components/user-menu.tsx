"use client";

import { useRouter } from "next/navigation";
import { LogOut, Monitor, Moon, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/features/settings/use-theme";
import type { ThemePreference } from "@/features/settings/theme";
import { authClient } from "../auth-client";
import { ROLE_LABEL, type Role } from "../permissions";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

// Menu do avatar, ancorado no topo. "Sair" sempre visível (D-61: computador compartilhado).
export function UserMenu({ name, email, role }: { name: string; email: string; role: Role }) {
  const router = useRouter();
  const { preference, setPreference } = useTheme();

  async function signOut() {
    await authClient.signOut();
    router.replace("/entrar");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Conta de ${name}`}
        className="inline-flex size-8 items-center justify-center rounded-full border border-line-medium bg-surface-hover text-xs font-semibold text-ink hover:border-line-strong"
      >
        {initials(name)}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="flex flex-col px-2 py-2">
          <span className="truncate text-sm font-medium text-ink">{name}</span>
          <span className="truncate text-[13px] text-ink-secondary">{email}</span>
          <span className="text-xs text-ink-muted">{ROLE_LABEL[role]}</span>
        </div>
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
        <DropdownMenuItem onSelect={signOut}>
          <LogOut /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
