"use client";

import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SaveButton } from "@/components/ui/save-button";
import { ImageUpload } from "@/features/assets/image-upload";
import { useShellUser } from "@/features/shell/shell-user";
import { loadIdentity, saveIdentity, type IdentityValues } from "../actions/system";
import { ConflictNotice, FormError, SectionHeader, SectionLoading } from "../settings-frame";
import { settingsTopic } from "../topics";
import { useSectionForm } from "../use-section-form";

// Identidade (configuracoes-design-v2.md §2.1): nome, logos e favicon, com prévia ao vivo nos dois temas.
export function IdentitySection() {
  const user = useShellUser();
  const form = useSectionForm<IdentityValues>({
    section: "identidade",
    topic: settingsTopic("identidade"),
    userId: user.id,
    load: loadIdentity,
    save: saveIdentity,
  });
  const { draft } = form;

  return (
    <section aria-label="Identidade" onKeyDown={form.onKeyDown}>
      <SectionHeader
        title="Identidade"
        description="Nome e logos da plataforma. Aparecem na barra superior, na tela de login e na aba do navegador."
        escArmed={form.escArmed}
        actions={<SaveButton state={form.saveState} dirty={form.dirty} onSave={() => void form.submit()} />}
      />
      <ConflictNotice by={form.conflictBy} onDiscard={form.discard} />
      <FormError message={form.error} />
      {!draft ? (
        <SectionLoading />
      ) : (
        <div className="flex flex-col gap-6">
          <Field label="Nome da plataforma" htmlFor="identidade-nome">
            <Input id="identidade-nome" value={draft.name} maxLength={60} onChange={(event) => form.update({ name: event.target.value })} />
          </Field>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <ImageUpload
              label="Logo para tema escuro"
              value={draft.logoDarkUrl}
              onChange={(logoDarkUrl) => form.update({ logoDarkUrl })}
              previewTheme="dark"
            />
            <ImageUpload
              label="Logo para tema claro"
              value={draft.logoLightUrl}
              onChange={(logoLightUrl) => form.update({ logoLightUrl })}
              previewTheme="light"
            />
            <ImageUpload label="Favicon" value={draft.faviconUrl} onChange={(faviconUrl) => form.update({ faviconUrl })} />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[13px] text-ink-secondary">Prévia da barra superior</span>
            {(["dark", "light"] as const).map((theme) => {
              const logo = theme === "dark" ? (draft.logoDarkUrl ?? draft.logoLightUrl) : (draft.logoLightUrl ?? draft.logoDarkUrl);
              return (
                <div
                  key={theme}
                  data-theme={theme}
                  aria-label={`Prévia no tema ${theme === "dark" ? "escuro" : "claro"}`}
                  className="flex h-12 items-center gap-3 rounded-lg border border-line-subtle bg-sidebar px-3"
                >
                  <span className="inline-flex h-7 max-w-[260px] items-center gap-2 truncate rounded-md bg-surface-hover px-2.5 text-[13px] font-semibold text-ink">
                    {logo && (
                      // eslint-disable-next-line @next/next/no-img-element -- prévia de imagem enviada
                      <img src={logo} alt="" className="h-4 w-auto" />
                    )}
                    {draft.name || "Nome da plataforma"}
                  </span>
                  <span className="text-[13px] text-ink-secondary">Início</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
