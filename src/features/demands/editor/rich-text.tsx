"use client";

import * as React from "react";
import { useTabs, wantsNewTab } from "@/features/shell/tabs-store";

type Mark = { type: string; attrs?: Record<string, unknown> };
type Node = { type?: string; text?: string; marks?: Mark[]; attrs?: Record<string, unknown>; content?: Node[] };

function safeHref(value: unknown) {
  const href = String(value ?? "");
  return /^(https?:|mailto:)/i.test(href) ? href : null;
}

/** Mostra o documento salvo, montando os elementos um a um (nunca injeta HTML). */
export function RichText({ doc, className }: { doc: unknown; className?: string }) {
  const navigate = useTabs((state) => state.navigate);

  function renderMarks(text: React.ReactNode, marks: Mark[] = []): React.ReactNode {
    return marks.reduce<React.ReactNode>((child, mark) => {
      if (mark.type === "bold") return <strong>{child}</strong>;
      if (mark.type === "italic") return <em>{child}</em>;
      if (mark.type === "link") {
        const href = safeHref(mark.attrs?.href);
        return href ? (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {child}
          </a>
        ) : (
          child
        );
      }
      return child;
    }, text);
  }

  function render(node: Node, key: React.Key): React.ReactNode {
    const children = node.content?.map((child, index) => render(child, index));
    switch (node.type) {
      case "doc":
        return <React.Fragment key={key}>{children}</React.Fragment>;
      case "paragraph":
        return <p key={key}>{children?.length ? children : <br />}</p>;
      case "bulletList":
        return <ul key={key}>{children}</ul>;
      case "orderedList":
        return <ol key={key}>{children}</ol>;
      case "listItem":
        return <li key={key}>{children}</li>;
      case "hardBreak":
        return <br key={key} />;
      case "text":
        return <React.Fragment key={key}>{renderMarks(node.text ?? "", node.marks)}</React.Fragment>;
      case "mention": {
        const id = String(node.attrs?.id ?? "");
        const label = `@${String(node.attrs?.label ?? "")}`;
        if (id.startsWith("cliente:")) {
          const code = id.slice(8);
          return (
            <button
              key={key}
              type="button"
              onClick={(event) => navigate("cliente", { codigo: code }, wantsNewTab(event))}
              className="font-medium text-ink underline decoration-line-strong underline-offset-2 hover:decoration-ink"
            >
              {label}
            </button>
          );
        }
        return (
          <span key={key} className="font-medium text-ink">
            {label}
          </span>
        );
      }
      default:
        return children ? <React.Fragment key={key}>{children}</React.Fragment> : null;
    }
  }

  if (!doc) return null;
  return <div className={`rich-text text-sm text-ink ${className ?? ""}`}>{render(doc as Node, "raiz")}</div>;
}
