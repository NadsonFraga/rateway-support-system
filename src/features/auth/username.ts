// Formato do nome de usuário (D-85): minúsculas sem acento, números e ponto, de 3 a 30 caracteres.
// Ao entrar, maiúsculas e minúsculas não fazem diferença (o sistema converte para minúsculas).

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;
export const USERNAME_PATTERN = /^[a-z0-9.]+$/;

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export type UsernameProblem = "tamanho" | "caracteres" | "ponto";

export function validateUsername(value: string): UsernameProblem | null {
  if (value.length < USERNAME_MIN || value.length > USERNAME_MAX) return "tamanho";
  if (!USERNAME_PATTERN.test(value)) return "caracteres";
  // Ponto só entre letras ou números: evita ".ana", "ana." e "ana..lima".
  if (value.startsWith(".") || value.endsWith(".") || value.includes("..")) return "ponto";
  return null;
}

export const USERNAME_PROBLEM_MESSAGE: Record<UsernameProblem, string> = {
  tamanho: `O usuário precisa ter de ${USERNAME_MIN} a ${USERNAME_MAX} caracteres.`,
  caracteres: "Use só letras minúsculas sem acento, números e ponto.",
  ponto: "O ponto precisa ficar entre letras ou números.",
};
