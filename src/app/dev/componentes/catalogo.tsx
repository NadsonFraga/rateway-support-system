"use client";

import * as React from "react";
import {
  ChevronsUp,
  Copy,
  Ellipsis,
  FileText,
  Monitor,
  Moon,
  Pencil,
  Plus,
  Sun,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SaveButton, type SaveState } from "@/components/ui/save-button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { StatusBadge, StatusDot, type Status } from "@/components/ui/status";
import { ListRow } from "@/components/ui/list-row";
import { StaggerList } from "@/components/ui/stagger-list";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton, SkeletonRow } from "@/components/ui/skeleton";
import { ComingSoon } from "@/components/ui/coming-soon";
import { CodeInput } from "@/components/ui/input-otp";
import { Kbd } from "@/components/ui/kbd";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { useTheme } from "@/features/settings/use-theme";
import type { ThemePreference } from "@/features/settings/theme";

const STATUSES: Status[] = ["em-andamento", "aguardando-retorno", "atencao-prazo", "atrasada", "concluida"];

const SAMPLE_ROWS: { title: string; status: Status; due: string }[] = [
  { title: "Revisar fotos do quarto duplo", status: "atrasada", due: "Ontem" },
  { title: "Atualizar política de cancelamento", status: "atencao-prazo", due: "Hoje, 18:00" },
  { title: "Confirmar tarifa de alta temporada", status: "aguardando-retorno", due: "12/11" },
  { title: "Conferir categorias no canal", status: "em-andamento", due: "14/11" },
  { title: "Ajustar restrição de estadia mínima", status: "em-andamento", due: "18/11" },
];

export function Catalogo() {
  const { preference, setPreference } = useTheme();

  return (
    <div className="min-h-screen bg-canvas">
      <header className="flex h-14 items-center gap-4 border-b border-line-subtle px-6">
        <h1 className="text-[15px] font-semibold text-ink">Catálogo de componentes</h1>
        <p className="text-[13px] text-ink-muted">Os dois temas lado a lado. Menus e janelas seguem o tema da página.</p>
        <div className="ml-auto">
          <SegmentedControl<ThemePreference>
            label="Tema da página"
            value={preference}
            onChange={setPreference}
            options={[
              { value: "escuro", label: "Escuro", icon: <Moon /> },
              { value: "claro", label: "Claro", icon: <Sun /> },
              { value: "sistema", label: "Sistema", icon: <Monitor /> },
            ]}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2">
        <ThemePanel theme="dark" title="Tema escuro" />
        <ThemePanel theme="light" title="Tema claro" />
      </div>
    </div>
  );
}

function ThemePanel({ theme, title }: { theme: "dark" | "light"; title: string }) {
  return (
    <section data-theme={theme} className="flex flex-col gap-10 bg-canvas px-8 py-8 text-ink xl:border-r xl:border-line-subtle">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Buttons />
      <Fields />
      <Statuses />
      <Rows scope={`catalogo-${theme}`} />
      <Menus />
      <Segmented />
      <Loading />
      <Code />
      <Overlays />
      <ComingSoon
        title="Checklist de onboarding"
        description="O checklist de onboarding chega em uma próxima fase."
      />
    </section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold tracking-[0.04em] text-ink-muted uppercase">{title}</h3>
      {children}
    </div>
  );
}

function Buttons() {
  const [state, setState] = React.useState<SaveState>("idle");
  const [dirty, setDirty] = React.useState(true);

  function save() {
    setState("saving");
    window.setTimeout(() => {
      setState("saved");
      setDirty(false);
      window.setTimeout(() => setState("idle"), 1200);
    }, 700);
  }

  return (
    <Section title="Botões">
      <div className="flex flex-wrap items-center gap-3">
        <Button>
          <Plus /> Nova demanda
        </Button>
        <Button variant="outline">Cancelar</Button>
        <Button variant="ghost" size="sm">
          <Pencil /> Editar
        </Button>
        <Button variant="danger" size="sm">
          <Trash2 /> Remover
        </Button>
        <Button variant="ghost" size="icon" aria-label="Copiar código">
          <Copy />
        </Button>
        <Button disabled>Desabilitado</Button>
      </div>
      <div className="flex items-center gap-3">
        <SaveButton state={state} dirty={dirty} onSave={save} />
        <Button variant="ghost" size="sm" onClick={() => setDirty(true)}>
          Simular alteração
        </Button>
      </div>
    </Section>
  );
}

