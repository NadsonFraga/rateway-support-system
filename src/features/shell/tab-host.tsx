"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { TAB_REGISTRY } from "./tab-registry";
import { CurrentTabProvider, useTabs } from "./tabs-store";

/**
 * Área de trabalho: todas as abas abertas ficam montadas (keep-alive). As inativas ficam
 * invisíveis e inertes, mas continuam vivas: o que foi digitado, a rolagem e o tempo real
 * se mantêm ao trocar de aba (sistema-de-abas.md 2.4).
 */
export function TabHost() {
  const tabs = useTabs((state) => state.tabs);
  const activeId = useTabs((state) => state.activeId);

  return (
    <div className="relative min-h-0 flex-1 bg-canvas">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        const Content = TAB_REGISTRY[tab.kind].content;
        return (
          <div
            key={tab.id}
            id={`painel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`aba-${tab.id}`}
            aria-hidden={!active}
            inert={!active}
            className={cn("absolute inset-0 overflow-y-auto", !active && "invisible")}
          >
            <CurrentTabProvider tab={tab} active={active}>
              <Content />
            </CurrentTabProvider>
          </div>
        );
      })}
      <CloseConfirmation />
    </div>
  );
}

/** Fechar uma aba com alterações não salvas pede confirmação no próprio sistema (sem diálogo do navegador). */
function CloseConfirmation() {
  const pendingClose = useTabs((state) => state.pendingClose);
  const tabs = useTabs((state) => state.tabs);
  const confirmClose = useTabs((state) => state.confirmClose);
  const cancelClose = useTabs((state) => state.cancelClose);
  const tab = tabs.find((item) => item.id === pendingClose);
  const title = tab ? TAB_REGISTRY[tab.kind].title(tab) : "";

  return (
    <Dialog open={!!tab} onOpenChange={(open) => !open && cancelClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader title="Descartar alterações?" description={`A aba "${title}" tem alterações que não foram salvas.`} />
        <DialogBody className="flex-row justify-end gap-2">
          <Button variant="outline" size="sm" onClick={cancelClose} autoFocus>
            Continuar editando
          </Button>
          <Button variant="danger" size="sm" onClick={confirmClose}>
            Descartar e fechar
          </Button>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
