"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, Eye, EyeOff, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/kbd";
import { SkeletonRow } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motionSprings } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ROLES } from "@/features/auth/permissions";
import { EntityLogo } from "@/features/clients/components/bits";
import { useRealtime } from "@/features/realtime/client";
import { useShellUser } from "@/features/shell/shell-user";
import { deleteCredential, listCredentials, revealPassword, type CredentialRow } from "./actions";
import { copyAndOpen } from "./copy-sequence";
import { CredentialDialog } from "./credential-dialog";

const MASK = "••••••••••••";
const COLUMNS = "grid-cols-[minmax(200px,1.4fr)_minmax(120px,0.8fr)_minmax(180px,1.4fr)_220px_220px_32px]";

// Cofre de Credenciais (04.5). Sem auditoria e sem limpeza da área de transferência (D-08, D-09).
export function VaultPanel({ clientId }: { clientId: string }) {
  const me = useShellUser();
  const isAdmin = me.role === ROLES.administrador;
  const [rows, setRows] = React.useState<CredentialRow[] | null>(null);
  const [query, setQuery] = React.useState("");
  const [dialog, setDialog] = React.useState<{ id: string | null } | null>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  const reload = React.useCallback(async () => setRows(await listCredentials(clientId)), [clientId]);
  React.useEffect(() => {
    let cancelled = false;
    void listCredentials(clientId).then((list) => !cancelled && setRows(list));
    return () => {
      cancelled = true;
    };
  }, [clientId]);
  useRealtime(`cofre:${clientId}`, () => void reload());

  const visible = (rows ?? []).filter((row) => row.channelName.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div
      className="flex flex-col px-6 py-5"
      onKeyDown={(event) => {
        const target = event.target as HTMLElement;
        if (event.key === "/" && target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          event.preventDefault();
          searchRef.current?.focus();
        }
      }}
    >
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-base font-semibold text-ink">Acessos</h2>
        <span className="tabular text-sm text-ink-muted">{rows?.length ?? ""}</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 stroke-[1.75] text-ink-muted" aria-hidden />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar canal"
              aria-label="Buscar canal"
              className="h-8 w-56 rounded-lg border border-line-subtle bg-surface pr-8 pl-8 text-sm text-ink outline-none placeholder:text-ink-muted focus-visible:border-line-focus"
            />
            <Kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2">/</Kbd>
          </div>
          {isAdmin && (
            <Button size="sm" onClick={() => setDialog({ id: null })}>
              <Plus /> Adicionar acesso
            </Button>
          )}
        </div>
      </div>

      <div role="table" aria-label="Acessos do cliente">
        <div role="row" className={cn("grid h-9 items-center gap-3 px-2 text-xs text-ink-muted", COLUMNS)}>
          <span role="columnheader">Canal</span>
          <span role="columnheader">ID da propriedade</span>
          <span role="columnheader">Usuário</span>
          <span role="columnheader">Senha</span>
          <span role="columnheader" className="sr-only">
            Ação
          </span>
          <span role="columnheader" className="sr-only">
            Menu
          </span>
        </div>
        {!rows ? (
          Array.from({ length: 4 }, (_, index) => <SkeletonRow key={index} />)
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14">
            <p className="text-sm text-ink-secondary">Nenhum acesso cadastrado para este cliente</p>
            {isAdmin && (
              <Button size="sm" onClick={() => setDialog({ id: null })}>
                <Plus /> Adicionar acesso
              </Button>
            )}
          </div>
        ) : visible.length === 0 ? (
          <p className="py-14 text-center text-sm text-ink-secondary">Nenhum canal encontrado</p>
        ) : (
          visible.map((row) => <CredentialLine key={row.id} row={row} isAdmin={isAdmin} onEdit={() => setDialog({ id: row.id })} />)
        )}
      </div>

      {dialog && <CredentialDialog clientId={clientId} credentialId={dialog.id} onClose={() => setDialog(null)} />}
    </div>
  );
}

function useFlash() {
  const [flash, setFlash] = React.useState<string | null>(null);
  const show = React.useCallback((key: string) => {
    setFlash(key);
    window.setTimeout(() => setFlash((current) => (current === key ? null : current)), 1200);
  }, []);
  return { flash, show };
}

