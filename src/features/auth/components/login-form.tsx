"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CodeInput } from "@/components/ui/input-otp";
import { motionSprings } from "@/lib/motion";
import { authClient } from "../auth-client";
import { PasswordInput } from "./password-input";
import { useHydrated } from "@/lib/use-hydrated";
import { normalizeUsername } from "../username";

const TEMP_PASSWORD_EXPIRED = "SENHA_TEMPORARIA_EXPIRADA";

type Step = "credenciais" | "codigo";

export function LoginForm({ instanceName }: { instanceName: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shake = useAnimationControls();
  const [step, setStep] = React.useState<Step>("credenciais");
  const hydrated = useHydrated();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(
    searchParams.get("motivo") === "expirada" ? "Sua sessão expirou. Entre novamente." : null
  );
  const [code, setCode] = React.useState("");

  function fail(message: string) {
    setError(message);
    setPending(false);
    // Leve deslocamento horizontal de 4px com a mola `taptic`.
    void shake.start({ x: [0, -4, 4, -4, 0], transition: { ...motionSprings.taptic, type: "tween", duration: 0.28 } });
  }

  async function onSubmitCredentials(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);

    const { data, error: signInError } = await authClient.signIn.username({
      username: normalizeUsername(String(form.get("username") ?? "")),
      password: String(form.get("password") ?? ""),
    });

    if (signInError) {
      if (signInError.code === TEMP_PASSWORD_EXPIRED || signInError.message === TEMP_PASSWORD_EXPIRED) {
        return fail("Sua senha temporária expirou. Peça uma nova ao administrador.");
      }
      if (signInError.status === 429) {
        return fail("Muitas tentativas seguidas. Aguarde um minuto e tente de novo.");
      }
      // Mensagem genérica: não revela se o erro foi no usuário ou na senha.
      return fail("Usuário ou senha incorretos.");
    }

    if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) {
      setPending(false);
      setStep("codigo");
      return;
    }

    // Sem autenticador ainda: o servidor leva ao primeiro acesso.
    window.location.assign("/");
  }

  async function onSubmitCode(value: string) {
    setPending(true);
    setError(null);
    const { error: verifyError } = await authClient.twoFactor.verifyTotp({ code: value });
    if (verifyError) {
      setCode("");
      if (verifyError.status === 429) return fail("Muitas tentativas seguidas. Aguarde um minuto e tente de novo.");
      return fail("Código incorreto. Confira o Google Authenticator e digite o código atual.");
    }
    window.location.assign("/");
  }

  return (
    <motion.div
      animate={shake}
      className="w-full rounded-2xl border border-line-subtle bg-surface p-8"
    >
      <AnimatePresence mode="wait" initial={false}>
        {step === "credenciais" ? (
          <motion.form
            key="credenciais"
            method="post"
            onSubmit={onSubmitCredentials}
            className="flex flex-col gap-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <h1 className="text-lg font-semibold text-ink">
              {instanceName ? `Entrar no ${instanceName}` : "Entrar"}
            </h1>
            <Field label="Usuário" htmlFor="username">
              <Input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                autoFocus
              />
            </Field>
            <Field label="Senha" htmlFor="password">
              <PasswordInput id="password" name="password" autoComplete="current-password" required />
            </Field>
            <div className="flex flex-col gap-3">
              <Button type="submit" size="lg" className="w-full" disabled={!hydrated || pending} aria-busy={pending}>
                {pending ? <LoaderCircle className="animate-spin" aria-label="Verificando" /> : "Entrar"}
              </Button>
              <ErrorMessage message={error} />
            </div>
          </motion.form>
        ) : (
          <motion.div
            key="codigo"
            className="flex flex-col gap-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex flex-col gap-1">
              <h1 className="text-lg font-semibold text-ink">Código do autenticador</h1>
              <p className="text-[13px] text-ink-secondary">
                Abra o Google Authenticator e digite o código de 6 dígitos.
              </p>
            </div>
            <CodeInput
              label="Código do autenticador"
              value={code}
              onChange={setCode}
              onComplete={onSubmitCode}
              invalid={!!error}
              disabled={pending}
              autoFocus
            />
            <div className="flex flex-col gap-3">
              <ErrorMessage message={error} />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="self-start"
                onClick={() => {
                  setStep("credenciais");
                  setError(null);
                  setCode("");
                }}
              >
                Usar outra conta
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ErrorMessage({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-[13px] text-coral">
      {message}
    </p>
  );
}
