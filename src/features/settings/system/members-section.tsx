"use client";

import * as React from "react";
import { Check, Copy, Ellipsis, KeyRound, Plus, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ROLE_LABEL, ROLES, type Role } from "@/features/auth/permissions";
import { normalizeUsername } from "@/features/auth/username";
import { useRealtime } from "@/features/realtime/client";
import { useShellUser } from "@/features/shell/shell-user";
import {
  changeMemberRole,
  createMember,
  listMembers,
  resetMemberPassword,
  setMemberActive,
  type MemberRow,
} from "../actions/members";
import { FormError, SectionHeader, SectionLoading } from "../settings-frame";
import { settingsTopic } from "../topics";

const TWO_FACTOR_LABEL: Record<MemberRow["twoFactor"], string> = {
  ativo: "Ativo",
  pendente: "Pendente",
  "aguardando-primeiro-acesso": "Aguardando primeiro acesso",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

type Confirm = { kind: "desativar" | "nova-senha"; member: MemberRow } | null;

// Membros (configuracoes-design-v2.md §2.6, D-62, D-85).
export function MembersSection() {
  const me = useShellUser();
  const [members, setMembers] = React.useState<MemberRow[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [confirm, setConfirm] = React.useState<Confirm>(null);
  const [tempPassword, setTempPassword] = React.useState<{ name: string; password: string } | null>(null);

  const reload = React.useCallback(async () => {
    try {
      const list = await listMembers();
      setMembers(list ?? []);
    } catch {
      setMembers([]);
    }
  }, []);
  React.useEffect(() => {
    let cancelled = false;
    void listMembers()
      .then((list) => {
        if (!cancelled) setMembers(list ?? []);
      })
      .catch(() => {
        if (!cancelled) setMembers([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useRealtime(settingsTopic("membros"), () => void reload());

  async function run<T>(action: () => Promise<{ ok: true; value: T } | { ok: false; error: string }>) {
    setError(null);
    const result = await action();
    if (!result.ok) setError(result.error);
    void reload();
    return result;
  }

  async function confirmAction() {
    if (!confirm) return;
    const { kind, member } = confirm;
    setConfirm(null);
    if (kind === "desativar") await run(() => setMemberActive(member.id, false));
    else {
      const result = await run(() => resetMemberPassword(member.id));
      if (result.ok) setTempPassword({ name: member.name, password: result.value.tempPassword });
    }
  }

  return (
    <section aria-label="Membros">
      <SectionHeader
        title="Membros"
        description="Quem acessa o sistema e com qual perfil. Cada pessoa entra com usuário, senha e Google Authenticator."
        actions={
          <Button size="md" onClick={() => setCreating(true)}>
            <Plus /> Novo membro
          </Button>
        }
      />
      <FormError message={error} />
      {!members ? (
        <SectionLoading />
      ) : (
        <ul aria-label="Membros" className="overflow-hidden rounded-xl border border-line-subtle bg-surface">
          {members.map((member) => {
            const self = member.id === me.id;
            return (
              <li
                key={member.id}
                className={cn("flex min-h-11 items-center gap-3 border-b border-line-subtle px-4 py-2 last:border-b-0", !member.active && "opacity-70")}
              >
                {member.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- foto enviada pelo membro
                  <img src={member.image} alt="" className="size-6 shrink-0 rounded-full object-cover" />
                ) : (
                  <span aria-hidden className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-line-medium bg-surface-active text-[10px] font-semibold text-ink">
                    {initials(member.name)}
                  </span>
                )}
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className={cn("truncate text-sm font-medium", member.active ? "text-ink" : "text-ink-muted")}>
                    {member.name}
                    {self && <span className="ml-1.5 text-xs font-normal text-ink-muted">(você)</span>}
                    {!member.active && <span className="ml-1.5 text-xs font-normal text-ink-muted">Desativado</span>}
                  </span>
                  <span className="truncate text-[13px] text-ink-secondary">
                    <span className="font-mono">{member.username}</span> · {member.email}
                  </span>
                </div>
                <Select
                  aria-label={`Perfil de ${member.name}`}
                  value={member.role}
                  disabled={!member.active}
                  onChange={(event) => void run(() => changeMemberRole(member.id, event.target.value as Role))}
                  className="w-52"
                >
                  {Object.values(ROLES).map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABEL[role]}
                    </option>
                  ))}
                </Select>
                <span
                  className={cn("w-40 text-[13px]", member.twoFactor === "ativo" ? "text-ink" : "text-ink-muted")}
                  title="Google Authenticator"
                >
                  {TWO_FACTOR_LABEL[member.twoFactor]}
                </span>
                <Switch
                  checked={member.active}
                  label={`Conta de ${member.name} ativa`}
                  disabled={self}
                  onChange={(checked) =>
                    checked ? void run(() => setMemberActive(member.id, true)) : setConfirm({ kind: "desativar", member })
                  }
                />
                <DropdownMenu>
                  <DropdownMenuTrigger
                    aria-label={`Ações de ${member.name}`}
                    className="inline-flex size-7 items-center justify-center rounded-md text-ink-muted hover:bg-surface-hover hover:text-ink aria-expanded:bg-surface-hover"
                  >
                    <Ellipsis className="size-4 stroke-[1.75]" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuItem disabled={self || !member.active} onSelect={() => setConfirm({ kind: "nova-senha", member })}>
                      <KeyRound /> Gerar nova senha temporária
                    </DropdownMenuItem>
                    {member.active ? (
                      <DropdownMenuItem variant="danger" disabled={self} onSelect={() => setConfirm({ kind: "desativar", member })}>
                        <UserX /> Desativar
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onSelect={() => void run(() => setMemberActive(member.id, true))}>
                        <UserCheck /> Reativar
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            );
          })}
        </ul>
      )}

      <NewMemberDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(name, password) => {
          setCreating(false);
          setTempPassword({ name, password });
          void reload();
        }}
      />

      <Dialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader
            title={confirm?.kind === "desativar" ? `Desativar ${confirm.member.name}?` : `Gerar nova senha para ${confirm?.member.name ?? ""}?`}
            description={
              confirm?.kind === "desativar"
                ? "O acesso é cortado na hora, inclusive em computadores onde a pessoa já está logada. Dá para reativar depois."
                : "A senha atual deixa de valer, a pessoa sai de onde estiver logada e refaz o primeiro acesso com a senha nova e o Google Authenticator."
            }
          />
          <DialogBody className="flex-row justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirm(null)} autoFocus>
              Cancelar
            </Button>
            <Button variant={confirm?.kind === "desativar" ? "danger" : "primary"} size="sm" onClick={() => void confirmAction()}>
              {confirm?.kind === "desativar" ? "Desativar" : "Gerar nova senha"}
            </Button>
          </DialogBody>
        </DialogContent>
      </Dialog>

      <TempPasswordDialog value={tempPassword} onClose={() => setTempPassword(null)} />
    </section>
  );
}

function NewMemberDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (name: string, password: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent>{open && <NewMemberForm onCreated={onCreated} />}</DialogContent>
    </Dialog>
  );
}

/** Formulário do novo membro: nasce vazio a cada abertura do modal. */
function NewMemberForm({ onCreated }: { onCreated: (name: string, password: string) => void }) {
  const [draft, setDraft] = React.useState({ name: "", username: "", email: "", role: ROLES.operadorRotina as Role });
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function submit() {
    setPending(true);
    setError(null);
    const result = await createMember(draft);
    setPending(false);
    if (!result.ok) return setError(result.error);
    onCreated(draft.name, result.value.tempPassword);
  }

  return (
    <>
      <DialogHeader
        title="Novo membro"
        description="A senha temporária aparece depois de criar."
        actions={
          <Button size="sm" onClick={() => void submit()} disabled={pending || !draft.name || !draft.username || !draft.email}>
            Criar membro
          </Button>
        }
      />
      <DialogBody>
        <FormError message={error} />
        <Field label="Nome" htmlFor="membro-nome">
          <Input id="membro-nome" value={draft.name} autoFocus onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        </Field>
        <Field label="Usuário" htmlFor="membro-usuario" help="Minúsculas sem acento, números e ponto, de 3 a 30 caracteres. É o que a pessoa digita para entrar.">
          <Input
            id="membro-usuario"
            value={draft.username}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="font-mono"
            onChange={(event) => setDraft({ ...draft, username: normalizeUsername(event.target.value) })}
          />
        </Field>
        <Field label="E-mail" htmlFor="membro-email">
          <Input id="membro-email" type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} />
        </Field>
        <Field label="Perfil" htmlFor="membro-perfil">
          <Select id="membro-perfil" value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value as Role })}>
            {Object.values(ROLES).map((role) => (
              <option key={role} value={role}>
                {ROLE_LABEL[role]}
              </option>
            ))}
          </Select>
        </Field>
      </DialogBody>
    </>
  );
}

