import * as React from "react";
import { cn } from "@/lib/utils";

type FieldProps = {
  label: string;
  htmlFor: string;
  help?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
};

// Rótulo 13px acima, ajuda 12px abaixo; erro em coral substitui a ajuda.
export function Field({ label, htmlFor, help, error, className, children }: FieldProps) {
  const messageId = `${htmlFor}-mensagem`;
  const message = error ?? help;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[13px] text-ink-secondary">
        {label}
      </label>
      {React.isValidElement<React.HTMLAttributes<HTMLElement>>(children)
        ? React.cloneElement(children, {
            "aria-describedby": message ? messageId : undefined,
            "aria-invalid": error ? true : undefined,
          })
        : children}
      {message && (
        <p
          id={messageId}
          className={cn("text-xs", error ? "text-coral" : "text-ink-muted")}
          role={error ? "alert" : undefined}
        >
          {message}
        </p>
      )}
    </div>
  );
}
