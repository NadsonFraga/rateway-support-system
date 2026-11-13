"use client";

import * as React from "react";
import {
  Minus,
  CircleDashed,
  CircleDot,
  CircleArrowRight,
  CircleCheck,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DeploymentStatus } from "../types";

export function AtivoIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("size-4 text-cyan-fact", className)} viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 8.3 7 10.2l4-4.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AndamentoIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("size-4 text-yellow-fact", className)} viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 3.2a4.8 4.8 0 0 1 0 9.6z" fill="currentColor" />
    </svg>
  );
}

export function FocoIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("size-4 text-ink-secondary", className)} viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6 10l4-4M6.6 6H10v3.4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AfazerIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("size-4 text-ink-muted", className)} viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2.4 2" />
    </svg>
  );
}

export function NoneIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("size-4 text-ink-muted/40", className)} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M5.5 8h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export const STATUS_CONFIG: Record<
  DeploymentStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    badgeClass: string;
  }
> = {
  nao_contratado: {
    label: "Não contratado",
    icon: NoneIcon,
    description: "Canal desativado ou fora do escopo deste cliente",
    badgeClass: "text-ink-muted/40",
  },
  a_cadastrar: {
    label: "A cadastrar",
    icon: AfazerIcon,
    description: "Contratado, na fila de início",
    badgeClass: "text-ink-muted",
  },
  em_andamento: {
    label: "Em andamento",
    icon: AndamentoIcon,
    description: "Em produção ativa pela equipe",
    badgeClass: "text-yellow-fact",
  },
  feito_pelo_channel_manager: {
    label: "Feito pela FOCO",
    icon: FocoIcon,
    description: "Mapeado e gerenciado via FOCO",
    badgeClass: "text-ink-secondary",
  },
  no_ar: {
    label: "Ativo",
    icon: AtivoIcon,
    description: "Canal publicado e ativo",
    badgeClass: "text-cyan-fact",
  },
};

export const STATUS_CYCLE: Record<DeploymentStatus, DeploymentStatus> = {
  nao_contratado: "a_cadastrar",
  a_cadastrar: "em_andamento",
  em_andamento: "no_ar",
  no_ar: "feito_pelo_channel_manager",
  feito_pelo_channel_manager: "nao_contratado",
};

const BOTTLENECK_PRESETS = [
  "Aguardando documentação",
  "Aguardando canal / OTA",
  "Aguardando fotos / mídia",
  "Em produção interna",
  "Bloqueio financeiro",
];

interface StatusMenuProps {
  children: React.ReactNode;
  clientId: string;
  clientName: string;
  channelId: string;
  channelName: string;
  currentStatus: DeploymentStatus;
  currentBottleneck?: string | null;
  onSelectStatus: (status: DeploymentStatus, bottleneck?: string) => Promise<void>;
}

export function StatusMenu({
  children,
  clientName,
  channelName,
  currentStatus,
  currentBottleneck,
  onSelectStatus,
}: StatusMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [bottleneck, setBottleneck] = React.useState(currentBottleneck ?? "");

  React.useEffect(() => {
    setBottleneck(currentBottleneck ?? "");
  }, [currentBottleneck, open]);

  async function handleChoose(status: DeploymentStatus) {
    try {
      setLoading(true);
      await onSelectStatus(status, bottleneck.trim() || undefined);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-80 rounded-xl border border-line-medium bg-surface-elevated p-3 shadow-xl"
      >
        <div className="flex flex-col gap-1 pb-2 border-b border-line-subtle">
          <span className="text-[11px] font-semibold tracking-wider text-ink-muted uppercase">
            {channelName}
          </span>
          <span className="text-xs font-medium text-ink truncate">{clientName}</span>
        </div>

        <div className="flex flex-col gap-1 py-1">
          {(Object.keys(STATUS_CONFIG) as DeploymentStatus[]).map((st) => {
            const config = STATUS_CONFIG[st];
            const isCurrent = currentStatus === st;
            const Icon = config.icon;
            return (
              <button
                key={st}
                type="button"
                disabled={loading}
                onClick={() => handleChoose(st)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2 py-2 text-left text-xs transition-colors hover:bg-surface-hover disabled:opacity-50",
                  isCurrent && "bg-surface-hover/70 font-medium"
                )}
              >
                <Icon className={cn("size-4 shrink-0 text-ink", config.badgeClass)} />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-ink">{config.label}</span>
                  <span className="text-[11px] text-ink-muted truncate">{config.description}</span>
                </div>
                {isCurrent && <Check className="size-3.5 shrink-0 text-ink" />}
              </button>
            );
          })}
        </div>

        <div className="pt-2 border-t border-line-subtle flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-ink-secondary flex items-center gap-1">
            <AlertCircle className="size-3 text-ink-muted" />
            Gargalo / Bloqueio (opcional)
          </label>
          <input
            type="text"
            value={bottleneck}
            onChange={(e) => setBottleneck(e.target.value)}
            placeholder="Ex: Aguardando contrato da OTA..."
            className="w-full rounded-md border border-line-subtle bg-surface px-2.5 py-1 text-xs text-ink placeholder:text-ink-muted outline-none focus:border-line-focus"
          />
          <div className="flex flex-wrap gap-1 pt-1">
            {BOTTLENECK_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setBottleneck(preset)}
                className="rounded border border-line-subtle px-1.5 py-0.5 text-[10px] text-ink-secondary hover:bg-surface-hover transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-elevated/70 rounded-xl">
            <Loader2 className="size-5 animate-spin text-ink" />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
