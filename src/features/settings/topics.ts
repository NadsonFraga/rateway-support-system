// Tópicos de tempo real das Configurações: cada seção avisa quando alguém salva (D-87).

export type SettingsSection = "identidade" | "identificadores" | "catalogo" | "servicos" | "mensagens" | "membros";

export const settingsTopic = (section: SettingsSection) => `config:${section}`;

/** Tópico geral da instância: nome e logos mudaram (barra superior, login, aba do navegador). */
export const INSTANCE_TOPIC = "instancia";

export type SectionSaved = { byId: string; byName: string };

export type SaveResult<T> = { ok: true; value: T } | { ok: false; error: string };