/** A senha temporária aparece uma única vez (D-62), com botão de copiar. */
function TempPasswordDialog({ value, onClose }: { value: { name: string; password: string } | null; onClose: () => void }) {
  return (
    <Dialog open={!!value} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">{value && <TempPasswordContent value={value} onClose={onClose} />}</DialogContent>
    </Dialog>
  );
}

function TempPasswordContent({ value, onClose }: { value: { name: string; password: string }; onClose: () => void }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <>
      <DialogHeader title={`Senha temporária de ${value.name}`} description="Esta senha só aparece agora. Repasse ao colaborador." />
      <DialogBody>
        <div className="flex items-center gap-3 rounded-lg border border-line-medium bg-surface px-4 py-3">
          <code data-testid="senha-temporaria" className="flex-1 font-mono text-base tracking-wide text-ink select-all">
            {value.password}
          </code>
          <Button variant="ghost" size="sm" onClick={() => void navigator.clipboard.writeText(value.password).then(() => setCopied(true))}>
            {copied ? <Check /> : <Copy />} {copied ? "Copiada" : "Copiar"}
          </Button>
        </div>
        <p className="text-[13px] text-ink-secondary">
          Vale por 48 horas. No primeiro acesso, a pessoa cria uma senha própria e configura o Google Authenticator.
        </p>
        <Button variant="outline" size="sm" className="self-end" onClick={onClose}>
          Pronto
        </Button>
      </DialogBody>
    </>
  );
}
