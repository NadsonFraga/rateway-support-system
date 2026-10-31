// Máscaras de código legível (identificadores-e-formatos.md). Funções puras, sem banco.

export const CLIENT_CODE_MIN = 3;
export const CLIENT_CODE_MAX = 4;

export type MaskValues = { sigla?: string; prefixo?: string; seq: number };

/** Aplica uma máscara como {SIGLA}-{SEQ:3}, {PREFIXO}-{SEQ:4}, {SEQ} ou {SIGLA}{ALEATORIO:4}. */
export function applyMask(mask: string, values: MaskValues, random: () => number = Math.random) {
  return mask.replace(/\{(SIGLA|PREFIXO|SEQ|ALEATORIO)(?::(\d+))?\}/g, (_, token: string, size?: string) => {
    const width = size ? Number(size) : 0;
    switch (token) {
      case "SIGLA":
        return values.sigla ?? "";
      case "PREFIXO":
        return values.prefixo ?? "";
      case "SEQ":
        return String(values.seq).padStart(width, "0");
      default:
        return Array.from({ length: width || 4 }, () => Math.floor(random() * 10)).join("");
    }
  });
}

/** Tira acentos e deixa só letras maiúsculas. */
function onlyLetters(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z]/g, "")
    .toUpperCase();
}

/**
 * Sugere a sigla pelas iniciais do nome fantasia, ignorando palavras genéricas.
 * Pode vir com menos de 3 letras: nesse caso o analista completa antes de salvar (D-74).
 */
export function suggestClientCode(name: string, ignoredWords: string[]) {
  const ignored = new Set(ignoredWords.map((word) => word.toLowerCase()));
  const initials = name
    .split(/\s+/)
    .filter((word) => word && !ignored.has(word.toLowerCase()))
    .map((word) => onlyLetters(word)[0] ?? "")
    .join("");
  return initials.slice(0, CLIENT_CODE_MAX);
}

export type ClientCodeProblem = "tamanho" | "caracteres" | "prefixo-reservado";

/** Valida a sigla final: 3 a 4 letras maiúsculas sem acento e diferente do prefixo de demanda. */
export function validateClientCode(code: string, demandPrefix: string): ClientCodeProblem | null {
  if (!/^[A-Z]+$/.test(code)) return "caracteres";
  if (code.length < CLIENT_CODE_MIN || code.length > CLIENT_CODE_MAX) return "tamanho";
  if (code === demandPrefix.toUpperCase()) return "prefixo-reservado";
  return null;
}

/**
 * Normaliza a busca por código: aceita com ou sem "#" e sem zeros à esquerda ("hfi1" encontra "HFI-001").
 * Retorna sigla e número para comparar com o código salvo.
 */
export function parseCodeQuery(query: string) {
  const match = query.trim().replace(/^#/, "").toUpperCase().match(/^([A-Z]*)-?0*(\d+)$/);
  if (!match) return null;
  return { letters: match[1], number: Number(match[2]) };
}
