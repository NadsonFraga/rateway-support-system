"use client";

import { motion } from "motion/react";
import { motionSprings } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** O traço do check desenhado em 0,15s; some por inteiro quando desmarcado (sem deixar o ponto da ponta). */
function CheckPath({ checked }: { checked: boolean }) {
  return (
    <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
      <motion.path
        d="M2.5 6.2 5 8.5 9.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
        transition={{ duration: 0.15 }}
      />
    </svg>
  );
}

/** Checkbox da subtarefa, com mola de toque (demandas-spec.md §4.1). */
export function SubtaskCheck({
  checked,
  disabled = false,
  label,
  title,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  title?: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      title={title}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      whileTap={disabled ? undefined : { scale: 0.85 }}
      transition={motionSprings.taptic}
      className={cn(
        "inline-flex size-[18px] shrink-0 items-center justify-center rounded border transition-colors disabled:cursor-not-allowed",
        checked ? "border-ink bg-ink text-ink-inverse" : "border-line-strong bg-surface hover:border-ink-secondary"
      )}
    >
      <CheckPath checked={checked} />
    </motion.button>
  );
}

/** Círculo de concluir da linha (D-107): marcado, fica preenchido com o check. */
export function DoneCircle({
  checked,
  disabled = false,
  label,
  onClick,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      aria-disabled={disabled || undefined}
      tabIndex={-1}
      onClick={(event) => {
        event.stopPropagation();
        if (!disabled) onClick();
      }}
      onKeyDown={(event) => event.stopPropagation()}
      whileTap={disabled ? undefined : { scale: 0.85 }}
      transition={motionSprings.taptic}
      className={cn(
        "group/circle inline-flex size-[18px] shrink-0 items-center justify-center rounded-full border transition-colors",
        checked ? "border-ink bg-ink text-ink-inverse" : "border-line-strong text-ink-secondary",
        disabled ? "cursor-not-allowed opacity-50" : !checked && "hover:border-ink"
      )}
    >
      <CheckPath checked={checked} />
    </motion.button>
  );
}
