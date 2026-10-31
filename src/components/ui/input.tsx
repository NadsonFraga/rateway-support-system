import * as React from "react";
import { cn } from "@/lib/utils";

// Campo de 36px, rounded-lg, fundo --bg-surface, borda --border-subtle, foco --border-focus.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border border-line-subtle bg-surface px-3 text-sm text-ink transition-colors outline-none placeholder:text-ink-muted",
        "focus-visible:border-line-focus focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-coral",
        className
      )}
      {...props}
    />
  );
}

export { Input };
