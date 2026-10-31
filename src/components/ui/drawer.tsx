"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { motionSprings } from "@/lib/motion";
import { cn } from "@/lib/utils";

type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Ações do cabeçalho (Editar, Salvar…). */
  actions?: React.ReactNode;
  /** Faixa logo abaixo do cabeçalho (ex.: "Ana está editando"). */
  banner?: React.ReactNode;
  /** Permite ao formulário interceptar o Esc (D-64: segundo Esc descarta). */
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  children: React.ReactNode;
  className?: string;
};

// Painel lateral ancorado à direita, com a mola `drawer`. Largura fixa de 560px (D-79).
export function Drawer({
  open,
  onOpenChange,
  title,
  actions,
  banner,
  onEscapeKeyDown,
  children,
  className,
}: DrawerProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-40 bg-canvas/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild forceMount onEscapeKeyDown={onEscapeKeyDown}>
              <motion.aside
                className={cn(
                  "fixed inset-y-0 right-0 z-50 flex w-[560px] max-w-full flex-col border-l border-line-medium bg-surface text-ink outline-none",
                  className
                )}
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={motionSprings.drawer}
              >
                <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line-subtle px-5">
                  <DialogPrimitive.Title className="min-w-0 flex-1 truncate text-[15px] font-semibold">
                    {title}
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
                  {actions}
                  <DialogPrimitive.Close
                    aria-label="Fechar"
                    className="inline-flex size-8 items-center justify-center rounded-lg text-ink-secondary hover:bg-surface-hover hover:text-ink"
                  >
                    <X className="size-[18px] stroke-[1.75]" />
                  </DialogPrimitive.Close>
                </header>
                {banner}
                <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
              </motion.aside>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
