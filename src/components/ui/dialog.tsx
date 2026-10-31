"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Modal centralizado. Esc fecha (o fluxo de "Esc de novo para descartar" fica no formulário que o usa).
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-canvas/70 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
      <DialogPrimitive.Content
        className={cn(
          "fixed top-1/2 left-1/2 z-50 flex w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-line-medium bg-surface-elevated text-ink outline-none",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98] data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/** Cabeçalho com título à esquerda e ações (Salvar, Fechar) à direita — nunca no rodapé flutuante. */
function DialogHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-line-subtle px-6 py-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <DialogPrimitive.Title className="text-[15px] font-semibold">{title}</DialogPrimitive.Title>
        {description ? (
          <DialogPrimitive.Description className="text-[13px] text-ink-secondary">
            {description}
          </DialogPrimitive.Description>
        ) : (
          <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
        )}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <DialogPrimitive.Close
          aria-label="Fechar"
          className="inline-flex size-8 items-center justify-center rounded-lg text-ink-secondary hover:bg-surface-hover hover:text-ink"
        >
          <X className="size-[18px] stroke-[1.75]" />
        </DialogPrimitive.Close>
      </div>
    </div>
  );
}

function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-4 px-6 py-5", className)} {...props} />;
}

export { Dialog, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogBody };
