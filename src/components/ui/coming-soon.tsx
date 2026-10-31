import { Clock } from "lucide-react";

// Bloco "Em breve" (clientes-design-v2.md): borda tracejada, ícone Clock 20px, sem botão e sem animação.
export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-dashed border-line-medium p-5">
      <Clock className="size-5 shrink-0 stroke-[1.75] text-ink-muted" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-ink-secondary">{title}</p>
        <p className="text-[13px] text-ink-muted">{description}</p>
      </div>
    </div>
  );
}
