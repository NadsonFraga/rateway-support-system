import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Cofre de credenciais (seguranca-e-cofre.md, D-11): AES-256-GCM, IV aleatório de 12 bytes e
// versão da chave em cada registro. A chave mestra só existe no .env.local / ambiente do servidor.

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const KEY_BYTES = 32;

export type EncryptedSecret = {
  /** Texto cifrado em base64. */
  ciphertext: string;
  /** Vetor de inicialização (12 bytes) em base64, único por gravação. */
  iv: string;
  /** Etiqueta de autenticação do GCM em base64: detecta qualquer adulteração. */
  authTag: string;
  /** Versão da chave mestra usada (permite trocar a chave sem perder dados antigos). */
  keyVersion: number;
};

export type KeyRing = { activeVersion: number; keys: Map<number, Buffer> };

/** Lê as chaves VAULT_ENCRYPTION_KEY_V1, _V2… e a versão ativa do ambiente. */
export function loadKeyRing(env: Record<string, string | undefined> = process.env): KeyRing {
  const keys = new Map<number, Buffer>();
  for (const [name, value] of Object.entries(env)) {
    const match = name.match(/^VAULT_ENCRYPTION_KEY_V(\d+)$/);
    if (!match || !value) continue;
    const key = Buffer.from(value, "base64");
    if (key.length !== KEY_BYTES) {
      throw new Error(`${name} precisa ter 32 bytes em base64 (tem ${key.length}).`);
    }
    keys.set(Number(match[1]), key);
  }
  const activeVersion = Number(env.VAULT_ACTIVE_KEY_VERSION ?? "1");
  if (!keys.has(activeVersion)) {
    throw new Error(`Chave do Cofre da versão ${activeVersion} não encontrada no ambiente.`);
  }
  return { activeVersion, keys };
}

export function encryptSecret(plaintext: string, ring: KeyRing = loadKeyRing()): EncryptedSecret {
  const key = ring.keys.get(ring.activeVersion)!;
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    keyVersion: ring.activeVersion,
  };
}

export function decryptSecret(secret: EncryptedSecret, ring: KeyRing = loadKeyRing()): string {
  const key = ring.keys.get(secret.keyVersion);
  if (!key) throw new Error(`Chave do Cofre da versão ${secret.keyVersion} não está disponível.`);
  const iv = Buffer.from(secret.iv, "base64");
  if (iv.length !== IV_BYTES) throw new Error("IV inválido.");
  // Etiqueta sempre com 16 bytes: recusa etiquetas encurtadas, que enfraqueceriam a verificação.
  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: 16 });
  decipher.setAuthTag(Buffer.from(secret.authTag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(secret.ciphertext, "base64")), decipher.final()]).toString("utf8");
}