function Fields() {
  return (
    <Section title="Campos">
      <div className="grid max-w-lg gap-4">
        <Field label="Nome do estabelecimento" htmlFor="campo-nome" help="Como aparece na listagem de clientes.">
          <Input id="campo-nome" placeholder="Digite o nome" />
        </Field>
        <Field label="E-mail" htmlFor="campo-email" error="Informe um e-mail válido, como nome@empresa.com.">
          <Input id="campo-email" type="email" defaultValue="nome@" />
        </Field>
      </div>
    </Section>
  );
}

function Statuses() {
  return (
    <Section title="Micro-dots e status">
      <div className="flex flex-wrap items-center gap-4">
        {STATUSES.map((status) => (
          <div key={status} className="flex items-center gap-2">
            <StatusDot status={status} />
            <StatusBadge status={status} />
          </div>
        ))}
      </div>
    </Section>
  );
}

function Rows({ scope }: { scope: string }) {
  const [selected, setSelected] = React.useState(1);
  return (
    <Section title="Linhas de 44px">
      <div className="overflow-hidden rounded-xl border border-line-subtle bg-surface">
        <StaggerList scope={scope}>
          {SAMPLE_ROWS.map((row, index) => (
            <ListRow
              key={row.title}
              selected={selected === index}
              onClick={() => setSelected(index)}
              tabIndex={0}
              onKeyDown={(event) => event.key === "Enter" && setSelected(index)}
              className="last:border-b-0"
            >
              <StatusDot status={row.status} />
              <FileText className="text-ink-muted" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{row.title}</span>
              {row.status === "atrasada" && <ChevronsUp className="text-ink-secondary" aria-label="Prioridade alta" />}
              <span className="tabular text-[13px] text-ink-secondary">{row.due}</span>
            </ListRow>
          ))}
        </StaggerList>
      </div>
    </Section>
  );
}

function Menus() {
  return (
    <Section title="Menu ancorado e tooltip">
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Ellipsis /> Ações
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Demanda</DropdownMenuLabel>
            <DropdownMenuItem>
              <Pencil /> Editar <DropdownMenuShortcut>E</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy /> Copiar código
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="danger">
              <Trash2 /> Remover
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm">
              Passe o mouse
            </Button>
          </TooltipTrigger>
          <TooltipContent>Tooltip ancorado ao elemento</TooltipContent>
        </Tooltip>
      </div>
    </Section>
  );
}

function Segmented() {
  const [view, setView] = React.useState<"lista" | "quadro">("lista");
  return (
    <Section title="Controle segmentado">
      <SegmentedControl
        label="Modo de exibição"
        value={view}
        onChange={setView}
        options={[
          { value: "lista", label: "Lista" },
          { value: "quadro", label: "Quadro" },
        ]}
      />
    </Section>
  );
}

function Loading() {
  return (
    <Section title="Esqueleto de carregamento">
      <div className="overflow-hidden rounded-xl border border-line-subtle bg-surface">
        <SkeletonRow />
        <SkeletonRow />
        <div className="flex h-11 items-center px-4">
          <Skeleton className="h-3.5 w-40" />
        </div>
      </div>
    </Section>
  );
}

function Code() {
  const [code, setCode] = React.useState("");
  return (
    <Section title="Código do autenticador e teclas">
      <CodeInput value={code} onChange={setCode} label="Código do autenticador" />
      <p className="flex items-center gap-2 text-[13px] text-ink-secondary">
        Nova demanda <Kbd>C</Kbd> · Salvar <Kbd>Ctrl</Kbd>
        <Kbd>S</Kbd> · Código <span className="font-mono text-ink">#DEM-0042</span>
      </p>
    </Section>
  );
}

function Overlays() {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  return (
    <Section title="Modal e drawer">
      <div className="flex items-center gap-3">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Abrir modal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader
              title="Novo membro"
              description="A senha temporária aparece depois de criar."
              actions={<Button size="sm">Criar membro</Button>}
            />
            <DialogBody>
              <Field label="Nome" htmlFor="modal-nome">
                <Input id="modal-nome" />
              </Field>
            </DialogBody>
          </DialogContent>
        </Dialog>
        <Button variant="outline" size="sm" onClick={() => setDrawerOpen(true)}>
          Abrir drawer
        </Button>
        <Drawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          title="Revisar fotos do quarto duplo"
          actions={
            <Button variant="ghost" size="sm">
              <Pencil /> Editar
            </Button>
          }
          banner={
            <div className="flex h-10 items-center gap-2 bg-accent-subdued px-5 text-[13px] text-ink-secondary">
              Modo leitura
            </div>
          }
        >
          <div className="flex flex-col gap-4 p-5 text-sm text-ink-secondary">
            Conteúdo do drawer. Esc fecha.
          </div>
        </Drawer>
      </div>
    </Section>
  );
}
