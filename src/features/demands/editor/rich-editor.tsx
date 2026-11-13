"use client";

import * as React from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import type { SuggestionKeyDownProps, SuggestionProps } from "@tiptap/suggestion";
import { Bold, Building2, Italic, List, ListOrdered, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClientRef, PersonRef } from "../types";

export type MentionOption = { id: string; label: string; kind: "pessoa" | "cliente"; hint?: string };

/** Lista de @pessoa e @cliente (D-97). */
export function mentionOptions(people: PersonRef[], clients: ClientRef[]): MentionOption[] {
  return [
    ...people.map((item) => ({ id: `pessoa:${item.id}`, label: item.name, kind: "pessoa" as const })),
    ...clients.map((item) => ({ id: `cliente:${item.code}`, label: item.name, kind: "cliente" as const, hint: `#${item.code}` })),
  ];
}

type MenuState = { items: MentionOption[]; index: number; rect: DOMRect | null; command: (item: { id: string; label: string }) => void } | null;

function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Editor com formatação simples (D-96): negrito, itálico, listas e links (colar ou digitar um endereço).
 * O valor é o documento em JSON (nunca HTML). `@` abre a lista de pessoas e clientes (D-97).
 */
export function RichEditor({
  value,
  onChange,
  options,
  label,
  placeholder,
  editable = true,
  onSubmit,
  minHeight = 96,
  autoFocus = false,
}: {
  value: unknown;
  onChange: (doc: unknown) => void;
  options: MentionOption[];
  label: string;
  placeholder?: string;
  editable?: boolean;
  /** Ctrl+Enter (ex.: enviar comentário). */
  onSubmit?: () => void;
  minHeight?: number;
  autoFocus?: boolean;
}) {
  const [menu, setMenu] = React.useState<MenuState>(null);
  const menuRef = React.useRef<MenuState>(null);
  const optionsRef = React.useRef(options);
  const submitRef = React.useRef(onSubmit);
  const changeRef = React.useRef(onChange);
  React.useEffect(() => {
    optionsRef.current = options;
    submitRef.current = onSubmit;
    changeRef.current = onChange;
  });
  const updateMenu = (next: MenuState) => {
    menuRef.current = next;
    setMenu(next);
  };

  const editor = useEditor({
    immediatelyRender: false,
    editable,
    autofocus: autoFocus ? "end" : false,
    content: (value as object | null) ?? "",
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        link: { openOnClick: !editable, autolink: true, protocols: ["https", "http", "mailto"], HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } },
      }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
      // Os refs só são lidos dentro dos callbacks da sugestão (ao digitar), nunca durante a renderização.
      // eslint-disable-next-line react-hooks/refs
      Mention.configure({
        HTMLAttributes: { class: "font-medium text-ink" },
        renderText: ({ node }) => `@${node.attrs.label ?? ""}`,
        suggestion: {
          char: "@",
          items: ({ query }) => {
            const search = normalize(query);
            return optionsRef.current.filter((item) => normalize(item.label).includes(search)).slice(0, 8);
          },
          render: () => ({
            onStart: (props: SuggestionProps<MentionOption>) =>
              updateMenu({ items: props.items, index: 0, rect: props.clientRect?.() ?? null, command: props.command }),
            onUpdate: (props: SuggestionProps<MentionOption>) =>
              updateMenu({ items: props.items, index: 0, rect: props.clientRect?.() ?? null, command: props.command }),
            onKeyDown: ({ event }: SuggestionKeyDownProps) => {
              const current = menuRef.current;
              if (!current || current.items.length === 0) return false;
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                const step = event.key === "ArrowDown" ? 1 : -1;
                updateMenu({ ...current, index: (current.index + step + current.items.length) % current.items.length });
                return true;
              }
              if (event.key === "Enter" || event.key === "Tab") {
                const item = current.items[current.index];
                current.command({ id: item.id, label: item.label });
                return true;
              }
              if (event.key === "Escape") {
                updateMenu(null);
                return true;
              }
              return false;
            },
            onExit: () => updateMenu(null),
          }),
        },
      }),
    ],
    editorProps: {
      attributes: {
        "aria-label": label,
        "aria-multiline": "true",
        role: "textbox",
        class: "rich-text outline-none",
      },
    },
  });

  React.useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  // Cada mudança no texto volta para quem usa o editor (sempre com a função mais recente).
  React.useEffect(() => {
    if (!editor) return;
    // Cópia só com dados: os atributos internos do editor não podem ir para o servidor como estão.
    const handler = () => changeRef.current(JSON.parse(JSON.stringify(editor.getJSON())));
    editor.on("update", handler);
    return () => {
      editor.off("update", handler);
    };
  }, [editor]);

  return (
    <div
      // Ctrl+Enter envia (ex.: comentário). Na captura, antes da quebra de linha do editor.
      onKeyDownCapture={(event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && submitRef.current && !menuRef.current) {
          event.preventDefault();
          event.stopPropagation();
          submitRef.current();
        }
      }}
      className={cn(
        "relative rounded-lg border bg-surface text-sm text-ink",
        editable ? "border-line-medium focus-within:border-line-focus" : "border-transparent"
      )}
    >
      {editable && editor && <Toolbar editor={editor} />}
      <div className={cn(editable ? "px-3 py-2" : "")} style={editable ? { minHeight } : undefined}>
        <EditorContent editor={editor} />
      </div>
      {menu && menu.items.length > 0 && (
        <ul
          role="listbox"
          aria-label="Mencionar"
          className="fixed z-[60] w-64 rounded-lg border border-line-medium bg-surface-elevated p-1"
          style={{ top: (menu.rect?.bottom ?? 0) + 4, left: menu.rect?.left ?? 0 }}
        >
          {menu.items.map((item, index) => (
            <li
              key={item.id}
              role="option"
              aria-selected={index === menu.index}
              onMouseDown={(event) => {
                event.preventDefault();
                menu.command({ id: item.id, label: item.label });
              }}
              className={cn(
                "flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-sm",
                index === menu.index ? "bg-surface-hover text-ink" : "text-ink-secondary"
              )}
            >
              {item.kind === "pessoa" ? <UserRound className="size-4 stroke-[1.75]" aria-hidden /> : <Building2 className="size-4 stroke-[1.75]" aria-hidden />}
              <span className="truncate">{item.label}</span>
              {item.hint && <span className="ml-auto font-mono text-xs text-ink-muted">{item.hint}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const buttons = [
    { label: "Negrito (Ctrl+B)", icon: Bold, active: editor.isActive("bold"), run: () => editor.chain().focus().toggleBold().run() },
    { label: "Itálico (Ctrl+I)", icon: Italic, active: editor.isActive("italic"), run: () => editor.chain().focus().toggleItalic().run() },
    { label: "Lista", icon: List, active: editor.isActive("bulletList"), run: () => editor.chain().focus().toggleBulletList().run() },
    { label: "Lista numerada", icon: ListOrdered, active: editor.isActive("orderedList"), run: () => editor.chain().focus().toggleOrderedList().run() },
  ];
  return (
    <div role="toolbar" aria-label="Formatação" className="flex h-8 items-center gap-0.5 border-b border-line-subtle px-1.5">
      {buttons.map((button) => (
        <button
          key={button.label}
          type="button"
          aria-label={button.label}
          aria-pressed={button.active}
          onMouseDown={(event) => event.preventDefault()}
          onClick={button.run}
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-md hover:bg-surface-hover",
            button.active ? "bg-surface-active text-ink" : "text-ink-secondary"
          )}
        >
          <button.icon className="size-4 stroke-[1.75]" />
        </button>
      ))}
    </div>
  );
}
