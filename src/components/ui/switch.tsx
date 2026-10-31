"use client";

import { motion } from "motion/react";
import { motionSprings } from "@/lib/motion";
import { cn } from "@/lib/utils";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
};

// Interruptor monocromático (lei Anti-Arco-Íris): ligado = destaque primário, desligado = superfície.
export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors disabled:opacity-45",
        checked ? "border-transparent bg-accent-primary" : "border-line-medium bg-surface-active"
      )}
    >
      <motion.span
        layout
        transition={motionSprings.taptic}
        className={cn("size-3.5 rounded-full", checked ? "ml-[18px] bg-ink-inverse" : "ml-[3px] bg-ink-muted")}
      />
    </button>
  );
}
