import { describe, expect, it } from "vitest";
import { normalizeUsername, validateUsername } from "@/features/auth/username";

describe("nome de usuário (D-85)", () => {
  it("aceita minúsculas, números e ponto entre 3 e 30 caracteres", () => {
    for (const ok of ["nadson.fraga", "ana", "recepcao2", "a.b.c"]) expect(validateUsername(ok)).toBeNull();
  });

  it("recusa tamanho, caracteres e pontos fora do lugar", () => {
    expect(validateUsername("ab")).toBe("tamanho");
    expect(validateUsername("a".repeat(31))).toBe("tamanho");
    expect(validateUsername("joão")).toBe("caracteres");
    expect(validateUsername("ana lima")).toBe("caracteres");
    expect(validateUsername("ana_lima")).toBe("caracteres");
    expect(validateUsername(".ana")).toBe("ponto");
    expect(validateUsername("ana.")).toBe("ponto");
    expect(validateUsername("ana..lima")).toBe("ponto");
  });

  it("maiúsculas e espaços nas pontas não fazem diferença ao entrar", () => {
    expect(normalizeUsername("  Nadson.Fraga ")).toBe("nadson.fraga");
  });
});
