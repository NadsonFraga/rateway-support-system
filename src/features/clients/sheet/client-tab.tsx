"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, ExternalLink, MessageCircle, MoreHorizontal, Phone, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComingSoon } from "@/components/ui/coming-soon";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motionSprings, staggerContainer, staggerItem } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ROLES } from "@/features/auth/permissions";
import { useRealtime } from "@/features/realtime/client";
import { useShellUser } from "@/features/shell/shell-user";
import { useCurrentTab, useTabs } from "@/features/shell/tabs-store";
import { VaultPanel } from "@/features/vault/vault-panel";
import { deleteClient, getClient } from "../actions";
import { EditClientDialog } from "../client-dialog";
import { CopyIcon, EntityLogo, ServicePills, useCopyFeedback } from "../components/bits";
import { CLIENTS_TOPIC } from "../topics";
import type { ClientDetail } from "../types";
import { formatPhone, whatsappLink } from "../whatsapp";
import { BillingPanel } from "./billing";
import { OverviewPanel } from "./overview";
import { TechnicalPanel } from "./technical";

const SECTIONS = [
  { key: "visao-geral", label: "Visão Geral" },
  { key: "dados-tecnicos", label: "Dados Técnicos" },
  { key: "checklist", label: "Checklist", soon: true },
  { key: "cofre", label: "Cofre de Credenciais" },
  { key: "cobranca", label: "Contrato & Cobrança" },
] as const;
type SectionKey = (typeof SECTIONS)[number]["key"];

// Ficha do cliente (clientes-design-v2.md 04.1-B a 04.6). Cada ficha é uma aba do sistema: a sub-aba
// e a rolagem ficam guardadas enquanto a aba existir (keep-alive).
export function ClientTab() {
  const { tab, active } = useCurrentTab();
  const code = tab.params?.codigo ?? "";
  const setLabel = useTabs((state) => state.setLabel);
  const [client, setClient] = React.useState<ClientDetail | null | undefined>(undefined);
  const [deleted, setDeleted] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void getClient(code).then((value) => !cancelled && setClient(value));
    return () => {
      cancelled = true;
    };
  }, [code]);

  React.useEffect(() => {
    if (client) setLabel(tab.id, client.name);
  }, [client, tab.id, setLabel]);

  useRealtime<{ id?: string; code?: string }>(CLIENTS_TOPIC, (message) => {
    if (!client || (message.data.id && message.data.id !== client.id)) return;
    if (message.event === "cliente:excluido") setDeleted(true);
    else void getClient(code).then(setClient);
  });

  if (client === undefined) {
    return (
      <div className="flex flex-col gap-4 px-6 py-5">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-lg" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-4 w-96" />
      </div>
    );
  }
  if (client === null || deleted) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-2 px-8 py-16 text-center">
        <h1 className="text-lg font-semibold text-ink">{deleted ? "Cliente excluído" : "Cliente não encontrado"}</h1>
        <p className="text-sm text-ink-secondary">
          {deleted ? "Este cliente foi excluído por um Administrador." : `Não existe cliente com o código #${code}.`}
        </p>
      </div>
    );
  }
  return <ClientSheet client={client} onChange={setClient} active={active} />;
}

