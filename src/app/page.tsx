import { Suspense } from "react";
import Link from "next/link";
import { Activity, LayoutGrid } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { UserMenu } from "@/features/auth/components/user-menu";
import { requireUser } from "@/features/auth/session";
import { getInstanceIdentity } from "@/features/settings/instance";

// Tela vazia pós-login da Etapa 1.0. A casca completa (abas, sidebar, busca) chega na Etapa 1.1.
export default async function Page() {
  const instance = await getInstanceIdentity();
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line-subtle bg-sidebar px-4">
        <span className="text-sm font-semibold text-ink">{instance.name}</span>
        <div className="ml-auto">
          <Suspense fallback={<Skeleton className="size-8 rounded-full" />}>
            <CurrentUserMenu />
          </Suspense>
        </div>
      </header>
      <Suspense fallback={<main className="flex-1" />}>
        <Home />
      </Suspense>
    </div>
  );
}

// O conteúdo só aparece depois de confirmar a sessão no servidor.
async function Home() {
  await requireUser();
  return (
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <h1 className="text-lg font-semibold text-ink">Fundação pronta</h1>
          <p className="text-sm text-ink-secondary">
            O login, os temas e o tempo real já funcionam. Demandas, Clientes, Cadastros e o Início chegam nas
            próximas etapas.
          </p>
          {process.env.NODE_ENV !== "production" && (
            <nav className="flex gap-2" aria-label="Telas de teste">
              <Link
                href="/dev/tempo-real"
                className="inline-flex h-8 items-center gap-2 rounded-lg border border-line-medium bg-surface px-3 text-[13px] font-medium text-ink hover:bg-surface-hover"
              >
                <Activity className="size-4 stroke-[1.75]" /> Teste de tempo real
              </Link>
              <Link
                href="/dev/componentes"
                className="inline-flex h-8 items-center gap-2 rounded-lg border border-line-medium bg-surface px-3 text-[13px] font-medium text-ink hover:bg-surface-hover"
              >
                <LayoutGrid className="size-4 stroke-[1.75]" /> Catálogo de componentes
              </Link>
            </nav>
          )}
        </div>
      </main>
  );
}

async function CurrentUserMenu() {
  const user = await requireUser();
  return <UserMenu name={user.name} email={user.email} role={user.role} />;
}
