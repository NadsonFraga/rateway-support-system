import { cn } from "@/lib/utils";

// Tecla-badge (configuracoes-design-v2.md 3.2): monoespaçada 12px, borda --border-medium, rounded-md.
export function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center rounded-md border border-line-medium px-1.5 py-0.5 font-mono text-xs text-ink-secondary",
        className
      )}
      {...props}
    />
  );
}
