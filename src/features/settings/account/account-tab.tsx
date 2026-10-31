"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Keyboard, LoaderCircle, Monitor, Moon, Palette, Sun, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CodeInput } from "@/components/ui/input-otp";
import { Kbd } from "@/components/ui/kbd";
import { SaveButton } from "@/components/ui/save-button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ImageUpload } from "@/features/assets/image-upload";
import { PasswordInput } from "@/features/auth/components/password-input";
import { useTheme } from "@/features/settings/use-theme";
import type { ThemePreference } from "@/features/settings/theme";
import { ACTION_LABEL, DEFAULT_SHORTCUTS, type ActionId } from "@/features/shell/action-registry";
import { useShellUser } from "@/features/shell/shell-user";
import {
  changeOwnPassword,
  confirmOwnAuthenticator,
  loadProfile,
  restartOwnAuthenticator,
  saveProfile,
  type ProfileValues,
} from "../actions/account";
import { FormError, SectionHeader, SectionLoading, SettingsFrame } from "../settings-frame";
import { useSectionForm } from "../use-section-form";

// Minha Conta (configuracoes-design-v2.md §3): perfil, atalhos (só leitura, D-86) e aparência.
export function AccountTab() {
  return (
    <SettingsFrame
      title="Minha Conta"
      sections={[
        { id: "perfil", label: "Perfil", icon: UserRound, content: <ProfileSection /> },
        { id: "atalhos", label: "Atalhos", icon: Keyboard, content: <ShortcutsSection /> },
        { id: "aparencia", label: "Aparência", icon: Palette, content: <AppearanceSection /> },
      ]}
    />
  );
}

function ProfileSection() {
  const user = useShellUser();
  const router = useRouter();
  const [identity, setIdentity] = React.useState<{ username: string; email: string } | null>(null);
  const [dialog, setDialog] = React.useState<"senha" | "autenticador" | null>(null);
  const load = React.useCallback(async () => {
    const value = await loadProfile();
    if (!value) return null;
    setIdentity({ username: value.username, email: value.email });
    return { name: value.name, image: value.image };
  }, []);
  const save = React.useCallback(
    async (draft: ProfileValues) => {
      const result = await saveProfile(draft);
      // A barra superior mostra o nome e a foto novos.
      if (result.ok) router.refresh();
      return result;
    },
    [router]
  );
  const form = useSectionForm<ProfileValues>({ section: "perfil", topic: null, userId: user.id, load, save });
  const { draft } = form;

  return (
    <section aria-label="Perfil" onKeyDown={form.onKeyDown}>
      <SectionHeader
        title="Perfil"
        description="Como você aparece para a equipe."
        escArmed={form.escArmed}
        actions={<SaveButton state={form.saveState} dirty={form.dirty} onSave={() => void form.submit()} />}
      />
      <FormError message={form.error} />
      {!draft || !identity ? (
        <SectionLoading />
      ) : (
        <div className="flex flex-col gap-6">
          <ImageUpload label="Foto" shape="redondo" value={draft.image} onChange={(image) => form.update({ image })} />
          <Field label="Nome" htmlFor="perfil-nome">
            <Input id="perfil-nome" value={draft.name} maxLength={80} onChange={(event) => form.update({ name: event.target.value })} />
          </Field>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field label="Usuário" htmlFor="perfil-usuario" help="Definido pelo Administrador.">
              <Input id="perfil-usuario" value={identity.username} readOnly className="font-mono text-ink-secondary" />
            </Field>
            <Field label="E-mail" htmlFor="perfil-email" help="Definido pelo Administrador.">
              <Input id="perfil-email" value={identity.email} readOnly className="text-ink-secondary" />
            </Field>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-line-subtle pt-5">
            <Button variant="outline" size="sm" onClick={() => setDialog("senha")}>
              Trocar senha
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDialog("autenticador")}>
              Reconfigurar autenticador
            </Button>
          </div>
        </div>
      )}
      <ChangePasswordDialog open={dialog === "senha"} onClose={() => setDialog(null)} />
      <AuthenticatorDialog open={dialog === "autenticador"} onClose={() => setDialog(null)} />
    </section>
  );
}

function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader title="Trocar senha" description="Os outros computadores onde você está logado saem da conta." />
        <DialogBody>{open && <ChangePasswordForm onClose={onClose} />}</DialogBody>
      </DialogContent>
    </Dialog>
  );
}

