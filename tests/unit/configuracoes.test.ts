import { describe, expect, it } from "vitest";
import { checkImage, MAX_ASSET_BYTES } from "@/features/assets/validate";
import { fillTemplate, unknownVariables } from "@/features/settings/message-template";
import { memberChangeProblem } from "@/features/settings/member-rules";
import { moveItem } from "@/features/settings/catalog-types";

const bytes = (...values: number[]) => new Uint8Array(values);
const text = (value: string) => new TextEncoder().encode(value);

describe("imagens enviadas (D-89)", () => {
  it("reconhece o tipo real pelos primeiros bytes", () => {
    expect(checkImage(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2))).toEqual({ ok: true, contentType: "image/png" });
    expect(checkImage(bytes(0xff, 0xd8, 0xff, 0xe0))).toEqual({ ok: true, contentType: "image/jpeg" });
    expect(checkImage(text("RIFF\0\0\0\0WEBPVP8 "))).toEqual({ ok: true, contentType: "image/webp" });
    expect(checkImage(text('<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>'))).toEqual({
      ok: true,
      contentType: "image/svg+xml",
    });
  });

  it("recusa SVG com código ou links externos", () => {
    for (const svg of [
      "<svg><script>alert(1)</script></svg>",
      '<svg onload="alert(1)"></svg>',
      '<svg><a href="javascript:alert(1)">x</a></svg>',
      '<svg><image href="https://exemplo.invalid/x.png"/></svg>',
      "<svg><foreignObject><div/></foreignObject></svg>",
    ]) {
      expect(checkImage(text(svg)).ok, svg).toBe(false);
    }
  });

  it("recusa arquivo grande, vazio ou de outro formato", () => {
    expect(checkImage(new Uint8Array(MAX_ASSET_BYTES + 1)).ok).toBe(false);
    expect(checkImage(new Uint8Array()).ok).toBe(false);
    expect(checkImage(text("%PDF-1.7")).ok).toBe(false);
    expect(checkImage(text("<html><body>oi</body></html>")).ok).toBe(false);
  });
});

describe("mensagem de cobrança (D-38)", () => {
  it("troca as variáveis e marca as que faltam", () => {
    const filled = fillTemplate("Olá, {{contato_financeiro.nome}}. Vence {{ vencimento }}. {{servico}}", {
      "contato_financeiro.nome": "Joana",
      vencimento: "dia 20",
    });
    expect(filled).toBe("Olá, Joana. Vence dia 20. [servico]");
  });

  it("aponta variáveis desconhecidas", () => {
    expect(unknownVariables("{{cliente.nome}} {{clinte.nome}} {{vencimento}}")).toEqual(["clinte.nome"]);
  });
});

describe("proteções de Membros", () => {
  const base = { actorId: "eu", targetId: "outro", targetIsAdmin: false, activeAdmins: 2, adminRole: "administrador" };

  it("ninguém desativa a própria conta nem tira o próprio perfil de Administrador", () => {
    expect(memberChangeProblem({ type: "desativar" }, { ...base, targetId: "eu", targetIsAdmin: true })).toMatch(/própria conta/);
    expect(
      memberChangeProblem({ type: "perfil", newRole: "operador_rotina" }, { ...base, targetId: "eu", targetIsAdmin: true })
    ).toMatch(/próprio perfil/);
  });

  it("sempre fica pelo menos um Administrador ativo", () => {
    const lastAdmin = { ...base, targetIsAdmin: true, activeAdmins: 1 };
    expect(memberChangeProblem({ type: "desativar" }, lastAdmin)).toMatch(/pelo menos um Administrador/);
    expect(memberChangeProblem({ type: "perfil", newRole: "analista_implantacao" }, lastAdmin)).toMatch(/pelo menos um/);
    expect(memberChangeProblem({ type: "desativar" }, { ...base, targetIsAdmin: true, activeAdmins: 2 })).toBeNull();
  });

  it("mudanças comuns passam", () => {
    expect(memberChangeProblem({ type: "nova-senha" }, base)).toBeNull();
    expect(memberChangeProblem({ type: "perfil", newRole: "administrador" }, base)).toBeNull();
  });
});

describe("ordem do catálogo", () => {
  it("move um item para outra posição", () => {
    expect(moveItem(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(moveItem(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
    expect(moveItem(["a", "b"], 0, 5)).toEqual(["a", "b"]);
  });
});
