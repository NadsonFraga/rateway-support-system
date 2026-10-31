import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, loadKeyRing } from "@/features/vault/crypto";

// Chaves geradas só para o teste (nunca as do .env.local).
const key1 = randomBytes(32).toString("base64");
const key2 = randomBytes(32).toString("base64");

describe("criptografia do Cofre (AES-256-GCM)", () => {
  const ring = loadKeyRing({ VAULT_ENCRYPTION_KEY_V1: key1, VAULT_ACTIVE_KEY_VERSION: "1" });

  it("cifra e decifra de volta o mesmo valor", () => {
    const secret = encryptSecret("senha-da-extranet-çãé", ring);
    expect(secret.keyVersion).toBe(1);
    expect(Buffer.from(secret.iv, "base64")).toHaveLength(12);
    expect(secret.ciphertext).not.toContain("senha");
    expect(decryptSecret(secret, ring)).toBe("senha-da-extranet-çãé");
  });

  it("usa um IV diferente a cada gravação", () => {
    const a = encryptSecret("mesmo valor", ring);
    const b = encryptSecret("mesmo valor", ring);
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it("recusa dado adulterado", () => {
    const secret = encryptSecret("valor original", ring);
    const bytes = Buffer.from(secret.ciphertext, "base64");
    bytes[0] ^= 0xff;
    expect(() => decryptSecret({ ...secret, ciphertext: bytes.toString("base64") }, ring)).toThrow();
    const tag = Buffer.from(secret.authTag, "base64");
    tag[0] ^= 0xff;
    expect(() => decryptSecret({ ...secret, authTag: tag.toString("base64") }, ring)).toThrow();
  });

  it("recusa etiqueta de autenticação encurtada", () => {
    const secret = encryptSecret("valor", ring);
    const shortTag = Buffer.from(secret.authTag, "base64").subarray(0, 8).toString("base64");
    expect(() => decryptSecret({ ...secret, authTag: shortTag }, ring)).toThrow();
  });

  it("troca de chave: dados antigos continuam legíveis, novos usam a versão nova", () => {
    const old = encryptSecret("cifrado com a v1", ring);
    const rotated = loadKeyRing({
      VAULT_ENCRYPTION_KEY_V1: key1,
      VAULT_ENCRYPTION_KEY_V2: key2,
      VAULT_ACTIVE_KEY_VERSION: "2",
    });
    expect(decryptSecret(old, rotated)).toBe("cifrado com a v1");
    const fresh = encryptSecret("cifrado com a v2", rotated);
    expect(fresh.keyVersion).toBe(2);
    expect(decryptSecret(fresh, rotated)).toBe("cifrado com a v2");
  });

  it("recusa chave com tamanho errado e versão ativa ausente", () => {
    expect(() => loadKeyRing({ VAULT_ENCRYPTION_KEY_V1: "curta", VAULT_ACTIVE_KEY_VERSION: "1" })).toThrow();
    expect(() => loadKeyRing({ VAULT_ENCRYPTION_KEY_V1: key1, VAULT_ACTIVE_KEY_VERSION: "3" })).toThrow();
  });
});
