import { Suspense } from "react";
import { AppShell, ShellSkeleton } from "@/features/shell/app-shell";
import { requireUser } from "@/features/auth/session";
import { getInstanceIdentity } from "@/features/settings/instance";

// Todas as telas do sistema moram dentro da casca (barra superior, sidebar, abas).
// A casca fica neste layout para nunca ser desmontada quando o endereço muda.
export default function SistemaLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Suspense fallback={<ShellSkeleton />}>
        <ShellLoader />
      </Suspense>
      {children}
    </>
  );
}

async function ShellLoader() {
  const [user, instance] = await Promise.all([requireUser(), getInstanceIdentity()]);
  return (
    <AppShell
      instanceName={instance.name}
      user={{ id: user.id, name: user.name, username: user.username, role: user.role }}
    />
  );
}