function ClientSheet({ client, onChange, active }: { client: ClientDetail; onChange: (client: ClientDetail) => void; active: boolean }) {
  const me = useShellUser();
  const [section, setSection] = React.useState<SectionKey>("visao-geral");
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const canEdit = me.role === ROLES.administrador || me.role === ROLES.analistaImplantacao;
  const id = React.useId();

  // Alt+1 a Alt+5 trocam a sub-aba (só na aba do sistema que está à vista).
  React.useEffect(() => {
    if (!active) return;
    function onKey(event: KeyboardEvent) {
      if (!event.altKey || event.ctrlKey || event.metaKey) return;
      const index = Number(event.key) - 1;
      if (index >= 0 && index < SECTIONS.length) {
        event.preventDefault();
        setSection(SECTIONS[index].key);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="shrink-0">
        <motion.div variants={staggerItem}>
          <Identity client={client} canEdit={canEdit} onOpenSettings={() => setSettingsOpen(true)} />
        </motion.div>
        <AnimatePresence initial={false}>
          {client.notice.trim() && (
            <motion.div
              key="aviso"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={motionSprings.drawer}
              className="overflow-hidden"
            >
              <div role="note" className="flex min-h-10 items-center gap-2.5 border-l-2 border-amber-fact bg-amber-fact/8 px-6 py-2 text-sm text-ink">
                <AlertTriangle className="size-4 shrink-0 stroke-[1.75] text-amber-fact" aria-label="Aviso importante" />
                {client.notice}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div variants={staggerItem} role="tablist" aria-label="Seções do cliente" className="flex h-10 items-end gap-6 border-b border-line-subtle px-6">
          {SECTIONS.map((item, index) => {
            const selected = item.key === section;
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                id={`${id}-${item.key}`}
                aria-selected={selected}
                aria-controls={`${id}-painel`}
                aria-keyshortcuts={`Alt+${index + 1}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setSection(item.key)}
                onKeyDown={(event) => {
                  const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
                  if (!step) return;
                  event.preventDefault();
                  const next = SECTIONS[(index + step + SECTIONS.length) % SECTIONS.length];
                  setSection(next.key);
                  document.getElementById(`${id}-${next.key}`)?.focus();
                }}
                className={cn(
                  "relative flex h-full items-center gap-1.5 rounded-t-md text-sm transition-colors outline-offset-[-2px]",
                  selected ? "font-medium text-ink" : "text-ink-secondary hover:text-ink"
                )}
              >
                {item.label}
                {"soon" in item && <span className="text-xs font-normal text-ink-muted">Em breve</span>}
                {selected && (
                  <motion.span layoutId={`${id}-indicador`} transition={motionSprings.tabIndicator} className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-ink" />
                )}
              </button>
            );
          })}
        </motion.div>
      </motion.div>

      <div id={`${id}-painel`} role="tabpanel" aria-labelledby={`${id}-${section}`} className="min-h-0 flex-1 overflow-y-auto">
        {section === "visao-geral" && <OverviewPanel client={client} />}
        {section === "dados-tecnicos" && <TechnicalPanel client={client} canEdit={canEdit} onEdit={() => setSettingsOpen(true)} />}
        {section === "checklist" && (
          <div className="max-w-4xl px-6 py-6">
            <ComingSoon title="Checklist de onboarding" description="O checklist de onboarding chega em uma próxima fase." />
          </div>
        )}
        {section === "cofre" && <VaultPanel clientId={client.id} />}
        {section === "cobranca" && <BillingPanel client={client} />}
      </div>

      <EditClientDialog
        client={client}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        canEdit={canEdit}
        onSaved={(saved) => onChange(saved)}
      />
    </div>
  );
}

function Identity({ client, canEdit, onOpenSettings }: { client: ClientDetail; canEdit: boolean; onOpenSettings: () => void }) {
  const me = useShellUser();
  const { copied, copy } = useCopyFeedback();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const isAdmin = me.role === ROLES.administrador;

  return (
    <div className="flex items-start gap-4 px-6 py-5">
      <EntityLogo name={client.name} logoUrl={client.logoUrl} size={40} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-xl font-semibold tracking-[-0.015em] text-ink">{client.name}</h1>
          {client.website && (
            <a
              href={client.website}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Abrir site oficial em nova guia"
              className="inline-flex size-6 items-center justify-center rounded text-ink-muted hover:text-ink"
            >
              <ExternalLink className="size-4 stroke-[1.75]" />
            </a>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void copy("codigo", `#${client.code}`)}
            aria-label={`Copiar código #${client.code}`}
            className="group inline-flex h-6 items-center gap-1.5 rounded px-1 -ml-1 font-mono text-[13px] text-ink-muted hover:text-ink-secondary"
          >
            #{client.code}
            <span className={cn("transition-opacity", copied === "codigo" ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100")}>
              <CopyIcon done={copied === "codigo"} />
            </span>
            {copied === "codigo" && <span className="font-sans text-xs text-ink-secondary">Copiado</span>}
          </button>
          <ServicePills services={client.services.map((item) => ({ serviceId: item.serviceId, name: item.serviceName, phase: item.phase }))} />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <MainContact client={client} onOpenSettings={onOpenSettings} />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Configurações do cliente" onClick={onOpenSettings} className="[&_svg]:size-[18px]">
              <Settings />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{canEdit ? "Configurações do cliente" : "Ver dados do cliente"}</TooltipContent>
        </Tooltip>
        {isAdmin && (
          <DropdownMenu onOpenChange={(open) => !open && (setConfirmDelete(false), setDeleteError(null))}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Mais ações do cliente" className="[&_svg]:size-[18px]">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              {deleteError ? (
                <p role="alert" className="px-2 py-1.5 text-[13px] text-ink-secondary">
                  {deleteError}
                </p>
              ) : (
                <DropdownMenuItem
                  variant="danger"
                  disabled={client.hasCredentials}
                  onSelect={(event) => {
                    if (!confirmDelete) {
                      event.preventDefault();
                      setConfirmDelete(true);
                      return;
                    }
                    void deleteClient(client.id).then((result) => !result.ok && setDeleteError(result.error));
                  }}
                >
                  <Trash2 /> {confirmDelete ? "Confirmar exclusão" : "Excluir cliente"}
                </DropdownMenuItem>
              )}
              {client.hasCredentials && (
                <p className="px-2 pb-1.5 text-xs text-ink-muted">Clientes com acessos no Cofre não podem ser excluídos.</p>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

/** Contato principal: pessoa (número copiável + ícone do WhatsApp) ou grupo de WhatsApp (link de convite). */
function MainContact({ client, onOpenSettings }: { client: ClientDetail; onOpenSettings: () => void }) {
  const { copied, copy } = useCopyFeedback();
  if (client.contactType === "grupo" && client.contactLink) {
    return (
      <a
        href={client.contactLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-8 items-center gap-2 rounded-lg px-2 text-sm text-ink hover:bg-surface-hover"
        aria-label={`Abrir o grupo de WhatsApp ${client.contactName}`}
      >
        <MessageCircle className="size-4 stroke-[1.75] text-ink-secondary" aria-hidden />
        {client.contactName || "Grupo de WhatsApp"}
      </a>
    );
  }
  if (client.contactType === "pessoa" && client.contactPhone) {
    return (
      <span className="inline-flex h-8 items-center gap-2">
        <a
          href={whatsappLink(client.contactPhone)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir conversa no WhatsApp com ${client.contactName || "o contato"}`}
          className="inline-flex size-7 items-center justify-center rounded-md text-ink-secondary hover:bg-surface-hover hover:text-ink"
        >
          <Phone className="size-4 stroke-[1.75]" />
        </a>
        {client.contactName && <span className="text-sm text-ink">{client.contactName}</span>}
        <button
          type="button"
          onClick={() => void copy("telefone", formatPhone(client.contactPhone))}
          aria-label={`Copiar telefone ${formatPhone(client.contactPhone)}`}
          className="inline-flex h-7 items-center gap-1.5 rounded-md px-1.5 font-mono text-[13px] text-ink-secondary hover:bg-surface-hover"
        >
          {copied === "telefone" ? <span className="font-sans text-xs">Copiado</span> : formatPhone(client.contactPhone)}
        </button>
      </span>
    );
  }
  return (
    <button type="button" onClick={onOpenSettings} className="h-8 rounded-lg px-2 text-sm text-ink-muted hover:bg-surface-hover hover:text-ink-secondary">
      Sem contato principal
    </button>
  );
}