function ChangePasswordForm({ onClose }: { onClose: () => void }) {
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const user = useShellUser();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    const result = await changeOwnPassword({
      current: String(form.get("current") ?? ""),
      password: String(form.get("password") ?? ""),
      confirmation: String(form.get("confirmation") ?? ""),
    });
    setPending(false);
    if (!result.ok) return setError(result.error);
    setDone(true);
  }

  if (done) {
    return (
      <>
        <p role="status" className="text-sm text-ink">
          Senha trocada.
        </p>
        <Button variant="outline" size="sm" className="self-end" onClick={onClose}>
          Pronto
        </Button>
      </>
    );
  }

  return (
    <form method="post" onSubmit={(event) => void onSubmit(event)} className="flex flex-col gap-4">
      <input type="text" name="username" autoComplete="username" value={user.username} readOnly hidden />
      <FormError message={error} />
      <Field label="Senha atual" htmlFor="senha-atual">
        <PasswordInput id="senha-atual" name="current" autoComplete="current-password" required autoFocus />
      </Field>
      <Field label="Nova senha" htmlFor="senha-nova" help="Pelo menos 8 caracteres.">
        <PasswordInput id="senha-nova" name="password" autoComplete="new-password" required />
      </Field>
      <Field label="Repita a nova senha" htmlFor="senha-repetida">
        <PasswordInput id="senha-repetida" name="confirmation" autoComplete="new-password" required />
      </Field>
      <Button type="submit" size="md" className="self-end" disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" aria-label="Salvando" /> : "Trocar senha"}
      </Button>
    </form>
  );
}

function AuthenticatorDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader
          title="Reconfigurar autenticador"
          description="Use quando trocar de celular. O código antigo continua valendo até você confirmar o novo."
        />
        <DialogBody>{open && <AuthenticatorFlow onClose={onClose} />}</DialogBody>
      </DialogContent>
    </Dialog>
  );
}

function AuthenticatorFlow({ onClose }: { onClose: () => void }) {
  const [setup, setSetup] = React.useState<{ qrCode: string; manualKey: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [done, setDone] = React.useState(false);

  async function onSubmitPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await restartOwnAuthenticator(String(new FormData(event.currentTarget).get("password") ?? ""));
    setPending(false);
    if (!result.ok) return setError(result.error);
    setSetup(result.value);
  }

  async function onCode(value: string) {
    setPending(true);
    const result = await confirmOwnAuthenticator(value);
    setPending(false);
    if (!result.ok) {
      setCode("");
      return setError(result.error);
    }
    setError(null);
    setDone(true);
  }

  return (
    <>
      <FormError message={error} />
      {done ? (
        <>
          <p role="status" className="text-sm text-ink">
            Autenticador reconfigurado.
          </p>
          <Button variant="outline" size="sm" className="self-end" onClick={onClose}>
            Pronto
          </Button>
        </>
      ) : !setup ? (
        <form method="post" onSubmit={(event) => void onSubmitPassword(event)} className="flex flex-col gap-4">
          <Field label="Senha atual" htmlFor="autenticador-senha">
            <PasswordInput id="autenticador-senha" name="password" autoComplete="current-password" required autoFocus />
          </Field>
          <Button type="submit" size="md" className="self-end" disabled={pending}>
            {pending ? <LoaderCircle className="animate-spin" aria-label="Gerando" /> : "Gerar QR Code"}
          </Button>
        </form>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-xl bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- imagem gerada na hora */}
            <img src={setup.qrCode} alt="QR Code para o Google Authenticator" width={180} height={180} />
          </div>
          <code className="font-mono text-[13px] tracking-wider break-all text-ink select-all">
            {setup.manualKey.match(/.{1,4}/g)?.join(" ")}
          </code>
          <CodeInput label="Código de 6 dígitos" value={code} onChange={setCode} onComplete={(value) => void onCode(value)} disabled={pending} autoFocus />
        </div>
      )}
    </>
  );
}

function ShortcutsSection() {
  const actions = Object.keys(DEFAULT_SHORTCUTS) as ActionId[];
  return (
    <section aria-label="Atalhos">
      <SectionHeader title="Atalhos" description="Atalhos de teclado do sistema. A personalização chega na Fase 2." />
      <table className="w-full overflow-hidden rounded-xl border border-line-subtle bg-surface text-sm">
        <thead className="sr-only">
          <tr>
            <th>Ação</th>
            <th>Atalho</th>
          </tr>
        </thead>
        <tbody>
          {actions.map((action) => (
            <tr key={action} className="h-11 border-b border-line-subtle last:border-b-0">
              <td className="px-4 text-ink">{ACTION_LABEL[action]}</td>
              <td className="px-4 text-right">
                <Kbd>{DEFAULT_SHORTCUTS[action].label}</Kbd>
              </td>
            </tr>
          ))}
          <tr className="h-11 border-b border-line-subtle last:border-b-0">
            <td className="px-4 text-ink">Fechar aba pelo teclado (com a aba selecionada)</td>
            <td className="px-4 text-right">
              <Kbd>Delete</Kbd>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

function AppearanceSection() {
  const { preference, setPreference } = useTheme();
  return (
    <section aria-label="Aparência">
      <SectionHeader title="Aparência" description="Vale para este navegador." />
      <SegmentedControl<ThemePreference>
        label="Tema"
        value={preference}
        onChange={setPreference}
        options={[
          { value: "escuro", label: "Escuro", icon: <Moon /> },
          { value: "claro", label: "Claro", icon: <Sun /> },
          { value: "sistema", label: "Sistema", icon: <Monitor /> },
        ]}
      />
    </section>
  );
}
