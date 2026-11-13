"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export type ComboboxOption = { value: string; label: string; hint?: string; icon?: React.ReactNode };

/**
 * Escolha de uma opção com busca, em menu ancorado que abre para baixo (listas longas: clientes, plataformas).
 * Digitar filtra por nome ou dica (ex.: código do cliente); setas e Enter escolhem.
 */
export function Combobox({
  id,
  value,
  onChange,
  options,
  emptyLabel,
  searchPlaceholder = "Buscar…",
  className,
}: {
  id?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  options: ComboboxOption[];
  /** Rótulo da opção "nenhum" (ex.: "Sem cliente"). */
  emptyLabel: string;
  searchPlaceholder?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const current = options.find((item) => item.value === value) ?? null;
  const choose = (next: string | null) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        className={cn(
          "inline-flex h-9 w-full min-w-0 items-center gap-2 rounded-lg border border-line-subtle bg-surface pr-2.5 pl-3 text-left text-sm text-ink outline-none hover:bg-surface-hover focus-visible:border-line-focus aria-expanded:border-line-focus",
          className
        )}
      >
        {current?.icon}
        <span className={cn("min-w-0 flex-1 truncate", !current && "text-ink-secondary")}>{current ? current.label : emptyLabel}</span>
        {current?.hint && <span className="shrink-0 font-mono text-xs text-ink-muted">{current.hint}</span>}
        <ChevronDown className="size-4 shrink-0 stroke-[1.75] text-ink-muted" aria-hidden />
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" avoidCollisions={false} className="w-(--radix-popover-trigger-width) min-w-72 gap-0 p-0">
        <Command loop>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-72">
            <CommandEmpty>Nada encontrado.</CommandEmpty>
            <CommandItem value={`__nenhum ${emptyLabel}`} onSelect={() => choose(null)}>
              <span className="flex-1 text-ink-secondary">{emptyLabel}</span>
              {!current && <Check aria-hidden />}
            </CommandItem>
            {options.map((item) => (
              <CommandItem key={item.value} value={`${item.label} ${item.hint ?? ""} ${item.value}`} onSelect={() => choose(item.value)}>
                {item.icon}
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.hint && <span className="shrink-0 font-mono text-xs text-ink-muted">{item.hint}</span>}
                {current?.value === item.value && <Check aria-hidden />}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
