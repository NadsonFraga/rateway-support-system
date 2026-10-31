"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { CodeInput } from "@/components/ui/input-otp";
import { authClient } from "../auth-client";
import { restartAuthenticator, setInitialPassword, type AuthenticatorSetup } from "../actions";
import { PasswordInput } from "./password-input";
import { useHydrated } from "@/lib/use-hydrated";

type Setup = Extract<AuthenticatorSetup, { ok: true }>;

// Primeiro acesso: nova senha → QR Code do Google Authenticator → confirmação com código (D-62).
export function FirstAccess({ email, needsPassword }: { email: string; needsPassword: boolean }) {
  const router = useRouter();
  const [setup, setSetup] = React.useState<Setup | null>(null);
  const hydrated = useHydrated();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [code, setCode] = React.useState("");

  async function onSubmitPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const result = needsPassword
      ? await setInitialPassword({
          password: String(form.get("password") ?? ""),
          confirmation: String(form.get("confirmation") ?? ""),
        })
      : await restartAuthenticator(String(form.get("password") ?? ""));
    setPending(false);
    if (!result.ok) return setError(result.error);
    setSetup(result);
  }

  async function onSubmitCode(value: string) {
    setPending(true);
    setError(null);
    const { error: verifyError } = await authClient.twoFactor.verifyTotp({ code: value });
    if (verifyError) {
      setPending(false);
      setCode("");
      return setError("Código incorreto. Confira o Google Authenticator e digite o código atual.");
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="w-full rounded-2xl border border-line-subtle bg-surface p-8">
      <AnimatePresence mode="wait" initial={false}>
        {!setup ? (
          <motion.form
            key="senha"
            method="post"
            onSubmit={onSubmitPassword}
            className="flex flex-col gap-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex flex-col gap-1">
              <h1 className="text-lg font-semibold text-ink">
                {needsPassword ? "Defina sua senha" : "Configure o autenticador"}
              </h1>
              <p className="text-[13px] text-ink-secondary">
                {needsPassword
                  ? "Troque a senha temporária por uma senha só sua. Depois vem o Google Authenticator."
                  : "Confirme sua senha para gerar o QR Code do Google Authenticator."}
              </p>
            </div>
            {/* Ajuda o Gerenciador de Senhas do Google a salvar a senha nova na conta certa. */}
            <input type="email" name="email" autoComplete="username" value={email} readOnly hidden />
            <Field
              label={needsPassword ? "Nova senha" : "Senha"}
              htmlFor="password"
              help={needsPassword ? "Pelo menos 8 caracteres." : undefined}
            >
              <PasswordInput
                id="password"
                name="password"
                autoComplete={needsPassword ? "new-password" : "current-password"}
                required
                autoFocus
              />
            </Field>
            {needsPassword && (
              <Field label="Repita a nova senha" htmlFor="confirmation">
                <PasswordInput id="confirmation" name="confirmation" autoComplete="new-password" required />
              </Field>
            )}
            <div className="flex flex-col gap-3">
              <Button type="submit" size="lg" className="w-full" disabled={!hydrated || pending} aria-busy={pending}>
                {pending ? <LoaderCircle className="animate-spin" aria-label="Salvando" /> : "Continuar"}
              </Button>
              {error && (
                <p role="alert" className="text-[13px] text-coral">
                  {error}
                </p>
              )}
            </div>
          </motion.form>
        ) : (
          <motion.div
            key="autenticador"
            className="flex flex-col gap-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex flex-col gap-1">
              <h1 className="text-lg font-semibold text-ink">Google Authenticator</h1>
              <p className="text-[13px] text-ink-secondary">
                No aplicativo, toque em adicionar e leia o QR Code. Depois digite o código que aparecer.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3">
              {/* QR Code sempre em fundo claro, para a câmera ler nos dois temas. */}
              <div className="rounded-xl bg-white p-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- imagem gerada na hora */}
                <img src={setup.qrCode} alt="QR Code para o Google Authenticator" width={180} height={180} />
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-ink-muted">Sem câmera? Digite esta chave no aplicativo:</span>
                <code className="font-mono text-[13px] tracking-wider break-all text-ink select-all">
                  {setup.manualKey.match(/.{1,4}/g)?.join(" ")}
                </code>
              </div>
            </div>
            <Field label="Código de 6 dígitos" htmlFor="codigo-confirmacao">
              <div id="codigo-confirmacao">
                <CodeInput
                  label="Código de 6 dígitos"
                  value={code}
                  onChange={setCode}
                  onComplete={onSubmitCode}
                  invalid={!!error}
                  disabled={pending}
                  autoFocus
                />
              </div>
            </Field>
            {error && (
              <p role="alert" className="text-[13px] text-coral">
                {error}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
