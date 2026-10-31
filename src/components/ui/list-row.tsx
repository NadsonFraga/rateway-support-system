import * as React from "react";
import { cn } from "@/lib/utils";

type ListRowProps = React.ComponentProps<"div"> & {
  selected?: boolean;
  interactive?: boolean;
};

// Linha operacional fixa de 44px (D-03): texto 14px, ícones 16px, hover sutil, seleção monocromática.
export function ListRow({ selected, interactive = true, className, ...props }: ListRowProps) {
  return (
    <div
      data-selected={selected || undefined}
      className={cn(
        "flex h-11 items-center gap-3 border-b border-line-subtle px-4 text-sm text-ink",
        "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:stroke-[1.75]",
        interactive && "cursor-pointer transition-colors duration-100 hover:bg-surface-hover",
        selected && "bg-accent-subdued",
        className
      )}
      {...props}
    />
  );
}
