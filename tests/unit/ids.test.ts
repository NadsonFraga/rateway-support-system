import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { nextClientCode, nextDemandCode } from "@/features/ids/generator";
import { applyMask, parseCodeQuery, suggestClientCode, validateClientCode } from "@/features/ids/masks";

const IGNORED = ["Hotel", "Pousada", "Resort", "de", "do", "dos", "da", "das", "e"];

describe("máscaras e siglas", () => {
  it("aplica as máscaras padrão", () => {
    expect(applyMask("{SIGLA}-{SEQ:3}", { sigla: "HFI", seq: 1 })).toBe("HFI-001");
    expect(applyMask("{PREFIXO}-{SEQ:4}", { prefixo: "DEM", seq: 42 })).toBe("DEM-0042");
    expect(applyMask("{SEQ}", { seq: 1048 })).toBe("1048");
    expect(applyMask("{SIGLA}{ALEATORIO:4}", { sigla: "HFI", seq: 1 }, () => 0.3)).toBe("HFI3333");
  });

  it("sugere a sigla ignorando palavras genéricas e acentos", () => {
    expect(suggestClientCode("Senhor dos Trilhos", IGNORED)).toBe("ST");
    expect(suggestClientCode("Hotel Fazenda Ilha", IGNORED)).toBe("FI");
    expect(suggestClientCode("Pousada Água Ébano Ícone Órbita Único", IGNORED)).toBe("AEIO");
  });

  it("exige 3 a 4 letras e bloqueia o prefixo de demanda (D-74)", () => {
    expect(validateClientCode("ST", "DEM")).toBe("tamanho");
    expect(validateClientCode("SDT", "DEM")).toBeNull();
    expect(validateClientCode("ABCDE", "DEM")).toBe("tamanho");
    expect(validateClientCode("DEM", "DEM")).toBe("prefixo-reservado");
    expect(validateClientCode("SÃO", "DEM")).toBe("caracteres");
  });

  it("busca aceita código com ou sem # e sem zeros à esquerda", () => {
    expect(parseCodeQuery("hfi1")).toEqual({ letters: "HFI", number: 1 });
    expect(parseCodeQuery("#HFI-001")).toEqual({ letters: "HFI", number: 1 });
    expect(parseCodeQuery("1048")).toEqual({ letters: "", number: 1048 });
  });
});

describe("gerador com banco (contadores)", () => {
  beforeEach(async () => {
    await prisma.idSequence.deleteMany();
  });

  afterAll(async () => {
    await prisma.idSequence.deleteMany();
    await prisma.$disconnect();
  });

  it("contador de cliente é separado por sigla", async () => {
    const a1 = await prisma.$transaction((tx) => nextClientCode(tx, "HFI", "{SIGLA}-{SEQ:3}"));
    const a2 = await prisma.$transaction((tx) => nextClientCode(tx, "HFI", "{SIGLA}-{SEQ:3}"));
    const b1 = await prisma.$transaction((tx) => nextClientCode(tx, "SDT", "{SIGLA}-{SEQ:3}"));
    expect([a1, a2, b1]).toEqual(["HFI-001", "HFI-002", "SDT-001"]);
  });

  it("criações simultâneas nunca repetem número", async () => {
    const codes = await Promise.all(
      Array.from({ length: 20 }, () =>
        prisma.$transaction((tx) => nextDemandCode(tx, "DEM", "{PREFIXO}-{SEQ:4}"))
      )
    );
    expect(new Set(codes).size).toBe(20);
    expect([...codes].sort()).toEqual(
      Array.from({ length: 20 }, (_, i) => `DEM-${String(i + 1).padStart(4, "0")}`)
    );
  });
});
