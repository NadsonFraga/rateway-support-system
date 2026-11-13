"use client";

import { ChevronsUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { demandDot, dueLabel, type DemandPriority, type DemandStatus } from "../rules";
import type { PersonRef } from "../types";

export function initialsOf(name: string) {
  const words = name.trim().split(/\s+/);
  return ((words[0]?.[0] ?? "") + (words.length > 1 ? (words.at(-1)?.[0] ?? "") : (words[0]?.[1] ?? ""))).toUpperCase();
}

/** Avatar de iniciais (ou foto), monocromático. */
export function Avatar({ person, size = 24, className }: { person: PersonRef; size?: 20 | 24; className?: string }) {
  const box = size === 20 ? "size-5 text-[9px]" : "size-6 text-[10px]";
  if (person.image) {
    // eslint-disable-next-line @next/next/no-img-element -- foto de perfil servida pelo próprio sistema
    return <img src={person.image} alt="" className={cn("shrink-0 rounded-full object-cover ring-2 ring-surface", box, className)} />;
  }
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-surface-active font-semibold text-ink-secondary ring-2 ring-surface", box, className)}
    >
      {initialsOf(person.name)}
    </span>
  );
}

/** Avatares sobrepostos (até 3 + contador), com os nomes no rótulo e no tooltip. */
export function AvatarStack({ people, size = 24, max = 3 }: { people: PersonRef[]; size?: 20 | 24; max?: number }) {
  if (people.length === 0) return <span className="text-[13px] text-ink-muted">—</span>;
  const names = people.map((item) => item.name).join(", ");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span role="img" aria-label={`Atribuídos: ${names}`} className="inline-flex items-center">
          {people.slice(0, max).map((item, index) => (
            <Avatar key={item.id} person={item} size={size} className={index > 0 ? "-ml-1.5" : undefined} />
          ))}
          {people.length > max && <span className="ml-1 text-xs text-ink-secondary tabular">+{people.length - max}</span>}
        </span>
      </TooltipTrigger>
      <TooltipContent>{names}</TooltipContent>
    </Tooltip>
  );
}

/** Prioridade (D-101): Alta = ChevronsUp; Crítica = texto coral; Normal não mostra nada. */
export function PriorityMark({ priority, withLabel = false }: { priority: DemandPriority; withLabel?: boolean }) {
  if (priority === "alta") {
    if (withLabel) {
      return (
        <span className="inline-flex items-center gap-1 text-[13px] text-ink-secondary">
          <ChevronsUp className="size-4 stroke-[1.75]" aria-hidden /> Alta
        </span>
      );
    }
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span role="img" aria-label="Prioridade alta" className="inline-flex shrink-0 text-ink-secondary">
            <ChevronsUp className="size-4 stroke-[1.75]" aria-hidden />
          </span>
        </TooltipTrigger>
        <TooltipContent>Prioridade alta</TooltipContent>
      </Tooltip>
    );
  }
  if (priority === "critica") {
    return <span className="text-[13px] font-medium text-coral">{withLabel ? "Crítica" : <span className="sr-only">Prioridade crítica</span>}</span>;
  }
  return withLabel ? <span className="text-[13px] text-ink-secondary">Normal</span> : null;
}

/** Prazo com cor só quando é fato: âmbar < 24h, coral vencido (D-71). */
export function DueText({
  demand,
  className,
}: {
  demand: { status: DemandStatus; priority: DemandPriority; dueDate: string | null; dueTime: string | null };
  className?: string;
}) {
  const label = dueLabel(demand.dueDate, demand.dueTime);
  if (!label) return <span className={cn("text-[13px] text-ink-muted", className)}>Sem prazo</span>;
  const dot = demandDot({ ...demand, priority: "normal" });
  const tone =
    demand.status === "concluida" || demand.status === "cancelada"
      ? "text-ink-secondary"
      : dot === "atrasada"
        ? "text-coral"
        : dot === "atencao-prazo"
          ? "text-amber-fact"
          : "text-ink-secondary";
  return <span className={cn("tabular text-[13px]", tone, className)}>{label}</span>;
}
