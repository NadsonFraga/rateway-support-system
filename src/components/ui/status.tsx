import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

// Matriz de status canônica (design-tokens-and-laws.md 2.3, D-02). Cor só para fatos.
export type Status = "em-andamento" | "aguardando-retorno" | "atencao-prazo" | "atrasada" | "concluida";

export const STATUS_LABEL: Record<Status, string> = {
  "em-andamento": "Em andamento",
  "aguardando-retorno": "Aguardando retorno",
  "atencao-prazo": "Atenção de prazo",
  atrasada: "Atrasada",
  concluida: "Concluída",
};

// As cores vêm das variáveis --dot-* e --status-* (tokens.css, D-80), que mudam conforme o tema do bloco.
const BADGE_KEY: Record<Status, string> = {
  "em-andamento": "andamento",
  "aguardando-retorno": "aguardando",
  "atencao-prazo": "prazo",
  atrasada: "atrasada",
  concluida: "concluida",
};

/** Micro-dot de 6px em CSS puro, sempre com rótulo acessível e tooltip (WCAG 1.4.1). */
export function StatusDot({ status, label }: { status: Status; label?: string }) {
  const text = label ?? STATUS_LABEL[status];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="img"
          aria-label={text}
          tabIndex={0}
          className="inline-flex size-4 shrink-0 items-center justify-center rounded-sm"
        >
          <span
            className="size-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: `var(--dot-${BADGE_KEY[status]})` }}
          />
        </span>
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}

export function StatusBadge({ status, label }: { status: Status; label?: string }) {
  return (
    <span
      className="inline-flex h-6 items-center gap-1.5 rounded-md border px-2 text-[13px] font-medium"
      style={{
        color: `var(--status-${BADGE_KEY[status]}-text)`,
        backgroundColor: `var(--status-${BADGE_KEY[status]}-bg)`,
        borderColor: `var(--status-${BADGE_KEY[status]}-border)`,
      }}
    >
      {label ?? STATUS_LABEL[status]}
    </span>
  );
}
