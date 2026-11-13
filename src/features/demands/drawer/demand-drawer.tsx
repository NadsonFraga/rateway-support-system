"use client";

import * as React from "react";
import { motion } from "motion/react";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, Copy, ExternalLink, FileText, FolderOpen, GripVertical, Link2, Lock, Pencil, Plus, Trash2, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SaveButton, type SaveState } from "@/components/ui/save-button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, StatusDot } from "@/components/ui/status";
import { motionSprings } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ROLES } from "@/features/auth/permissions";
import { EntityLogo } from "@/features/clients/components/bits";
import { useRecordLock } from "@/features/locks/use-record-lock";
import { usePresence, useRealtime } from "@/features/realtime/client";
import { useShellUser } from "@/features/shell/shell-user";
import { useTabs, wantsNewTab } from "@/features/shell/tabs-store";
import { addComment, confirmMyPart, createDemand, loadDemandFormOptions, openDemand, saveDemand, toggleSubtask } from "../actions";
import { Avatar, AvatarStack, DueText, PriorityMark } from "../components/bits";
import { SubtaskCheck } from "../components/checks";
import { useDemandDrawer, type DemandPreset } from "../drawer-store";
import { isEmptyDoc } from "../editor/doc";
import { mentionOptions, RichEditor } from "../editor/rich-editor";
import { RichText } from "../editor/rich-text";
import { dotLabel } from "../list/demand-row";
import {
  canConclude,
  changeSentence,
  demandDot,
  DEMAND_PRIORITIES,
  DEMAND_PRIORITY_LABEL,
  DEMAND_STATUSES,
  DEMAND_STATUS_LABEL,
} from "../rules";
import { DEMANDS_TOPIC, demandPresenceTopic } from "../topics";
import type { DemandDetail, DemandFormOptions, DemandInput } from "../types";

function inputOf(detail: DemandDetail): DemandInput {
  return {
    title: detail.title,
    description: detail.description,
    status: detail.status,
    priority: detail.priority,
    dueDate: detail.dueDate,
    dueTime: detail.dueTime,
    clientId: detail.client?.id ?? null,
    platformId: detail.platform?.id ?? null,
    requireAllConfirm: detail.requireAllConfirm,
    assigneeIds: detail.assignees.map((item) => item.id),
    subtasks: detail.subtasks.map((item) => ({ id: item.id, key: item.id, text: item.text, done: item.done })),
    attachments: detail.attachments.map((item) => ({ id: item.id, url: item.url, name: item.name, mimeType: item.mimeType })),
  };
}

function emptyInput(preset: DemandPreset, me: string): DemandInput {
  return {
    title: "",
    description: null,
    status: "a_fazer",
    priority: "normal",
    dueDate: null,
    dueTime: null,
    clientId: preset.clientId ?? null,
    platformId: null,
    requireAllConfirm: false,
    assigneeIds: [me],
    subtasks: [],
    attachments: [],
  };
}

const time = (value: string) => new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const dateTime = (value: string) =>
  new Date(value).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(",", " ·");

function isTyping(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  return !!element && (element.tagName === "INPUT" || element.tagName === "TEXTAREA" || element.tagName === "SELECT" || element.isContentEditable);
}

