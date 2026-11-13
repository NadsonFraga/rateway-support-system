"use client";

import * as React from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Archive, ArchiveRestore, Ellipsis, GripVertical, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";
import { ImageUpload } from "@/features/assets/image-upload";
import { useRealtime } from "@/features/realtime/client";
import { listCatalog, reorderCatalog, saveCatalogEntry, setCatalogArchived } from "../actions/catalog";
import {
  CATALOG_CATEGORIES,
  CATALOG_CATEGORY_LABEL,
  CATALOG_CATEGORY_SINGULAR,
  moveItem,
  type CatalogCategory,
  type CatalogEntry,
} from "../catalog-types";
import { FormError, SectionHeader, SectionLoading } from "../settings-frame";
import { settingsTopic } from "../topics";

// Catálogo (configuracoes-design-v2.md §2.3, D-88): ordem arrastável define as colunas da Matriz e do Cofre.
export function CatalogSection() {
  const [items, setItems] = React.useState<CatalogEntry[] | null>(null);
  const [category, setCategory] = React.useState<CatalogCategory>("canal");
  const [showArchived, setShowArchived] = React.useState(false);
  const [editing, setEditing] = React.useState<CatalogEntry | "novo" | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    try {
      const list = await listCatalog();
      setItems(list ?? []);
    } catch {
      setItems([]);
    }
  }, []);
  React.useEffect(() => {
    let cancelled = false;
    void listCatalog()
      .then((list) => {
        if (!cancelled) setItems(list ?? []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useRealtime(settingsTopic("catalogo"), () => void reload());

  const inCategory = (items ?? [])
    .filter((item) => item.categories.includes(category))
    .sort((a, b) => (a.positions[category] ?? 0) - (b.positions[category] ?? 0));
  const active = inCategory.filter((item) => !item.archived);
  const archived = inCategory.filter((item) => item.archived);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function onDragEnd(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return;
    const from = active.findIndex((item) => item.id === event.active.id);
    const to = active.findIndex((item) => item.id === event.over!.id);
    const reordered = moveItem(active, from, to);
    setItems((current) => {
      if (!current) return current;
      const order = new Map(reordered.map((item, index) => [item.id, index + 1]));
      return current.map((item) =>
        order.has(item.id) ? { ...item, positions: { ...item.positions, [category]: order.get(item.id) } } : item
      );
    });
    const result = await reorderCatalog(category, reordered.map((item) => item.id));
    if (!result.ok) {
      setError(result.error);
      void reload();
    }
  }

  async function toggleArchived(item: CatalogEntry) {
    const result = await setCatalogArchived(item.id, !item.archived);
    if (!result.ok) setError(result.error);
    void reload();
  }

  return (
    <section aria-label="Catálogo">
      <SectionHeader
        title="Catálogo"
        description="Canais, Channel Managers, PMS e serviços internos. A ordem dos itens é a ordem das colunas no Cofre e na Matriz de Cadastros."
        actions={
          <Button size="md" onClick={() => setEditing("novo")}>
            <Plus /> Adicionar
          </Button>
        }
      />
      <FormError message={error} />
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <SegmentedControl<CatalogCategory>
          label="Categoria do catálogo"
          value={category}
          onChange={setCategory}
          options={CATALOG_CATEGORIES.map((value) => ({ value, label: CATALOG_CATEGORY_LABEL[value] }))}
        />
        <label className="ml-auto inline-flex cursor-pointer items-center gap-2 text-[13px] text-ink-secondary">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(event) => setShowArchived(event.target.checked)}
            className="size-3.5 accent-[var(--text-primary)]"
          />
          Mostrar arquivados
        </label>
      </div>

      {!items ? (
        <SectionLoading />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line-subtle bg-surface">
          {active.length === 0 && !showArchived && (
            <p className="px-4 py-6 text-center text-[13px] text-ink-muted">
              Nenhum item em {CATALOG_CATEGORY_LABEL[category]}. Use Adicionar para cadastrar o primeiro.
            </p>
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => void onDragEnd(event)}>
            <SortableContext items={active.map((item) => item.id)} strategy={verticalListSortingStrategy}>
              <ul aria-label={`${CATALOG_CATEGORY_LABEL[category]}, em ordem`}>
                {active.map((item) => (
                  <CatalogRow key={item.id} item={item} onEdit={() => setEditing(item)} onToggleArchived={() => void toggleArchived(item)} sortable />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          {showArchived &&
            archived.map((item) => (
              <CatalogRow key={item.id} item={item} onEdit={() => setEditing(item)} onToggleArchived={() => void toggleArchived(item)} />
            ))}
        </div>
      )}

      <CatalogDialog
        entry={editing}
        defaultCategory={category}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          void reload();
        }}
      />
    </section>
  );
}

function CatalogRow({
  item,
  onEdit,
  onToggleArchived,
  sortable = false,
}: {
  item: CatalogEntry;
  onEdit: () => void;
  onToggleArchived: () => void;
  sortable?: boolean;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !sortable,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group flex h-11 items-center gap-3 border-b border-line-subtle px-3 text-sm last:border-b-0",
        isDragging ? "relative z-10 bg-surface-elevated" : "bg-surface",
        item.archived && "text-ink-muted"
      )}
    >
      {sortable ? (
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label={`Mover ${item.name}`}
          className="inline-flex size-6 cursor-grab items-center justify-center rounded text-ink-muted opacity-0 group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4 stroke-[1.75]" />
        </button>
      ) : (
        <span className="size-6" />
      )}
      <Logo item={item} />
      <span className={cn("min-w-0 flex-1 truncate font-medium", item.archived ? "text-ink-muted" : "text-ink")}>
        {item.name}
        {item.archived && <span className="ml-2 text-xs font-normal">Arquivado</span>}
      </span>
      {item.categories.length > 1 && (
        <span className="hidden text-[13px] text-ink-muted lg:block">
          {item.categories.map((value) => CATALOG_CATEGORY_SINGULAR[value]).join(" e ")}
        </span>
      )}
      {item.companyAccount && <span className="hidden text-[13px] text-ink-muted lg:block">Conta da empresa</span>}
      {item.extranetUrl && <span className="hidden max-w-[260px] truncate text-[13px] text-ink-secondary md:block">{item.extranetUrl}</span>}
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Ações de ${item.name}`}
          className="inline-flex size-7 items-center justify-center rounded-md text-ink-muted hover:bg-surface-hover hover:text-ink aria-expanded:bg-surface-hover"
        >
          <Ellipsis className="size-4 stroke-[1.75]" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onToggleArchived}>
            {item.archived ? <ArchiveRestore /> : <Archive />} {item.archived ? "Reativar" : "Arquivar"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

function Logo({ item }: { item: Pick<CatalogEntry, "name" | "logoUrl"> }) {
  if (item.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- logo do catálogo enviado pelo administrador
    return <img src={item.logoUrl} alt="" className="size-5 shrink-0 rounded object-contain" />;
  }
  const initials = item.name.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 2).toUpperCase();
  return (
    <span aria-hidden className="inline-flex size-5 shrink-0 items-center justify-center rounded bg-surface-active text-[10px] font-semibold text-ink-secondary">
      {initials}
    </span>
  );
}

type Draft = { categories: CatalogCategory[]; companyAccount: boolean; name: string; logoUrl: string | null; extranetUrl: string };

type DialogProps = {
  entry: CatalogEntry | "novo" | null;
  defaultCategory: CatalogCategory;
  onClose: () => void;
  onSaved: () => void;
};

function CatalogDialog({ entry, ...props }: DialogProps) {
  return (
    <Dialog open={!!entry} onOpenChange={(open) => !open && props.onClose()}>
      <DialogContent>{entry && <CatalogForm entry={entry} {...props} />}</DialogContent>
    </Dialog>
  );
}

/** Conteúdo do modal: nasce de novo a cada abertura, já com os dados do item (ou vazio). */
function CatalogForm({ entry, defaultCategory, onSaved }: Omit<DialogProps, "entry"> & { entry: CatalogEntry | "novo" }) {
  const [draft, setDraft] = React.useState<Draft>(() =>
    entry === "novo"
      ? { categories: [defaultCategory], companyAccount: false, name: "", logoUrl: null, extranetUrl: "" }
      : {
          categories: entry.categories,
          companyAccount: entry.companyAccount,
          name: entry.name,
          logoUrl: entry.logoUrl,
          extranetUrl: entry.extranetUrl ?? "",
        }
  );
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function save() {
    setPending(true);
    const result = await saveCatalogEntry(entry === "novo" ? null : entry.id, draft);
    setPending(false);
    if (!result.ok) return setError(result.error);
    onSaved();
  }

  const title = entry === "novo" ? `Novo ${CATALOG_CATEGORY_SINGULAR[draft.categories[0] ?? defaultCategory]}` : `Editar ${entry.name}`;

  return (
    <>
      <DialogHeader
        title={title}
        actions={
          <Button size="sm" onClick={() => void save()} disabled={pending || !draft.name.trim() || draft.categories.length === 0}>
            Salvar
          </Button>
        }
      />
      <DialogBody
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
            event.preventDefault();
            void save();
          }
        }}
      >
        <FormError message={error} />
        <Field label="Nome" htmlFor="catalogo-nome">
          <Input id="catalogo-nome" value={draft.name} maxLength={60} autoFocus onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        </Field>
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1.5 text-[13px] font-medium text-ink">Categorias</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {CATALOG_CATEGORIES.map((value) => (
              <label key={value} className="inline-flex h-8 cursor-pointer items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={draft.categories.includes(value)}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      categories: event.target.checked
                        ? CATALOG_CATEGORIES.filter((item) => item === value || draft.categories.includes(item))
                        : draft.categories.filter((item) => item !== value),
                    })
                  }
                  className="size-3.5 accent-[var(--text-primary)]"
                />
                {CATALOG_CATEGORY_SINGULAR[value].replace(/^./, (letter) => letter.toUpperCase())}
              </label>
            ))}
          </div>
          <p className="text-xs text-ink-muted">Um mesmo item pode ter mais de uma categoria (ex.: Channel Manager e PMS).</p>
        </fieldset>
        <label className="inline-flex cursor-pointer items-start gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={draft.companyAccount}
            onChange={(event) => setDraft({ ...draft, companyAccount: event.target.checked })}
            className="mt-1 size-3.5 accent-[var(--text-primary)]"
          />
          <span className="flex flex-col gap-0.5">
            Acesso pela conta da empresa
            <span className="text-xs text-ink-muted">Sem usuário e senha. No Cofre, cada cliente guarda só o link da página da propriedade.</span>
          </span>
        </label>
        <Field
          label="Endereço da extranet"
          htmlFor="catalogo-url"
          help={draft.companyAccount ? "Página geral do canal, começando com https://" : "Endereço completo de login, começando com https://"}
        >
          <Input
            id="catalogo-url"
            type="url"
            inputMode="url"
            placeholder="https://"
            value={draft.extranetUrl}
            onChange={(event) => setDraft({ ...draft, extranetUrl: event.target.value })}
          />
        </Field>
        <ImageUpload label="Logo" value={draft.logoUrl} onChange={(logoUrl) => setDraft({ ...draft, logoUrl })} />
      </DialogBody>
    </>
  );
}
