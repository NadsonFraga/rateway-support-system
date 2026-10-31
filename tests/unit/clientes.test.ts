import { describe, expect, it } from "vitest";
import { billingLabel, billingProblem, clientStatus, hireProblem, phaseProblem } from "@/features/clients/rules";
import { formatPhone, isGroupLink, isValidPhone, whatsappLink } from "@/features/clients/whatsapp";
import { fillTemplate } from "@/features/settings/message-template";
import { initialTabsState, navigateTab, openTab, pathForTab, tabForPath } from "@/features/shell/tabs-model";
import { COPY_INTERVAL_MS, copyAndOpen } from "@/features/vault/copy-sequence";

describe("status do cliente (D-26)", () => {
  it("é calculado pelas fases dos serviços", () => {
    expect(clientStatus(["Em Operação", "Concluído"])).toBe("ativo");
    expect(clientStatus(["Pausado", "Cancelado"])).toBe("pausado");
    expect(clientStatus(["Cancelado", "Concluída"])).toBe("inativo");
    expect(clientStatus([])).toBe("inativo");
  });
});

describe("regras dos serviços", () => {
  it("a fase precisa ser uma das fases do serviço", () => {
    expect(phaseProblem(["Implantação", "Em Operação"], "Em Operação")).toBeNull();
    expect(phaseProblem(["Implantação", "Em Operação"], "Entrega")).not.toBeNull();
  });

  it("não duplica serviço em andamento e respeita a Assessoria (D-16)", () => {
    expect(hireProblem("assessoria", [{ serviceId: "assessoria", phase: "Implantação" }])).not.toBeNull();
    expect(hireProblem("assessoria", [{ serviceId: "assessoria", phase: "Cancelado" }])).toBeNull();
    expect(hireProblem("cadastro_revisao", [{ serviceId: "assessoria", phase: "Em Operação" }])).not.toBeNull();
    expect(hireProblem("cadastro_revisao", [{ serviceId: "central_reservas", phase: "Em Operação" }])).toBeNull();
  });

  it("vencimento: dia 1 a 31 nos contínuos, data única nos pontuais", () => {
    expect(billingProblem("continuo", 10, null)).toBeNull();
    expect(billingProblem("continuo", 32, null)).not.toBeNull();
    expect(billingProblem("pontual", null, "2026-11-20")).toBeNull();
    expect(billingLabel("continuo", 10, null)).toBe("Todo dia 10");
    expect(billingLabel("pontual", null, "2026-11-20")).toBe("20/11/2026");
    expect(billingLabel("continuo", null, null)).toBe("Não definido");
  });
});

describe("WhatsApp", () => {
  it("normaliza números brasileiros com DDD", () => {
    expect(isValidPhone("(11) 98765-4321")).toBe(true);
    expect(isValidPhone("98765-4321")).toBe(false);
    expect(formatPhone("11987654321")).toBe("+55 (11) 98765-4321");
    expect(whatsappLink("(11) 98765-4321", "Olá, tudo bem?")).toBe("https://wa.me/5511987654321?text=Ol%C3%A1%2C%20tudo%20bem%3F");
  });

  it("reconhece link de convite de grupo", () => {
    expect(isGroupLink("https://chat.whatsapp.com/AbC123")).toBe(true);
    expect(isGroupLink("https://wa.me/5511987654321")).toBe(false);
  });

  it("mensagem de cobrança preenche as variáveis do modelo", () => {
    const text = fillTemplate("Olá, {{contato_financeiro.nome}}. {{servico}} vence {{vencimento}}. Equipe {{instancia.nome}}", {
      "contato_financeiro.nome": "Marta",
      servico: "Assessoria",
      vencimento: "todo dia 10",
      "instancia.nome": "Central",
    });
    expect(text).toBe("Olá, Marta. Assessoria vence todo dia 10. Equipe Central");
  });
});

describe("Copiar e Abrir Extranet (D-37)", () => {
  it("copia a senha, espera, copia o usuário e só então abre a extranet", async () => {
    const steps: string[] = [];
    await copyAndOpen({ username: "usuario", password: "senha" }, "https://extranet.invalid", {
      clipboard: { writeText: async (text) => void steps.push(`copiou ${text}`) },
      wait: async (ms) => void steps.push(`esperou ${ms}`),
      open: (url) => void steps.push(`abriu ${url}`),
    });
    expect(steps).toEqual(["copiou senha", `esperou ${COPY_INTERVAL_MS}`, "copiou usuario", "abriu https://extranet.invalid"]);
  });

  it("sem extranet, só copia (Copiar Acesso)", async () => {
    const opened: string[] = [];
    await copyAndOpen({ username: "u", password: "s" }, null, {
      clipboard: { writeText: async () => undefined },
      wait: async () => undefined,
      open: (url) => void opened.push(url),
    });
    expect(opened).toEqual([]);
  });
});

describe("clique que sobrescreve (D-94)", () => {
  const ficha = { codigo: "HFI-001" };

  it("troca o conteúdo da aba atual", () => {
    const state = navigateTab(openTab(initialTabsState(), "clientes"), "cliente", ficha, { newTab: false, dirty: {} });
    expect(state.tabs.map((tab) => tab.kind)).toEqual(["inicio", "cliente"]);
  });

  it("Ctrl/Shift/meio abre em aba nova", () => {
    const state = navigateTab(openTab(initialTabsState(), "clientes"), "cliente", ficha, { newTab: true, dirty: {} });
    expect(state.tabs.map((tab) => tab.kind)).toEqual(["inicio", "clientes", "cliente"]);
  });

  it("nunca substitui o Início nem uma aba com alteração não salva", () => {
    expect(navigateTab(initialTabsState(), "clientes", undefined, { newTab: false, dirty: {} }).tabs).toHaveLength(2);
    const withDraft = openTab(initialTabsState(), "configuracoes");
    const state = navigateTab(withDraft, "clientes", undefined, { newTab: false, dirty: { [withDraft.activeId]: true } });
    expect(state.tabs.map((tab) => tab.kind)).toEqual(["inicio", "configuracoes", "clientes"]);
  });

  it("destino já aberto: só vai até ele", () => {
    let state = openTab(openTab(initialTabsState(), "clientes"), "demandas");
    state = navigateTab(state, "clientes", undefined, { newTab: false, dirty: {} });
    expect(state.tabs.map((tab) => tab.kind)).toEqual(["inicio", "clientes", "demandas"]);
    expect(state.activeId).toBe(state.tabs[1].id);
  });

  it("a ficha tem endereço próprio", () => {
    expect(pathForTab({ id: "x", kind: "cliente", params: ficha })).toBe("/clientes/HFI-001");
    expect(tabForPath("/clientes/hfi-001")).toEqual({ kind: "cliente", params: ficha });
  });
});