/** Painel lateral da demanda (demandas-spec.md §4 e §5), um só para o sistema todo. */
export function DemandDrawerHost() {
  const code = useDemandDrawer((state) => state.code);
  const creating = useDemandDrawer((state) => state.creating);
  const close = useDemandDrawer((state) => state.close);
  const [options, setOptions] = React.useState<DemandFormOptions | null>(null);
  const open = !!code || !!creating;

  React.useEffect(() => {
    let cancelled = false;
    void loadDemandFormOptions().then((value) => {
      if (!cancelled && value) setOptions(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!open || options) return;
    let cancelled = false;
    void loadDemandFormOptions().then((value) => {
      if (!cancelled && value) setOptions(value);
    });
    return () => {
      cancelled = true;
    };
  }, [open, options]);

  if (!open) return <Drawer open={false} onOpenChange={() => undefined} title="">{null}</Drawer>;
  if (!options) {
    return (
      <Drawer open onOpenChange={(value) => !value && close()} title="Carregando demanda">
        <LoadingBody />
      </Drawer>
    );
  }
  // Uma instância por demanda: trocar de demanda (↑/↓) recomeça limpo, com a trava certa.
  return <DemandPanel key={code ?? "nova"} code={code} preset={creating} options={options} onClose={close} />;
}

function LoadingBody() {
  return (
    <div className="flex flex-col gap-3 p-5">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

function DemandPanel({
  code,
  preset,
  options,
  onClose,
}: {
  code: string | null;
  preset: DemandPreset | null;
  options: DemandFormOptions;
  onClose: () => void;
}) {
  const me = useShellUser();
  const isAdmin = me.role === ROLES.administrador;
  const creating = !code;
  const openDrawer = useDemandDrawer((state) => state.open);
  const siblings = useDemandDrawer((state) => state.siblings);
  const [detail, setDetail] = React.useState<DemandDetail | null | undefined>(creating ? null : undefined);
  const [draft, setDraft] = React.useState<DemandInput>(() => emptyInput(preset ?? {}, me.id));
  const [saveState, setSaveState] = React.useState<SaveState>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [blockedByConfirm, setBlockedByConfirm] = React.useState(false);
  const escArmed = React.useRef<number | null>(null);

  const record = useRecordLock("demanda", detail?.id ?? null, !creating);
  const editing = creating || record.editing;
  const saved = React.useMemo(() => (detail ? inputOf(detail) : emptyInput(preset ?? {}, me.id)), [detail, preset, me.id]);
  const dirty = editing && JSON.stringify(draft) !== JSON.stringify(saved);
  const shownNotice = notice ?? (editing ? null : record.lostMessage);
  const viewers = usePresence(detail ? demandPresenceTopic(detail.id) : "");

  React.useEffect(() => {
    if (!code) return;
    let cancelled = false;
    void openDemand(code).then((value) => !cancelled && setDetail(value));
    return () => {
      cancelled = true;
    };
  }, [code]);

  useRealtime<{ id: string }>(DEMANDS_TOPIC, (message) => {
    if (code && detail && message.data.id === detail.id) void openDemand(code).then((value) => value && setDetail(value));
  });

  // Ao fechar ou trocar de demanda, a trava é sempre liberada.
  const stopRef = React.useRef(record.stop);
  React.useEffect(() => {
    stopRef.current = record.stop;
  });
  React.useEffect(() => () => void stopRef.current(), []);

  async function startEditing() {
    if (!detail) return;
    setNotice(null);
    setError(null);
    setDraft(inputOf(detail));
    const result = await record.start();
    if (!result.ok && result.error) setNotice(result.error);
  }

  async function save(force = false) {
    if (!dirty) return;
    setSaveState("saving");
    setError(null);
    setBlockedByConfirm(false);
    if (creating) {
      const result = await createDemand(draft);
      if (!result.ok) {
        setSaveState("idle");
        setError(result.error);
        return;
      }
      setSaveState("saved");
      openDrawer(result.value.code);
      return;
    }
    const result = await saveDemand(detail!.id, draft, { force });
    if (!result.ok) {
      setSaveState("idle");
      setError(result.error);
      setBlockedByConfirm(isAdmin && result.error.includes("forçar"));
      return;
    }
    record.released();
    setDetail(result.value);
    setSaveState("saved");
    window.setTimeout(() => setSaveState("idle"), 1200);
  }

  function discardOrClose() {
    if (editing && dirty) {
      if (escArmed.current) {
        window.clearTimeout(escArmed.current);
        escArmed.current = null;
        setNotice(null);
        if (creating) return onClose();
        setDraft(saved);
        void record.stop();
        return;
      }
      setNotice("Esc de novo para descartar");
      escArmed.current = window.setTimeout(() => {
        escArmed.current = null;
        setNotice(null);
      }, 3000);
      return;
    }
    if (editing && !creating) {
      void record.stop();
      return;
    }
    onClose();
  }

  function onKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      if (editing) void save();
      return;
    }
    if (editing) {
      record.markActivity();
      return;
    }
    if (isTyping(event.target) || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key.toLowerCase() === "e" && detail && !record.lockedByOther) {
      event.preventDefault();
      void startEditing();
    } else if ((event.key === "ArrowDown" || event.key === "ArrowUp") && code) {
      const index = siblings.indexOf(code);
      const next = siblings[index + (event.key === "ArrowDown" ? 1 : -1)];
      if (index >= 0 && next) {
        event.preventDefault();
        openDrawer(next);
      }
    }
  }

  // Atalhos do painel (Ctrl+S, E, ↑/↓) valem com o foco em qualquer lugar do painel, inclusive no cabeçalho.
  const keyRef = React.useRef<(event: KeyboardEvent) => void>(() => undefined);
  React.useEffect(() => {
    keyRef.current = onKeyDown;
  });
  React.useEffect(() => {
    const listener = (event: KeyboardEvent) => keyRef.current(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  const title = creating ? "Nova demanda" : detail ? `Demanda #${detail.code}` : "Demanda";
  const value = editing ? draft : saved;
  const patch = (next: Partial<DemandInput>) => {
    setDraft((current) => ({ ...current, ...next }));
    setError(null);
    record.markActivity();
  };

  return (
    <Drawer
      open
      onOpenChange={(open) => !open && discardOrClose()}
      title={title}
      onEscapeKeyDown={(event) => {
        event.preventDefault();
        discardOrClose();
      }}
      actions={
        detail === undefined ? null : editing ? (
          <>
            <Button variant="ghost" size="sm" onClick={discardOrClose}>
              {creating ? "Cancelar" : "Descartar"} <Kbd className="ml-1">Esc</Kbd>
            </Button>
            {blockedByConfirm && (
              <Button variant="outline" size="sm" onClick={() => void save(true)}>
                Forçar conclusão
              </Button>
            )}
            <SaveButton state={saveState} dirty={dirty} onSave={() => void save()} label={creating ? "Criar demanda" : undefined} />
          </>
        ) : detail ? (
          <Button variant="outline" size="sm" onClick={() => void startEditing()} disabled={record.lockedByOther} aria-keyshortcuts="E">
            <Pencil /> Editar <Kbd className="ml-1">E</Kbd>
          </Button>
        ) : null
      }
      banner={
        <>
          {record.lockedByOther && record.holder && (
            <div className="flex h-10 shrink-0 items-center gap-2 bg-accent-subdued px-5 text-[13px] text-ink-secondary">
              <Lock className="size-4 stroke-[1.75]" aria-hidden />
              <Avatar person={{ id: record.holder.userId, name: record.holder.name, image: null }} size={20} />
              <span>
                <strong className="font-medium text-ink">{record.holder.name}</strong> está editando
              </span>
              {isAdmin && (
                <Button variant="ghost" size="sm" className="ml-auto" onClick={() => void record.takeOver()}>
                  Assumir a edição
                </Button>
              )}
            </div>
          )}
          {(shownNotice || error) && (
            <p
              role={error ? "alert" : "status"}
              className={cn("shrink-0 px-5 pt-3 text-[13px]", error ? "text-coral" : shownNotice?.startsWith("Esc") ? "text-amber-fact" : "text-ink-secondary")}
            >
              {error ?? shownNotice}
            </p>
          )}
        </>
      }
    >
      <div className="flex min-h-full flex-col">
        {detail === undefined ? (
          <LoadingBody />
        ) : !creating && detail === null ? (
          <p className="p-5 text-sm text-ink-secondary">Demanda não encontrada.</p>
        ) : (
          <DemandBody
            detail={detail ?? null}
            value={value}
            editing={editing}
            options={options}
            patch={patch}
            viewers={viewers.filter((viewer) => viewer.userId !== me.id)}
            editingBy={record.lockedByOther ? (record.holder?.name ?? "Outra pessoa") : null}
          />
        )}
      </div>
    </Drawer>
  );
}

function FieldRow({ label, children, htmlFor }: { label: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div className="grid min-h-11 grid-cols-[140px_minmax(0,1fr)] items-center gap-3">
      {htmlFor ? (
        <label htmlFor={htmlFor} className="text-[13px] text-ink-secondary">
          {label}
        </label>
      ) : (
        <span className="text-[13px] text-ink-secondary">{label}</span>
      )}
      <div className="flex min-w-0 items-center gap-2 text-sm text-ink">{children}</div>
    </div>
  );
}

function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex h-8 items-center gap-2">
      <h3 className="text-xs font-semibold tracking-[0.04em] text-ink-muted uppercase">{children}</h3>
      {aside && <span className="ml-auto">{aside}</span>}
    </div>
  );
}

function DemandBody({
  detail,
  value,
  editing,
  options,
  patch,
  viewers,
  editingBy,
}: {
  detail: DemandDetail | null;
  value: DemandInput;
  editing: boolean;
  options: DemandFormOptions;
  patch: (next: Partial<DemandInput>) => void;
  viewers: { userId: string; name: string }[];
  editingBy: string | null;
}) {
  const me = useShellUser();
  const navigate = useTabs((state) => state.navigate);
  const [copied, setCopied] = React.useState(false);
  const mentions = React.useMemo(() => mentionOptions(options.people, options.clients), [options]);
  const client = options.clients.find((item) => item.id === value.clientId) ?? null;
  const platform = options.platforms.find((item) => item.id === value.platformId) ?? null;
  const assignees = options.people.filter((item) => value.assigneeIds.includes(item.id));
  const detailAssignee = (id: string) => detail?.assignees.find((item) => item.id === id);
  const doneCount = value.subtasks.filter((item) => item.done).length;
  const listItem = detail ? { ...detail, status: value.status, priority: value.priority, dueDate: value.dueDate, dueTime: value.dueTime } : null;

  return (
    <div className="flex flex-col gap-6 px-5 py-5">
      {/* Identificação e presença */}
      <div className="flex flex-col gap-3">
        {detail && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(`#${detail.code}`);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1200);
              }}
              aria-label={`Copiar código #${detail.code}`}
              className="inline-flex h-6 items-center gap-1.5 rounded px-1 -ml-1 font-mono text-[13px] text-ink-muted hover:text-ink-secondary"
            >
              #{detail.code}
              {copied ? <Check className="size-3.5 stroke-[1.75]" /> : <Copy className="size-3.5 stroke-[1.75]" />}
              {copied && <span className="font-sans text-xs text-ink-secondary">Copiado</span>}
            </button>
            {listItem && <StatusDot status={demandDot(listItem)} label={dotLabel(listItem)} />}
            {listItem && <StatusBadge status={demandDot(listItem)} label={DEMAND_STATUS_LABEL[listItem.status]} />}
            {viewers.length > 0 && (
              <span className="ml-auto flex items-center gap-2 text-xs text-ink-secondary">
                <AvatarStack people={viewers.map((viewer) => ({ id: viewer.userId, name: viewer.name, image: null }))} size={20} />
                vendo agora
              </span>
            )}
          </div>
        )}
        {editing ? (
          <Input
            aria-label="Título"
            value={value.title}
            maxLength={200}
            autoFocus={!detail}
            placeholder="Título da demanda"
            onChange={(event) => patch({ title: event.target.value })}
            className="h-10 text-base font-semibold"
          />
        ) : (
          <h2 className="text-lg font-semibold tracking-[-0.015em] text-ink">{value.title}</h2>
        )}
      </div>

      {/* Campos */}
      <div className="flex flex-col">
        <FieldRow label="Situação" htmlFor={editing ? "demanda-situacao" : undefined}>
          {editing ? (
            <Select id="demanda-situacao" value={value.status} onChange={(event) => patch({ status: event.target.value as DemandInput["status"] })}>
              {DEMAND_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {DEMAND_STATUS_LABEL[status]}
                </option>
              ))}
            </Select>
          ) : (
            DEMAND_STATUS_LABEL[value.status]
          )}
        </FieldRow>
        <FieldRow label="Prioridade" htmlFor={editing ? "demanda-prioridade" : undefined}>
          {editing ? (
            <Select id="demanda-prioridade" value={value.priority} onChange={(event) => patch({ priority: event.target.value as DemandInput["priority"] })}>
              {DEMAND_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {DEMAND_PRIORITY_LABEL[priority]}
                </option>
              ))}
            </Select>
          ) : (
            <PriorityMark priority={value.priority} withLabel />
          )}
        </FieldRow>
        <FieldRow label="Prazo" htmlFor={editing ? "demanda-prazo" : undefined}>
          {editing ? (
            <>
              <Input id="demanda-prazo" type="date" value={value.dueDate ?? ""} onChange={(event) => patch({ dueDate: event.target.value || null, dueTime: event.target.value ? value.dueTime : null })} className="w-40" />
              <Input
                aria-label="Hora do prazo (opcional)"
                type="time"
                value={value.dueTime ?? ""}
                disabled={!value.dueDate}
                onChange={(event) => patch({ dueTime: event.target.value || null })}
                className="w-28"
              />
            </>
          ) : (
            <DueText demand={value} className="text-sm" />
          )}
        </FieldRow>
        <FieldRow label="Cliente" htmlFor={editing ? "demanda-cliente" : undefined}>
          {editing ? (
            <Combobox
              id="demanda-cliente"
              value={value.clientId}
              onChange={(clientId) => patch({ clientId })}
              emptyLabel="Sem cliente"
              searchPlaceholder="Buscar cliente por nome ou código"
              options={options.clients.map((item) => ({
                value: item.id,
                label: item.name,
                hint: `#${item.code}`,
                icon: <EntityLogo name={item.name} logoUrl={item.logoUrl} size={16} />,
              }))}
            />
          ) : client ? (
            <button
              type="button"
              onClick={(event) => navigate("cliente", { codigo: client.code }, wantsNewTab(event))}
              className="flex min-w-0 items-center gap-2 rounded hover:underline"
            >
              <EntityLogo name={client.name} logoUrl={client.logoUrl} size={16} />
              <span className="truncate">{client.name}</span>
            </button>
          ) : (
            <span className="text-ink-muted">Sem cliente</span>
          )}
        </FieldRow>
        <FieldRow label="Plataforma" htmlFor={editing ? "demanda-plataforma" : undefined}>
          {editing ? (
            <Combobox
              id="demanda-plataforma"
              value={value.platformId}
              onChange={(platformId) => patch({ platformId })}
              emptyLabel="Sem plataforma"
              searchPlaceholder="Buscar plataforma"
              options={options.platforms.map((item) => ({
                value: item.id,
                label: item.name,
                icon: <EntityLogo name={item.name} logoUrl={item.logoUrl} size={16} />,
              }))}
            />
          ) : platform ? (
            <span className="flex items-center gap-2">
              <EntityLogo name={platform.name} logoUrl={platform.logoUrl} size={16} /> {platform.name}
            </span>
          ) : (
            <span className="text-ink-muted">Sem plataforma</span>
          )}
        </FieldRow>
        <FieldRow label="Atribuídos">
          {editing ? (
            <AssigneePicker people={options.people} value={value.assigneeIds} onChange={(assigneeIds) => patch({ assigneeIds })} />
          ) : assignees.length ? (
            <ul className="flex flex-col gap-1 py-2">
              {assignees.map((person) => {
                const info = detailAssignee(person.id);
                return (
                  <li key={person.id} className="flex items-center gap-2">
                    <Avatar person={person} size={20} />
                    <span>{person.name}</span>
                    <span className="text-xs text-ink-muted">{info?.seenAt ? `Visto às ${time(info.seenAt)}` : "Ainda não viu"}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <span className="text-ink-muted">Ninguém</span>
          )}
        </FieldRow>
      </div>

      {/* Descrição */}
      <section className="flex flex-col gap-2">
        <SectionTitle>Descrição</SectionTitle>
        {editing ? (
          <RichEditor
            value={value.description}
            onChange={(description) => patch({ description })}
            options={mentions}
            label="Descrição"
            placeholder="Detalhes, links e @menções"
            minHeight={120}
          />
        ) : value.description && !isEmptyDoc(value.description) ? (
          <RichText doc={value.description} />
        ) : (
          <p className="text-sm text-ink-muted">Sem descrição.</p>
        )}
      </section>

      <Subtasks value={value.subtasks} editing={editing} doneCount={doneCount} editingBy={editingBy} onChange={(subtasks) => patch({ subtasks })} />
      <Attachments value={value.attachments} editing={editing} onChange={(attachments) => patch({ attachments })} />

      {/* Aprovação coletiva */}
      <section className="flex flex-col gap-2">
        <SectionTitle>Aprovação</SectionTitle>
        {editing ? (
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={value.requireAllConfirm}
              onChange={(event) => patch({ requireAllConfirm: event.target.checked })}
              className="size-3.5 accent-[var(--text-primary)]"
            />
            Exigir confirmação de todos os atribuídos para concluir
          </label>
        ) : value.requireAllConfirm && detail ? (
          <CollectiveApproval detail={detail} meId={me.id} />
        ) : (
          <p className="text-sm text-ink-muted">Conclusão livre, sem confirmação de todos.</p>
        )}
      </section>

      {detail && <Timeline detail={detail} mentions={mentions} />}
    </div>
  );
}

function AssigneePicker({ people, value, onChange }: { people: DemandFormOptions["people"]; value: string[]; onChange: (value: string[]) => void }) {
  const chosen = people.filter((item) => value.includes(item.id));
  return (
    <Popover>
      <PopoverTrigger className="inline-flex min-h-9 w-full items-center gap-2 rounded-lg border border-line-medium bg-surface px-2.5 text-left text-sm text-ink hover:bg-surface-hover">
        <UsersRound className="size-4 shrink-0 stroke-[1.75] text-ink-muted" aria-hidden />
        <span className="truncate">{chosen.length ? chosen.map((item) => item.name).join(", ") : "Escolher pessoas"}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-72 w-72 overflow-y-auto p-1">
        <fieldset>
          <legend className="sr-only">Atribuídos</legend>
          {people.map((person) => (
            <label key={person.id} className="flex h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-sm text-ink hover:bg-surface-hover">
              <input
                type="checkbox"
                checked={value.includes(person.id)}
                onChange={(event) => onChange(event.target.checked ? [...value, person.id] : value.filter((id) => id !== person.id))}
                className="size-3.5 accent-[var(--text-primary)]"
              />
              <Avatar person={person} size={20} />
              {person.name}
            </label>
          ))}
        </fieldset>
      </PopoverContent>
    </Popover>
  );
}

function Subtasks({
  value,
  editing,
  doneCount,
  editingBy,
  onChange,
}: {
  value: DemandInput["subtasks"];
  editing: boolean;
  doneCount: number;
  /** Fora da edição: quem está editando (marcar fica bloqueado, D-106). */
  editingBy: string | null;
  onChange: (value: DemandInput["subtasks"]) => void;
}) {
  const [text, setText] = React.useState("");
  const [problem, setProblem] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<Record<string, boolean>>({});
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const progress = value.length ? doneCount / value.length : 0;
  if (!editing && value.length === 0) return null;

  const keyOf = (item: DemandInput["subtasks"][number]) => item.key ?? item.id ?? item.text;

  function add() {
    if (!text.trim()) return;
    onChange([...value, { key: `nova-${crypto.randomUUID()}`, text: text.trim(), done: false }]);
    setText("");
  }

  // Fora da edição, marcar grava na hora (D-106); o painel recarrega pelo tempo real.
  async function toggleNow(id: string, done: boolean) {
    setProblem(null);
    setPending((current) => ({ ...current, [id]: done }));
    const result = await toggleSubtask(id, done);
    if (!result.ok) setProblem(result.error);
    setPending((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function onDragEnd(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return;
    const from = value.findIndex((item) => keyOf(item) === event.active.id);
    const to = value.findIndex((item) => keyOf(item) === event.over!.id);
    if (from >= 0 && to >= 0) onChange(arrayMove(value, from, to));
  }

  return (
    <section className="flex flex-col gap-2">
      <SectionTitle aside={value.length > 0 && <span className="tabular text-xs text-ink-secondary">{doneCount} de {value.length}</span>}>Subtarefas</SectionTitle>
      {value.length > 0 && (
        <div className="h-0.5 overflow-hidden rounded-full bg-line-subtle" role="progressbar" aria-label="Progresso das subtarefas" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <motion.div className="h-full rounded-full bg-ink" initial={false} animate={{ width: `${progress * 100}%` }} transition={motionSprings.chartBarReveal} />
        </div>
      )}
      {editing ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={value.map(keyOf)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col">
              {value.map((item, index) => (
                <SortableSubtask
                  key={keyOf(item)}
                  id={keyOf(item)}
                  item={item}
                  onToggle={(done) => onChange(value.map((entry, position) => (position === index ? { ...entry, done } : entry)))}
                  onText={(next) => onChange(value.map((entry, position) => (position === index ? { ...entry, text: next } : entry)))}
                  onRemove={() => onChange(value.filter((_, position) => position !== index))}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <ul className="flex flex-col">
          {value.map((item) => {
            const done = item.id && item.id in pending ? pending[item.id] : item.done;
            return (
              <li key={keyOf(item)} className="flex min-h-9 items-center gap-2.5">
                <SubtaskCheck
                  checked={done}
                  disabled={!!editingBy || !item.id}
                  title={editingBy ? `${editingBy} está editando` : undefined}
                  label={item.text}
                  onChange={(next) => item.id && void toggleNow(item.id, next)}
                />
                <span className={cn("min-w-0 flex-1 text-sm transition-colors", done ? "text-ink-muted line-through" : "text-ink")}>{item.text}</span>
              </li>
            );
          })}
        </ul>
      )}
      {problem && (
        <p role="alert" className="text-[13px] text-coral">
          {problem}
        </p>
      )}
      {editing && (
        <div className="flex items-center gap-2">
          <Input
            aria-label="Nova subtarefa"
            placeholder="Nova subtarefa (Enter adiciona)"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                add();
              }
            }}
          />
          <Button variant="ghost" size="sm" onClick={add} disabled={!text.trim()}>
            <Plus /> Adicionar
          </Button>
        </div>
      )}
    </section>
  );
}

/** Subtarefa em edição: alça para arrastar (ou espaço + setas), check e texto editável na própria linha. */
function SortableSubtask({
  id,
  item,
  onToggle,
  onText,
  onRemove,
}: {
  id: string;
  item: DemandInput["subtasks"][number];
  onToggle: (done: boolean) => void;
  onText: (text: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("group flex min-h-10 items-center gap-1.5 rounded-md", isDragging ? "relative z-10 bg-surface-elevated" : "bg-transparent")}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`Mover subtarefa ${item.text}`}
        className="inline-flex size-6 shrink-0 cursor-grab items-center justify-center rounded text-ink-muted hover:text-ink active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4 stroke-[1.75]" />
      </button>
      <SubtaskCheck checked={item.done} label={item.text} onChange={onToggle} />
      <input
        aria-label={`Texto da subtarefa ${item.text}`}
        value={item.text}
        maxLength={300}
        onChange={(event) => onText(event.target.value)}
        className={cn(
          "ml-1 h-8 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 text-sm outline-none hover:border-line-subtle focus-visible:border-line-focus",
          item.done ? "text-ink-muted line-through" : "text-ink"
        )}
      />
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Remover subtarefa ${item.text}`}
        className="size-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        onClick={onRemove}
      >
        <Trash2 />
      </Button>
    </li>
  );
}

function Attachments({ value, editing, onChange }: { value: DemandInput["attachments"]; editing: boolean; onChange: (value: DemandInput["attachments"]) => void }) {
  const [url, setUrl] = React.useState("");
  const [name, setName] = React.useState("");
  const [problem, setProblem] = React.useState<string | null>(null);
  if (!editing && value.length === 0) return null;

  function add() {
    const link = url.trim();
    if (!link) return;
    try {
      const parsed = new URL(link);
      if (!parsed.protocol.startsWith("http")) throw new Error();
    } catch {
      setProblem("Cole um endereço válido (começando com http:// ou https://).");
      return;
    }
    const isDrive = /drive\.google\.com|docs\.google\.com/i.test(link);
    const defaultName = isDrive ? "Arquivo do Google Drive" : "Link anexado";
    onChange([...value, { url: link, name: name.trim() || defaultName, mimeType: isDrive ? "application/vnd.google-apps" : null }]);
    setUrl("");
    setName("");
    setProblem(null);
  }

  return (
    <section className="flex flex-col gap-2">
      <SectionTitle>Anexos</SectionTitle>
      <ul className="flex flex-col">
        {value.map((item, index) => {
          const isDrive = /drive\.google\.com|docs\.google\.com/i.test(item.url);
          return (
            <li key={item.id ?? `novo-${index}`} className="group flex h-9 items-center gap-2">
              {isDrive ? (
                <FolderOpen className="size-4 shrink-0 stroke-[1.75] text-ink-secondary" aria-hidden />
              ) : (
                <Link2 className="size-4 shrink-0 stroke-[1.75] text-ink-secondary" aria-hidden />
              )}
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-sm text-ink hover:underline">
                {item.name}
              </a>
              <ExternalLink className="size-3 shrink-0 text-ink-muted opacity-0 group-hover:opacity-100" aria-hidden />
              {editing && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remover anexo ${item.name}`}
                  className="size-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  onClick={() => onChange(value.filter((_, position) => position !== index))}
                >
                  <Trash2 />
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      {editing && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[1fr_160px_auto] gap-2">
            <Input aria-label="Link do anexo" placeholder="Colar link (Google Drive, Docs, etc.)" value={url} onChange={(event) => setUrl(event.target.value)} />
            <Input aria-label="Nome do anexo" placeholder="Nome (opcional)" value={name} onChange={(event) => setName(event.target.value)} />
            <Button variant="ghost" size="sm" onClick={add} disabled={!url.trim()}>
              <Link2 /> Anexar
            </Button>
          </div>
          {problem && <p className="text-[13px] text-coral">{problem}</p>}
        </div>
      )}
    </section>
  );
}

function CollectiveApproval({ detail, meId }: { detail: DemandDetail; meId: string }) {
  const [pending, setPending] = React.useState(false);
  const mine = detail.assignees.find((item) => item.id === meId);
  const done = detail.assignees.filter((item) => item.confirmedAt).length;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] text-ink-secondary">
        Concluir exige a confirmação de todos: {done} de {detail.assignees.length} confirmaram.
        {canConclude(detail) ? " Pode ser concluída." : ""}
      </p>
      <ul className="flex flex-col gap-1">
        {detail.assignees.map((item) => (
          <li key={item.id} className="flex h-7 items-center gap-2 text-sm">
            <Avatar person={item} size={20} />
            <span className="text-ink">{item.name}</span>
            <span className="text-xs text-ink-muted">{item.confirmedAt ? `Confirmou ${dateTime(item.confirmedAt)}` : "Aguardando"}</span>
          </li>
        ))}
      </ul>
      {mine && (
        <Button
          variant={mine.confirmedAt ? "ghost" : "outline"}
          size="sm"
          className="self-start"
          disabled={pending}
          onClick={() => {
            setPending(true);
            void confirmMyPart(detail.id, !mine.confirmedAt).finally(() => setPending(false));
          }}
        >
          {mine.confirmedAt ? "Desfazer minha confirmação" : (
            <>
              <Check /> Confirmar minha parte
            </>
          )}
        </Button>
      )}
    </div>
  );
}

