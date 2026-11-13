"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Plus, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motionSprings } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { DEFAULT_SHORTCUTS } from "./action-registry";
import { TAB_REGISTRY } from "./tab-registry";
import { HOME_TAB } from "./tabs-model";
import { useTabs } from "./tabs-store";

// Faixa de abas (sistema-de-abas.md 2): Início fixa, + encostado na última, × na ativa e no hover.
export function TabStrip() {
  const tabs = useTabs((state) => state.tabs);
  const labels = useTabs((state) => state.labels);
  const activeId = useTabs((state) => state.activeId);
  const dirty = useTabs((state) => state.dirty);
  const activate = useTabs((state) => state.activate);
  const requestClose = useTabs((state) => state.requestClose);
  const open = useTabs((state) => state.open);
  const refs = React.useRef<Record<string, HTMLDivElement | null>>({});

  React.useEffect(() => {
    refs.current[activeId]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeId]);

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const next = tabs[(index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
      activate(next.id);
      refs.current[next.id]?.focus();
    } else if (event.key === "Delete") {
      event.preventDefault();
      requestClose(tabs[index].id);
    }
  }

  return (
    <div className="flex min-w-0 flex-1 items-end gap-1 overflow-x-auto [scrollbar-width:none]">
      <div role="tablist" aria-label="Abas abertas" className="flex min-w-0 items-end gap-1">
        {tabs.map((tab, index) => {
          const definition = TAB_REGISTRY[tab.kind];
          const title = definition.title(tab, labels[tab.id]);
          const active = tab.id === activeId;
          const closable = tab.id !== HOME_TAB.id;
          return (
            <div
              key={tab.id}
              ref={(element) => {
                refs.current[tab.id] = element;
              }}
              role="tab"
              id={`aba-${tab.id}`}
              aria-selected={active}
              aria-controls={`painel-${tab.id}`}
              aria-keyshortcuts={closable ? "Delete Alt+W" : undefined}
              tabIndex={active ? 0 : -1}
              title={title}
              onClick={() => activate(tab.id)}
              onAuxClick={(event) => event.button === 1 && closable && requestClose(tab.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cn(
                "group relative flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-t-lg pr-1.5 pl-3 text-[13px] outline-offset-[-2px] select-none",
                active ? "text-ink" : "text-ink-secondary hover:bg-surface-hover hover:text-ink",
                !closable && "pr-3"
              )}
            >
              {active && (
                <motion.span
                  layoutId="aba-ativa"
                  transition={motionSprings.tabIndicator}
                  className="absolute inset-0 -bottom-px rounded-t-lg border-x border-t border-line-subtle bg-canvas"
                />
              )}
              <definition.icon className="relative size-4 shrink-0 stroke-[1.75]" aria-hidden />
              <span className="relative max-w-[20ch] truncate">{title}</span>
              {dirty[tab.id] && (
                <span
                  role="img"
                  aria-label="Alterações não salvas"
                  className="relative size-1.5 shrink-0 rounded-full bg-ink-secondary"
                />
              )}
              {closable && (
                // Só para o mouse: teclado e leitor de tela fecham com Delete ou Alt+W (anunciados na aba).
                <span
                  aria-hidden
                  title={`Fechar ${title}`}
                  data-fechar-aba
                  onClick={(event) => {
                    event.stopPropagation();
                    requestClose(tab.id);
                  }}
                  className={cn(
                    "relative inline-flex size-5 cursor-pointer items-center justify-center rounded-md text-ink-muted hover:bg-surface-active hover:text-ink",
                    active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}
                >
                  <X className="size-3.5 stroke-[1.75]" />
                </span>
              )}
            </div>
          );
        })}
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`Nova aba (${DEFAULT_SHORTCUTS["tabs.new"].label})`}
            onClick={() => open("nova")}
            className="mb-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-ink-secondary hover:bg-surface-hover hover:text-ink"
          >
            <Plus className="size-4 stroke-[1.75]" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Nova aba ({DEFAULT_SHORTCUTS["tabs.new"].label})</TooltipContent>
      </Tooltip>
    </div>
  );
}
