import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Seletor nativo com o visual dos campos (36px). Nativo para ser acessível e funcionar bem com teclado.
export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className={cn("relative", className)}>
      <select
        className="h-8.5 w-full appearance-none rounded-md border border-line-subtle border-b-line-medium bg-input-bg pr-9 pl-2.5 text-[13px] text-ink outline-none focus-visible:border-b-2 focus-visible:border-b-cyan-fact disabled:opacity-50"
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 stroke-[1.75] text-ink-muted"
        aria-hidden
      />
    </div>
  );
}