function Timeline({ detail, mentions }: { detail: DemandDetail; mentions: ReturnType<typeof mentionOptions> }) {
  const [comment, setComment] = React.useState<unknown>(null);
  const [version, setVersion] = React.useState(0);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function send() {
    if (!comment || isEmptyDoc(comment) || sending) return;
    setSending(true);
    const result = await addComment(detail.id, comment).catch(() => ({ ok: false as const, error: "Não foi possível enviar o comentário. Tente de novo." }));
    setSending(false);
    if (!result.ok) return setError(result.error);
    setError(null);
    setComment(null);
    setVersion((current) => current + 1);
  }

  return (
    <section className="flex flex-col gap-3 border-t border-line-subtle pt-5">
      <SectionTitle>Linha do tempo</SectionTitle>
      <ol className="flex flex-col gap-3">
        {detail.events.map((event) =>
          event.kind === "comentario" ? (
            <li key={event.id} className="flex gap-2.5">
              <Avatar person={event.author} size={24} />
              <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-lg border border-line-subtle bg-canvas/40 px-3 py-2">
                <span className="text-xs text-ink-secondary">
                  <strong className="font-medium text-ink">{event.author.name}</strong> · {dateTime(event.createdAt)}
                </span>
                <RichText doc={event.body} />
              </div>
            </li>
          ) : (
            <li key={event.id} className="flex items-start gap-2.5 pl-1 text-[13px] text-ink-secondary">
              {event.kind === "criacao" ? (
                <Plus className="mt-0.5 size-3.5 shrink-0 stroke-[1.75]" aria-hidden />
              ) : (
                <Pencil className="mt-0.5 size-3.5 shrink-0 stroke-[1.75]" aria-hidden />
              )}
              <span>
                <strong className="font-medium text-ink">{event.author.name}</strong>{" "}
                {event.kind === "criacao" ? "criou a demanda" : (event.changes ?? []).map(changeSentence).join("; ")}
                {" · "}
                <span className="tabular">{dateTime(event.createdAt)}</span>
              </span>
            </li>
          )
        )}
      </ol>
      <div className="flex flex-col gap-2">
        <RichEditor
          key={version}
          value={null}
          onChange={setComment}
          options={mentions}
          label="Comentário"
          placeholder="Comentar… use @ para mencionar"
          onSubmit={() => void send()}
          minHeight={56}
        />
        {error && <p className="text-[13px] text-coral">{error}</p>}
        <Button size="sm" className="self-end" disabled={sending || !comment || isEmptyDoc(comment)} onClick={() => void send()}>
          Comentar <Kbd className="ml-1">Ctrl Enter</Kbd>
        </Button>
      </div>
    </section>
  );
}
