"use client";

import * as React from "react";
import { motion } from "motion/react";
import { motionSprings } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Option<T extends string> = { value: T; label: string; icon?: React.ReactNode };

type SegmentedControlProps<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
};

// O fundo do item ativo desliza com a mola `tabIndicator`. Setas do teclado trocam a opção.
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: SegmentedControlProps<T>) {
  const id = React.useId();
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex h-9 w-fit items-center gap-0.5 rounded-lg border border-line-subtle bg-surface p-0.5", className)}
    >
      {options.map((option, index) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            ref={(element) => {
              refs.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "relative inline-flex h-full items-center gap-1.5 rounded-md px-3 text-[13px] font-medium transition-colors [&_svg]:size-4 [&_svg]:stroke-[1.75]",
              active ? "text-ink" : "text-ink-secondary hover:text-ink"
            )}
          >
            {active && (
              <motion.span
                layoutId={`${id}-indicador`}
                className="absolute inset-0 rounded-md bg-surface-active"
                transition={motionSprings.tabIndicator}
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              {option.icon}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
