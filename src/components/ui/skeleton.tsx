import { cn } from "@/lib/utils";

// Esqueleto de carregamento: mesma forma do conteúdo final, pulso discreto.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-surface-hover motion-reduce:animate-none", className)}
      {...props}
    />
  );
}

/** Linha de 44px em carregamento, no mesmo ritmo das linhas reais. */
function SkeletonRow() {
  return (
    <div className="flex h-11 items-center gap-3 border-b border-line-subtle px-4">
      <Skeleton className="size-4 rounded" />
      <Skeleton className="h-3.5 w-56" />
      <Skeleton className="ml-auto h-3.5 w-20" />
    </div>
  );
}

export { Skeleton, SkeletonRow };
