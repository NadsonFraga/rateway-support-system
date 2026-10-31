"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, LoaderCircle } from "lucide-react";
import { Button } from "./button";
import { motionSprings } from "@/lib/motion";

export type SaveState = "idle" | "saving" | "saved";

type SaveButtonProps = {
  state: SaveState;
  /** Desabilitado até haver alteração (configuracoes-design-v2.md). */
  dirty: boolean;
  onSave: () => void;
  label?: string;
};

// Confirmação no próprio botão: vira "Salvo" com check por 1,2s (D-60). Nunca toast.
export function SaveButton({ state, dirty, onSave, label = "Salvar" }: SaveButtonProps) {
  return (
    <Button
      variant="primary"
      size="md"
      disabled={state === "saving" || (!dirty && state !== "saved")}
      onClick={onSave}
      aria-live="polite"
      className="min-w-24"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={state}
          className="inline-flex items-center gap-2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={motionSprings.taptic}
        >
          {state === "saving" && <LoaderCircle className="animate-spin" aria-hidden />}
          {state === "saved" && <Check aria-hidden />}
          {state === "saving" ? "Salvando" : state === "saved" ? "Salvo" : label}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
