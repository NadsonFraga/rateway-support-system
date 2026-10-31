"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

// Campo de senha com botão para revelar. O tipo volta a "password" ao enviar o formulário.
export function PasswordInput(props: Omit<React.ComponentProps<typeof Input>, "type">) {
  const [visible, setVisible] = React.useState(false);
  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className="pr-10" />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={visible}
        className="absolute top-1/2 right-1 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-ink-muted hover:bg-surface-hover hover:text-ink"
      >
        {visible ? <EyeOff className="size-4 stroke-[1.75]" /> : <Eye className="size-4 stroke-[1.75]" />}
      </button>
    </div>
  );
}
