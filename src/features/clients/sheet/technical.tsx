"use client";

import { ExternalLink, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComingSoon } from "@/components/ui/coming-soon";
import { cn } from "@/lib/utils";
import { CopyIcon, useCopyFeedback } from "../components/bits";
import type { ClientDetail } from "../types";
import { formatPhone } from "../whatsapp";

type Row = { label: string; value: string; link?: string; mono?: boolean };

function rowsOf(client: ClientDetail): Row[] {
  const contact =
    client.contactType === "pessoa"
      ? [
          client.contactName,
          client.contactPhone && formatPhone(client.contactPhone),
        ]
          .filter(Boolean)
          .join(" · ")
      : client.contactType === "grupo"
        ? client.contactName || "Grupo de WhatsApp"
        : "";
  return [
    { label: "Nome fantasia", value: client.name },
    { label: "Código", value: `#${client.code}`, mono: true },
    {
      label: "Cidade/UF",
      value: [client.city, client.state].filter(Boolean).join(", "),
    },
    {
      label: "Site oficial",
      value: client.website.replace(/^https?:\/\//, "").replace(/\/$/, ""),
      link: client.website || undefined,
    },
    { label: "Channel Manager", value: client.channelManager?.name ?? "" },
    { label: "PMS", value: client.pms?.name ?? "" },
    {
      label:
        client.contactType === "grupo"
          ? "Contato principal (grupo)"
          : "Contato principal",
      value: contact,
      link:
        client.contactType === "grupo" && client.contactLink
          ? client.contactLink
          : undefined,
    },
    {
      label: "Contato financeiro",
      value: [
        client.financeName,
        client.financePhone && formatPhone(client.financePhone),
      ]
        .filter(Boolean)
        .join(" · "),
    },
    { label: "Aviso importante", value: client.notice },
  ];
}

// Dados Técnicos (04.3): só os essenciais; edição no mesmo modal de Configurações.
export function TechnicalPanel({
  client,
  canEdit,
  onEdit,
}: {
  client: ClientDetail;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const { copied, copy } = useCopyFeedback();
  return (
    <div className="flex max-w-4xl flex-col gap-8 px-6 py-6">
      <section className="flex flex-col">
        <div className="flex h-9 items-center justify-between">
          <h2 className="text-xs font-semibold tracking-[0.04em] text-ink-muted uppercase">
            Dados essenciais
          </h2>
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="[&_svg]:size-[18px]"
            >
              <Pencil /> Editar
            </Button>
          )}
        </div>
        <dl>
          {rowsOf(client).map((row) => (
            <div
              key={row.label}
              className="group grid h-11 grid-cols-[200px_minmax(0,1fr)_auto] items-center gap-3 border-b border-line-subtle"
            >
              <dt className="text-[13px] text-ink-secondary">{row.label}</dt>
              <dd className="col-span-2 flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-sm",
                    row.value ? "text-ink" : "text-ink-muted",
                    row.mono && "font-mono",
                  )}
                  title={row.value}
                >
                  {row.value || "Não informado"}
                </span>
                <span className="flex items-center gap-1">
                  {copied === row.label && (
                    <span className="text-xs text-ink-secondary">Copiado</span>
                  )}
                  {row.link ? (
                    <a
                      href={row.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Abrir ${row.label} em nova guia`}
                      className="inline-flex size-8 items-center justify-center rounded-md text-ink-muted hover:bg-surface-hover hover:text-ink"
                    >
                      <ExternalLink className="size-4 stroke-[1.75]" />
                    </a>
                  ) : (
                    row.value && (
                      <button
                        type="button"
                        onClick={() => void copy(row.label, row.value)}
                        aria-label={`Copiar ${row.label}`}
                        className="inline-flex size-8 items-center justify-center rounded-md text-ink-muted opacity-0 group-hover:opacity-100 hover:bg-surface-hover hover:text-ink focus-visible:opacity-100 [&_svg]:size-4"
                      >
                        <CopyIcon done={copied === row.label} />
                      </button>
                    )
                  )}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <ComingSoon
        title="Dados técnicos completos"
        description="Dados cadastrais, políticas, descritivos e parâmetros de tarifa chegam em uma próxima fase."
      />
    </div>
  );
}
