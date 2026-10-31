// Modelo da mensagem de cobrança (D-38): variáveis {{nome}} trocadas pelos dados reais na hora de enviar.

export const MESSAGE_VARIABLES = [
  { key: "contato_financeiro.nome", label: "Contato financeiro" },
  { key: "cliente.nome", label: "Cliente" },
  { key: "instancia.nome", label: "Plataforma" },
  { key: "servico", label: "Serviço" },
  { key: "vencimento", label: "Vencimento" },
] as const;

export type MessageValues = Partial<Record<(typeof MESSAGE_VARIABLES)[number]["key"], string>>;

/** Troca cada {{variavel}} pelo valor; variável desconhecida ou sem valor fica visível entre colchetes. */
export function fillTemplate(template: string, values: MessageValues) {
  return template.replace(/\{\{\s*([a-z_.]+)\s*\}\}/g, (_, key: string) => {
    const value = values[key as keyof MessageValues];
    return value && value.trim() ? value : `[${key}]`;
  });
}

/** Variáveis usadas no texto que não existem na lista (provável erro de digitação). */
export function unknownVariables(template: string) {
  const known = new Set<string>(MESSAGE_VARIABLES.map((variable) => variable.key));
  return [...template.matchAll(/\{\{\s*([^}]+?)\s*\}\}/g)].map((match) => match[1]).filter((key) => !known.has(key));
}
