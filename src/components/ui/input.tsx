import * as React from "react";
import { cn } from "@/lib/utils";

// Campo de 36px, rounded-lg, fundo --bg-surface, borda --border-subtle, foco --border-focus.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-8.5 w-full min-w-0 rounded-md border border-line-subtle border-b-line-medium bg-input-bg px-2.5 text-[13px] text-ink transition-colors outline-none placeholder:text-ink-muted",
        "focus-visible:border-b-2 focus-visible:border-b-cyan-fact focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-coral",
        className
      )}
      {...props}
    />
  );
}

export { Input };
