import { describe, expect, it } from "vitest";
import { canConclude, changeSentence, compareUrgency, demandDot, diffDemand, dueLabel, type DemandSnapshot } from "@/features/demands/rules";
import { docMentions, docText, isEmptyDoc } from "@/features/demands/editor/doc";
import { groupDemands, sortDemands } from "@/features/demands/list/arrange";
import type { DemandListItem } from "@/features/demands/types";

const now = new Date(2026, 9, 31, 10, 0); // 31/10/2026 10:00
const base = { status: "em_andamento" as const, priority: "normal" as const, dueDate: null, dueTime: null };

describe("cor do ponto (D-100)", () => {
  it("segue a primeira regra que valer", () => {
    expect(demandDot({ ...base, status: "concluida" }, now)).toBe("concluida");
    expect(demandDot({ ...base, priority: "critica" }, now)).toBe("atrasada");
    expect(demandDot({ ...base, dueDate: "2026-10-30" }, now)).toBe("atrasada");
    expect(demandDot({ ...base, dueDate: "2026-10-31", dueTime: "09:00" }, now)).toBe("atrasada");
    expect(demandDot({ ...base, dueDate: "2026-10-31", dueTime: "18:00" }, now)).toBe("atencao-prazo");
    expect(demandDot({ ...base, status: "aguardando_retorno", dueDate: "2026-11-10" }, now)).toBe("aguardando-retorno");
    expect(demandDot({ ...base, dueDate: "2026-11-10" }, now)).toBe("em-andamento");
  });

  it("ordena por urgência e depois pelo prazo mais próximo", () => {
    const list = [
      { ...base, id: "normal-longe", dueDate: "2026-11-20" },
      { ...base, id: "aguardando", status: "aguardando_retorno" as const },
      { ...base, id: "normal-perto", dueDate: "2026-11-05" },
      { ...base, id: "atrasada", dueDate: "2026-10-29" },
      { ...base, id: "hoje", dueDate: "2026-10-31", dueTime: "15:00" },
    ];
    expect([...list].sort((a, b) => compareUrgency(a, b, now)).map((item) => item.id)).toEqual([
      "atrasada",
      "hoje",
      "aguardando",
      "normal-perto",
      "normal-longe",
    ]);
  });
});

describe("texto do prazo", () => {
  it("usa Hoje, Amanhã, Ontem e a data curta", () => {
    expect(dueLabel("2026-10-31", "18:00", now)).toBe("Hoje 18h");
    expect(dueLabel("2026-11-01", null, now)).toBe("Amanhã");
    expect(dueLabel("2026-10-30", null, now)).toBe("Ontem");
    expect(dueLabel("2026-11-12", "09:30", now)).toBe("12 nov 09h30");
    expect(dueLabel("2027-01-05", null, now)).toBe("5 jan 2027");
    expect(dueLabel(null, null, now)).toBe("");
  });
});

describe("aprovação coletiva", () => {
  it("só conclui depois de todos confirmarem", () => {
    expect(canConclude({ requireAllConfirm: false, assignees: [{ confirmedAt: null }] })).toBe(true);
    expect(canConclude({ requireAllConfirm: true, assignees: [{ confirmedAt: "x" }, { confirmedAt: null }] })).toBe(false);
    expect(canConclude({ requireAllConfirm: true, assignees: [{ confirmedAt: "x" }, { confirmedAt: "y" }] })).toBe(true);
  });
});

describe("histórico de alterações (D-69)", () => {
  const before: DemandSnapshot = {
    title: "Ajustar tarifas",
    status: "em_andamento",
    priority: "normal",
    dueDate: "2026-11-10",
    dueTime: null,
    clientName: null,
    platformName: null,
    assigneeNames: ["Ana"],
    requireAllConfirm: false,
    descriptionText: "",
    subtasks: [{ text: "a", done: false }],
    attachmentNames: [],
  };

  it("gera uma frase por mudança", () => {
    const changes = diffDemand(before, { ...before, dueDate: "2026-11-12", subtasks: [{ text: "a", done: true }] });
    expect(changes.map(changeSentence)).toEqual([
      "alterou o prazo de 10/11/2026 para 12/11/2026",
      "alterou as subtarefas concluídas de 0 de 1 para 1 de 1",
    ]);
  });

  it("sem mudança, sem linha", () => {
    expect(diffDemand(before, { ...before })).toEqual([]);
  });
});

describe("documento do editor", () => {
  const doc = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Falar com " },
          { type: "mention", attrs: { id: "pessoa:u1", label: "Ana" } },
          { type: "text", text: " sobre " },
          { type: "mention", attrs: { id: "cliente:PSOL-001", label: "Pousada Sol" } },
        ],
      },
    ],
  };

  it("extrai texto e menções", () => {
    expect(docText(doc)).toBe("Falar com @Ana sobre @Pousada Sol");
    expect(docMentions(doc)).toEqual({ people: ["u1"], clients: ["PSOL-001"] });
    expect(isEmptyDoc({ type: "doc", content: [{ type: "paragraph" }] })).toBe(true);
  });
});

describe("classificar e agrupar a lista (D-111)", () => {
  const item = (id: string, extra: Partial<DemandListItem> = {}): DemandListItem => ({
    id,
    code: id,
    title: id,
    status: "a_fazer",
    priority: "normal",
    dueDate: null,
    dueTime: null,
    client: null,
    platform: null,
    assignees: [],
    requireAllConfirm: false,
    completedAt: null,
    updatedAt: "",
    ...extra,
  });
  const person = (id: string, name: string) => ({ id, name, image: null, seenAt: null, confirmedAt: null });
  const list = [
    item("b", { dueDate: "2026-11-10", status: "aguardando_retorno", client: { id: "c2", code: "X", name: "Zeta", logoUrl: null } }),
    item("a", { dueDate: "2026-11-02", assignees: [person("p1", "Ana"), person("p2", "Bruno")] }),
    item("c", { client: { id: "c1", code: "Y", name: "Alfa", logoUrl: null }, assignees: [person("p2", "Bruno")] }),
  ];

  it("classifica pelo prazo (sem prazo sempre no fim) e inverte no segundo clique", () => {
    expect(sortDemands(list, { key: "prazo", dir: "asc" }, now).map((x) => x.id)).toEqual(["a", "b", "c"]);
    expect(sortDemands(list, { key: "prazo", dir: "desc" }, now).map((x) => x.id)).toEqual(["b", "a", "c"]);
    expect(sortDemands(list, { key: "cliente", dir: "asc" }, now).map((x) => x.id)).toEqual(["c", "b", "a"]);
  });

  it("agrupa por situação na ordem do fluxo e por atribuído repetindo quem tem várias pessoas", () => {
    expect(groupDemands(list, "situacao").map((g) => [g.label, g.items.length])).toEqual([
      ["A Fazer", 2],
      ["Aguardando Retorno", 1],
    ]);
    expect(groupDemands(list, "atribuido").map((g) => [g.label, g.items.map((x) => x.id)])).toEqual([
      ["Ana", ["a"]],
      ["Bruno", ["a", "c"]],
      ["Ninguém atribuído", ["b"]],
    ]);
  });
});
