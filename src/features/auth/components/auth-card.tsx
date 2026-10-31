import type { InstanceIdentity } from "@/features/settings/instance";

// Cartão central de 380px sobre --bg-app, sem ilustrações (configuracoes-design-v2.md, seção 4).
export function AuthCard({
  instance,
  children,
}: {
  instance: InstanceIdentity;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-12">
      <div className="flex w-full max-w-[380px] flex-col items-center gap-6">
        <InstanceLogo instance={instance} />
        {children}
      </div>
    </main>
  );
}

function InstanceLogo({ instance }: { instance: InstanceIdentity }) {
  const { logoDarkUrl, logoLightUrl, name } = instance;
  if (!logoDarkUrl && !logoLightUrl) return null;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- logo enviado pelo administrador, tamanho livre */}
      <img src={logoDarkUrl ?? logoLightUrl ?? ""} alt={name} className="hidden h-10 w-auto dark:block" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoLightUrl ?? logoDarkUrl ?? ""} alt={name} className="h-10 w-auto dark:hidden" />
    </>
  );
}
