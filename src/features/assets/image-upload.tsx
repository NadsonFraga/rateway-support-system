"use client";

import * as React from "react";
import { ImageUp, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { uploadImage } from "./actions";
import { MAX_ASSET_BYTES } from "./validate";

type ImageUploadProps = {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  /** "quadrado" para logos; "redondo" para foto de perfil. */
  shape?: "quadrado" | "redondo";
  /** Fundo da miniatura: escuro para logo do tema escuro, claro para o do tema claro. */
  previewTheme?: "dark" | "light";
};

// Área de 96px com borda tracejada; depois do envio, miniatura com "Trocar" e "Remover" (configuracoes-design-v2.md §2.1).
export function ImageUpload({ label, value, onChange, shape = "quadrado", previewTheme }: ImageUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const id = React.useId();

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (file.size > MAX_ASSET_BYTES) return setError("A imagem passa de 512 KB. Use uma versão menor.");
    setPending(true);
    const form = new FormData();
    form.append("arquivo", file);
    const result = await uploadImage(form);
    setPending(false);
    if (inputRef.current) inputRef.current.value = "";
    if (!result.ok) return setError(result.error);
    onChange(result.url);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span id={`${id}-rotulo`} className="text-[13px] text-ink-secondary">
        {label}
      </span>
      <div className="flex items-center gap-3">
        <div
          data-theme={value ? previewTheme : undefined}
          className={cn(
            "flex size-24 shrink-0 items-center justify-center overflow-hidden border",
            shape === "redondo" ? "rounded-full" : "rounded-xl",
            value ? "border-line-subtle bg-canvas" : "border-dashed border-line-medium"
          )}
        >
          {pending ? (
            <LoaderCircle className="size-5 animate-spin text-ink-muted" aria-label="Enviando" />
          ) : value ? (
            // eslint-disable-next-line @next/next/no-img-element -- imagem enviada pelo usuário, tamanho livre
            <img src={value} alt={label} className={cn("size-full", shape === "redondo" ? "object-cover" : "object-contain p-2")} />
          ) : (
            <ImageUp className="size-5 stroke-[1.75] text-ink-muted" aria-hidden />
          )}
        </div>
        <div className="flex flex-col items-start gap-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="sr-only"
            aria-labelledby={`${id}-rotulo`}
            onChange={(event) => void onFile(event.target.files?.[0])}
          />
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={pending}>
            {value ? "Trocar" : "Enviar imagem"}
          </Button>
          {value && (
            <Button variant="ghost" size="sm" onClick={() => onChange(null)} disabled={pending}>
              Remover
            </Button>
          )}
          <span className="text-xs text-ink-muted">PNG, SVG, WebP ou JPG, até 512 KB.</span>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-xs text-coral">
          {error}
        </p>
      )}
    </div>
  );
}
