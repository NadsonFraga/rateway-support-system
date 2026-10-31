"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy } from "lucide-react";
import { motionSprings } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { phaseKind } from "../rules";

function initials(name: string) {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, "").trim().split(/\s+/);
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? words[0]?.[1] ?? "")).toUpperCase();
}

/** Logo do cliente ou do canal; sem logo, monograma de 2 letras (clientes-design-v2.md 04.1). */
export function EntityLogo({
  name,
  logoUrl,
  size = 20,
  className,
}: {
  name: string;
  logoUrl: string | null;
  size?: 16 | 20 | 40;
  className?: string;
}) {
  const box = size === 40 ? "size-10 rounded-lg text-sm" : size === 20 ? "size-5 rounded-md text-[10px]" : "size-4 rounded text-[9px]";
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- logo enviado pelo usuário
    return <img src={logoUrl} alt="" className={cn("shrink-0 object-contain", box, className)} />;
  }
  return (
    <span aria-hidden className={cn("inline-flex shrink-0 items-center justify-center bg-surface-active font-semibold text-ink-secondary", box, className)}>
      {initials(name)}
    </span>
  );
}

/** Pílulas "Serviço · Fase", sem cor (D-25). Serviços encerrados/pausados só aparecem quando pedido. */
export function ServicePills({
  services,
  showAll = false,
}: {
  services: { serviceId: string; name: string; phase: string }[];
  showAll?: boolean;
}) {
  const visible = showAll ? services : services.filter((item) => phaseKind(item.phase) === "ativa");
  return (
    <span className="flex flex-wrap gap-1.5">
      {visible.map((item) => (
        <span
          key={`${item.serviceId}-${item.phase}`}
          className={cn(
            "inline-flex h-6 items-center rounded-md border border-line-subtle px-2 text-[13px] whitespace-nowrap",
            phaseKind(item.phase) === "ativa" ? "text-ink-secondary" : "text-ink-muted"
          )}
        >
          {item.name} · {item.phase}
        </span>
      ))}
    </span>
  );
}

/** Copia um valor com feedback no próprio lugar: Copy → Check + "Copiado" por 1,2s (mola taptic). */
export function useCopyFeedback() {
  const [copied, setCopied] = React.useState<string | null>(null);
  const copy = React.useCallback(async (key: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied((current) => (current === key ? null : current)), 1200);
  }, []);
  return { copied, copy };
}

export function CopyIcon({ done }: { done: boolean }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={done ? "ok" : "copiar"}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.6, opacity: 0 }}
        transition={motionSprings.taptic}
        className="inline-flex"
      >
        {done ? <Check className="size-3.5 stroke-[1.75]" /> : <Copy className="size-3.5 stroke-[1.75]" />}
      </motion.span>
    </AnimatePresence>
  );
}
