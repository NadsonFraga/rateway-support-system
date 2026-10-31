import { randomInt } from "node:crypto";
import { TEMP_PASSWORD_TTL_MS } from "./session-policy";

// Sem caracteres que se confundem ao ditar ou ler (0/O, 1/l/I).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

/** Senha temporária aleatória em 3 grupos de 4 (ex.: formato xxxx-xxxx-xxxx), fácil de repassar. */
export function generateTempPassword() {
  const group = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `${group()}-${group()}-${group()}`;
}

export function tempPasswordExpiry(now = new Date()) {
  return new Date(now.getTime() + TEMP_PASSWORD_TTL_MS);
}
