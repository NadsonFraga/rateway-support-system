"use client";

import * as React from "react";
import { Inbox } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTabs } from "@/features/shell/tabs-store";
import { useInbox } from "./use-inbox";
import type { InboxItem } from "./types";

function relativeTime(iso: string) {
  const date = new Date(iso);
  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return time;
  const yesterday = new Date(today.getTime() - 86_400_000);
  if (date.toDateString() === yesterday.toDateString()) return `ontem, ${time}`;
  return `${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}, ${time}`;
}

// Caixa de entrada (D-83): painel preso ao ícone, nunca toast. Ponto de não lida monocromático.
export function InboxButton({ userId }: { userId: string }) {
  const { items, unread, loaded, read, readAll } = useInbox(userId);
  const openTab = useTabs((state) => state.open);
  const [open, setOpen] = React.useState(false);

  function select(item: InboxItem) {
    if (!item.readAt) read(item.id);
    if (item.target) openTab(item.target.kind, item.target.params);
    setOpen(false);
  }

  const label = unread > 0 ? `Caixa de entrada, ${unread} não ${unread === 1 ? "lida" : "lidas"}` : "Caixa de entrada";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={label}
        data-testid="caixa-de-entrada"
        data-nao-lidas={unread}
        className="relative inline-flex size-8 items-center justify-center rounded-lg text-ink-secondary hover:bg-surface-hover hover:text-ink aria-expanded:bg-surface-hover aria-expanded:text-ink"
      >
        <Inbox className="size-[18px] stroke-[1.75]" aria-hidden />
        {unread > 0 && <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-ink" aria-hidden />}
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={6} className="w-[380px] gap-0 p-0">
        <div className="flex h-11 items-center justify-between border-b border-line-subtle pr-2 pl-4">
          <h2 className="text-sm font-semibold text-ink">Caixa de entrada</h2>
          <Button variant="ghost" size="sm" onClick={readAll} disabled={unread === 0}>
            Marcar todas como lidas
          </Button>
        </div>
        <div className="max-h-[420px] overflow-y-auto" role="list" aria-label="Notificações">
          {loaded && items.length === 0 && (
            <p className="px-4 py-8 text-center text-[13px] text-ink-muted">Nada novo por aqui.</p>
          )}
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="listitem"
              onClick={() => select(item)}
              className="flex min-h-11 w-full items-start gap-3 border-b border-line-subtle px-4 py-3 text-left last:border-b-0 hover:bg-surface-hover focus-visible:bg-surface-hover"
            >
              <span
                className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", item.readAt ? "bg-transparent" : "bg-ink")}
                role={item.readAt ? undefined : "img"}
                aria-label={item.readAt ? undefined : "Não lida"}
              />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className={cn("truncate text-sm", item.readAt ? "text-ink-secondary" : "font-medium text-ink")}>
                  {item.title}
                </span>
                {item.body && <span className="line-clamp-2 text-[13px] text-ink-secondary">{item.body}</span>}
              </span>
              <span className="tabular shrink-0 pt-0.5 text-xs text-ink-muted">{relativeTime(item.createdAt)}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
