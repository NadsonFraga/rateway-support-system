"use client";

import { ComingSoon } from "@/components/ui/coming-soon";
import { EntityLogo } from "../components/bits";
import type { ClientDetail } from "../types";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-semibold tracking-[0.04em] text-ink-muted uppercase">{children}</h2>;
}

// Visão Geral (04.2). Nesta etapa: bloco Sistemas; Demandas e Implantação como "Em breve" (D-92).
export function OverviewPanel({ client }: { client: ClientDetail }) {
  return (
    <div className="grid min-h-full grid-cols-[minmax(0,1fr)_340px]">
      <section aria-labelledby="demandas-cliente" className="flex flex-col gap-4 px-6 py-6">
        <h2 id="demandas-cliente" className="text-base font-semibold text-ink">
          Demandas ativas
        </h2>
        <ComingSoon title="Demandas do cliente" description="As demandas deste cliente aparecem aqui a partir das Etapas 1.4 e 1.5." />
      </section>
      <aside className="flex flex-col gap-6 border-l border-line-subtle px-6 py-6">
        <section className="flex flex-col gap-1">
          <SectionTitle>Sistemas</SectionTitle>
          {(
            [
              ["Channel Manager", client.channelManager],
              ["PMS", client.pms],
            ] as const
          ).map(([label, item]) => (
            <div key={label} className="flex h-9 items-center justify-between gap-3">
              <span className="text-[13px] text-ink-secondary">{label}</span>
              {item ? (
                <span className="flex min-w-0 items-center gap-2 text-sm text-ink">
                  <EntityLogo name={item.name} logoUrl={item.logoUrl} />
                  <span className="truncate">{item.name}</span>
                </span>
              ) : (
                <span className="text-sm text-ink-muted">Não informado</span>
              )}
            </div>
          ))}
        </section>
        <section className="flex flex-col gap-3">
          <SectionTitle>Implantação</SectionTitle>
          <ComingSoon title="Progresso da implantação" description="Situação de cada canal chega na Etapa 1.6, com o módulo Cadastros." />
        </section>
      </aside>
    </div>
  );
}
