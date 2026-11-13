"use client";

import { Database, Hash, IdCard, LayoutList, ListChecks, MessageSquareText, Package, Users } from "lucide-react";
import { ComingSoon } from "@/components/ui/coming-soon";
import { useShellUser } from "@/features/shell/shell-user";
import { ROLES } from "@/features/auth/permissions";
import { SectionHeader, SettingsFrame } from "../settings-frame";
import { BackupSection } from "./backup-section";
import { CatalogSection } from "./catalog-section";
import { IdentifiersSection } from "./identifiers-section";
import { IdentitySection } from "./identity-section";
import { MembersSection } from "./members-section";
import { MessagesSection } from "./messages-section";
import { ServicesSection } from "./services-section";

// Configurações do Sistema (configuracoes-design-v2.md §2): só Administrador.
export function SystemSettingsTab() {
  const user = useShellUser();
  if (user.role !== ROLES.administrador) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-8">
        <ComingSoon title="Acesso restrito" description="Configurações do Sistema são só para Administradores." />
      </div>
    );
  }

  return (
    <SettingsFrame
      title="Configurações"
      sections={[
        { id: "identidade", label: "Identidade", icon: IdCard, content: <IdentitySection /> },
        { id: "identificadores", label: "Identificadores", icon: Hash, content: <IdentifiersSection /> },
        { id: "catalogo", label: "Catálogo", icon: LayoutList, content: <CatalogSection /> },
        { id: "servicos", label: "Serviços", icon: Package, content: <ServicesSection /> },
        { id: "mensagens", label: "Mensagens", icon: MessageSquareText, content: <MessagesSection /> },
        { id: "membros", label: "Membros", icon: Users, content: <MembersSection /> },
        { id: "backup", label: "Backup & Exportação", icon: Database, content: <BackupSection /> },
        {
          id: "etapas",
          label: "Etapas dos Cadastros",
          icon: ListChecks,
          soon: true,
          content: (
            <section aria-label="Etapas dos Cadastros">
              <SectionHeader title="Etapas dos Cadastros" />
              <ComingSoon
                title="Passo a passo por canal"
                description="Os modelos de etapas da esteira de cadastros chegam junto com a linha do tempo de implantação, na Fase 2."
              />
            </section>
          ),
        },
      ]}
    />
  );
}
