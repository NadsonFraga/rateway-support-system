"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, MessageCircle, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motionSprings } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ROLES } from "@/features/auth/permissions";
import { fillTemplate } from "@/features/settings/message-template";
import { useShellUser } from "@/features/shell/shell-user";
import { loadBillingContext } from "../actions";
import { CopyIcon, useCopyFeedback } from "../components/bits";
import { billingLabel, phaseKind } from "../rules";
import type { ClientDetail, ClientServiceView } from "../types";
import { isValidPhone, whatsappLink } from "../whatsapp";
import { AddServiceDialog, ServiceDialog } from "./service-dialog";

const KIND_LABEL = { continuo: "Contínuo", pontual: "Pontual" } as const;

// Contrato & Cobrança (04.6): vencimento de cada serviço ativo e a ação de cobrar (D-38).
export function BillingPanel({ client }: { client: ClientDetail }) {
  const me = useShellUser();
  const [context, setContext] = React.useState<{ template: string; instanceName: string } | null>(null);
  const [editing, setEditing] = React.useState<ClientServiceView | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [showPast, setShowPast] = React.useState(false);
  const canEdit = me.role === ROLES.administrador || me.role === ROLES.analistaImplantacao;
  const isAdmin = me.role === ROLES.administrador;

  React.useEffect(() => {
    let cancelled = false;
    void loadBillingContext().then((value) => !cancelled && setContext(value));
    return () => {
      cancelled = true;
    };
  }, []);

  const current = client.services.filter((item) => phaseKind(item.phase) !== "encerrada");
  const past = client.services.filter((item) => phaseKind(item.phase) === "encerrada");

  function message(item: ClientServiceView) {
    return fillTemplate(context?.template ?? "", {
      "contato_financeiro.nome": client.financeName,
      "cliente.nome": client.name,
      "instancia.nome": context?.instanceName,
      servico: item.serviceName,
      vencimento: billingLabel(item.kind, item.billingDay, item.dueDate).replace("Todo dia", "todo dia"),
    });
  }

  return (
    <div className="flex max-w-4xl flex-col px-6 py-6">
      {isAdmin && (
        <div className="mb-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus /> Adicionar serviço
          </Button>
        </div>
      )}
      {current.length === 0 && <p className="py-6 text-sm text-ink-secondary">Nenhum serviço ativo para este cliente.</p>}
      {current.map((item, index) => (
        <ServiceBlock
          key={item.id}
          item={item}
          first={index === 0}
          canEdit={canEdit}
          onEdit={() => setEditing(item)}
          message={context ? message(item) : null}
          financePhone={isValidPhone(client.financePhone) ? client.financePhone : null}
        />
      ))}

      {past.length > 0 && (
        <div className="mt-8 border-t border-line-subtle pt-4">
          <button
            type="button"
            aria-expanded={showPast}
            onClick={() => setShowPast(!showPast)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md px-1 text-sm text-ink-secondary hover:text-ink"
          >
            Serviços anteriores ({past.length})
            <ChevronDown className={cn("size-4 stroke-[1.75] transition-transform", showPast && "rotate-180")} aria-hidden />
          </button>
          <AnimatePresence initial={false}>
            {showPast && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={motionSprings.drawer}
                className="overflow-hidden"
              >
                {past.map((item, index) => (
                  <ServiceBlock key={item.id} item={item} first={index === 0} canEdit={canEdit} onEdit={() => setEditing(item)} past />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {editing && <ServiceDialog item={editing} onClose={() => setEditing(null)} canEditBilling={isAdmin} />}
      {adding && <AddServiceDialog clientId={client.id} onClose={() => setAdding(false)} />}
    </div>
  );
}

function ServiceBlock({
  item,
  first,
  canEdit,
  onEdit,
  message,
  financePhone,
  past = false,
}: {
  item: ClientServiceView;
  first: boolean;
  canEdit: boolean;
  onEdit: () => void;
  message?: string | null;
  financePhone?: string | null;
  past?: boolean;
}) {
  const { copied, copy } = useCopyFeedback();
  return (
    <section className={cn("flex flex-col", !first && "mt-8 border-t border-line-subtle pt-6", past && "text-ink-secondary")}>
      <div className="group flex h-8 items-center gap-3">
        <h2 className="text-xs font-semibold tracking-[0.04em] text-ink-muted uppercase">{item.serviceName}</h2>
        {canEdit && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Editar ${item.serviceName}`}
            onClick={onEdit}
            className="size-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [&_svg]:size-[18px]"
          >
            <Pencil />
          </Button>
        )}
        <span className="ml-auto text-[13px] text-ink-secondary">
          {KIND_LABEL[item.kind]} · {item.phase}
        </span>
      </div>
      <div className="grid h-11 grid-cols-[200px_minmax(0,1fr)_auto] items-center gap-3">
        <span className="text-[13px] text-ink-secondary">Vencimento</span>
        <span className={cn("tabular text-sm", past ? "text-ink-secondary" : item.billingDay || item.dueDate ? "text-ink" : "text-ink-muted")}>
          {billingLabel(item.kind, item.billingDay, item.dueDate)}
        </span>
        {!past && (
          <span className="flex items-center gap-1">
            <Button variant="ghost" size="sm" disabled={!message} onClick={() => message && void copy("mensagem", message)}>
              <CopyIcon done={copied === "mensagem"} /> {copied === "mensagem" ? "Copiado" : "Copiar mensagem"}
            </Button>
            {financePhone && message ? (
              <Button variant="ghost" size="sm" asChild>
                <a href={whatsappLink(financePhone, message)} target="_blank" rel="noopener noreferrer">
                  <MessageCircle /> Cobrar no WhatsApp
                </a>
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="rounded-lg">
                    <Button variant="ghost" size="sm" disabled className="opacity-40">
                      <MessageCircle /> Cobrar no WhatsApp
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Cadastre o contato financeiro em Dados Técnicos</TooltipContent>
              </Tooltip>
            )}
          </span>
        )}
      </div>
    </section>
  );
}