function CredentialLine({ row, isAdmin, onEdit }: { row: CredentialRow; isAdmin: boolean; onEdit: () => void }) {
  const { flash, show } = useFlash();
  const [revealed, setRevealed] = React.useState<string | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [confirmRemove, setConfirmRemove] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const channel = row.label ? `${row.channelName} (${row.label})` : row.channelName;

  async function copy(key: string, value: string | null) {
    if (value === null) return;
    await navigator.clipboard.writeText(value);
    show(key);
  }

  async function copyPassword() {
    await copy("senha", revealed ?? (await revealPassword(row.id)));
  }

  async function toggleReveal() {
    setRevealed(revealed === null ? await revealPassword(row.id) : null);
  }

  async function copyAccess() {
    setBusy(true);
    try {
      const password = await revealPassword(row.id);
      if (password === null) return;
      await copyAndOpen({ username: row.username, password }, row.extranetUrl, { clipboard: navigator.clipboard });
      show("acesso");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="row"
      onContextMenu={(event) => {
        if (!isAdmin) return;
        event.preventDefault();
        setMenuOpen(true);
      }}
      className={cn("group grid h-11 items-center gap-3 rounded-md border-b border-line-subtle px-2 text-sm hover:bg-surface-hover/50", COLUMNS)}
    >
      <span role="cell" className="flex min-w-0 items-center gap-2.5">
        <EntityLogo name={row.channelName} logoUrl={row.channelLogoUrl} />
        <span className="truncate font-medium text-ink">{row.channelName}</span>
        {row.label && <span className="truncate text-[13px] text-ink-muted">{row.label}</span>}
      </span>
      <span role="cell" className="min-w-0">
        {row.propertyId ? (
          <CopyCell label={`Copiar ID da propriedade de ${channel}`} done={flash === "id"} onCopy={() => void copy("id", row.propertyId)} mono>
            {row.propertyId}
          </CopyCell>
        ) : (
          <span className="px-2 text-ink-muted">—</span>
        )}
      </span>
      <span role="cell" className="min-w-0">
        <CopyCell label={`Copiar usuário de ${channel}`} done={flash === "usuario"} onCopy={() => void copy("usuario", row.username)} title={row.username}>
          {row.username}
        </CopyCell>
      </span>
      <span role="cell" className="flex min-w-0 items-center gap-1">
        <CopyCell label={`Copiar senha de ${channel}`} done={flash === "senha"} onCopy={() => void copyPassword()} mono>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={revealed === null ? "oculta" : "visivel"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {revealed ?? MASK}
            </motion.span>
          </AnimatePresence>
        </CopyCell>
        <Button variant="ghost" size="icon" className="size-7 shrink-0" aria-label={revealed === null ? `Mostrar senha de ${channel}` : `Ocultar senha de ${channel}`} onClick={() => void toggleReveal()}>
          {revealed === null ? <Eye /> : <EyeOff />}
        </Button>
      </span>
      <span role="cell" className="flex justify-end">
        <Button variant="ghost" size="sm" disabled={busy} onClick={() => void copyAccess()} aria-label={`${row.extranetUrl ? "Copiar e abrir extranet" : "Copiar acesso"} de ${channel}`}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={flash === "acesso" ? "ok" : "copiar"} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={motionSprings.taptic} className="inline-flex">
              {flash === "acesso" ? <Check /> : <Copy />}
            </motion.span>
          </AnimatePresence>
          {flash === "acesso" ? "Copiado" : row.extranetUrl ? "Copiar e Abrir Extranet" : "Copiar Acesso"}
        </Button>
      </span>
      <span role="cell">
        {isAdmin && (
          <DropdownMenu
            open={menuOpen}
            onOpenChange={(open) => {
              setMenuOpen(open);
              if (!open) setConfirmRemove(false);
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Mais ações de ${channel}`} className="size-8 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onSelect={onEdit}>
                <Pencil /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="danger"
                onSelect={(event) => {
                  if (!confirmRemove) {
                    event.preventDefault();
                    setConfirmRemove(true);
                    return;
                  }
                  void deleteCredential(row.id);
                }}
              >
                <Trash2 /> {confirmRemove ? "Confirmar remoção" : "Remover"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </span>
    </div>
  );
}

/** Valor que copia ao clicar: no hover ganha fundo e o ícone Copy; ao copiar, Check + "Copiado" por 1,2s. */
function CopyCell({
  children,
  label,
  done,
  onCopy,
  mono = false,
  title,
}: {
  children: React.ReactNode;
  label: string;
  done: boolean;
  onCopy: () => void;
  mono?: boolean;
  title?: string;
}) {
  return (
    <Tooltip open={title ? undefined : false} delayDuration={400}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onCopy}
          className={cn(
            "group/copia flex h-8 w-full min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 text-left text-sm text-ink hover:bg-surface-hover",
            mono && "font-mono"
          )}
        >
          <span className="sr-only">{label}: </span>
          <span className="truncate">{children}</span>
          <span className="ml-auto flex shrink-0 items-center gap-1 text-ink-muted">
            {done && <span className="font-sans text-xs text-ink-secondary">Copiado</span>}
            <span className={cn("inline-flex", done ? "opacity-100" : "opacity-0 group-hover/copia:opacity-100 group-focus-visible/copia:opacity-100")}>
              {done ? <Check className="size-3.5 stroke-[1.75]" /> : <Copy className="size-3.5 stroke-[1.75]" />}
            </span>
          </span>
        </button>
      </TooltipTrigger>
      {title && <TooltipContent>{title}</TooltipContent>}
    </Tooltip>
  );
}
