"use client";

import { OTPInput, REGEXP_ONLY_DIGITS, type SlotProps } from "input-otp";
import { cn } from "@/lib/utils";

type CodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  /** Chamado ao completar os 6 dígitos (envio automático). */
  onComplete?: (value: string) => void;
  invalid?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  label: string;
};

// Código do autenticador: 6 caixas de 44px, monoespaçada 20px; colar preenche tudo.
export function CodeInput({ value, onChange, onComplete, invalid, disabled, autoFocus, label }: CodeInputProps) {
  return (
    <OTPInput
      maxLength={6}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      pattern={REGEXP_ONLY_DIGITS}
      inputMode="numeric"
      autoComplete="one-time-code"
      aria-label={label}
      aria-invalid={invalid || undefined}
      disabled={disabled}
      autoFocus={autoFocus}
      containerClassName="flex items-center gap-2 has-disabled:opacity-50"
      render={({ slots }) => (
        <>
          {slots.map((slot, index) => (
            <CodeSlot key={index} {...slot} invalid={invalid} />
          ))}
        </>
      )}
    />
  );
}

function CodeSlot({ char, hasFakeCaret, isActive, invalid }: SlotProps & { invalid?: boolean }) {
  return (
    <div
      className={cn(
        "relative flex size-11 items-center justify-center rounded-lg border bg-surface font-mono text-xl text-ink transition-colors",
        invalid ? "border-coral" : isActive ? "border-line-focus" : "border-line-medium"
      )}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-px animate-pulse bg-ink" />
        </div>
      )}
    </div>
  );
}
