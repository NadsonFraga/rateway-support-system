import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Seletor nativo com o visual dos campos (36px). Nativo para ser acessível e funcionar bem com teclado.
export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className={cn("relative", className)}>
      <select
        className="h-9 w-full appearance-none rounded-lg border border-line-subtle bg-surface pr-9 pl-3 text-sm text-ink outline-none focus-visible:border-line-focus disabled:opacity-50"
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 stroke-[1.75] text-ink-muted"
        aria-hidden
      />
    </div>
  );
}
