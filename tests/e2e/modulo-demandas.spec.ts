import { expect, test, type Page } from "@playwright/test";
import { newPersonPage, signIn, testUsers, type Theme } from "./helpers";

// Etapa 1.4 — Pronto quando: duas pessoas abrem a mesma demanda; uma edita e a outra vê "está editando";
// ao salvar, a outra vê a mudança e a linha no histórico na hora.

const PRINTS = "test-results/prints/etapa-1.4";

/** Lista/Quadro fica no menu "Exibição" (D-113). */
async function showAs(page: Page, view: "Lista" | "Quadro") {
  await page.getByRole("button", { name: /^Exibição/ }).click();
  await page.getByRole("radio", { name: view, exact: true }).click();
  await page.keyboard.press("Escape");
}

async function openDemands(page: Page) {
  await page.getByRole("navigation", { name: "Módulos" }).getByRole("button", { name: "Demandas" }).click();
  await expect(page.getByRole("heading", { name: "Demandas", level: 1 })).toBeVisible();
}

test("pronto quando: trava, tempo real e histórico entre duas pessoas", async ({ browser }) => {
  const users = testUsers();
  const ana = await newPersonPage(browser);
  await signIn(ana, users.admin);
  const bruno = await newPersonPage(browser);
  await signIn(bruno, users.operador);
  await openDemands(bruno);

  // Ana cria a demanda pelo atalho C e atribui ao Bruno.
  await openDemands(ana);
  await ana.keyboard.press("c");
  const novo = ana.getByRole("dialog", { name: "Nova demanda" });
  await novo.getByLabel("Título").fill("Revisar tarifas de fim de ano");
  await novo.getByRole("button", { name: users.admin.name }).click();
  await ana.getByRole("checkbox", { name: users.operador.name }).check();
  await ana.keyboard.press("Escape");
  await novo.getByRole("button", { name: "Criar demanda" }).click();
  const anaDrawer = ana.getByRole("dialog", { name: /^Demanda #/ });
  await expect(anaDrawer.getByRole("heading", { name: "Revisar tarifas de fim de ano" })).toBeVisible();
  const code = ((await anaDrawer.getByRole("heading", { level: 2 }).first().textContent()) ?? "").replace("Demanda #", "").trim();

  // Bruno vê a demanda na lista sem recarregar, e a notificação de atribuição.
  await expect(bruno.getByTestId("caixa-de-entrada")).not.toHaveAttribute("data-nao-lidas", "0");
  const row = bruno.getByRole("row", { name: /Revisar tarifas de fim de ano/ });
  await expect(row).toBeVisible();
  await row.click();
  const brunoDrawer = bruno.getByRole("dialog", { name: /^Demanda #/ });
  await expect(brunoDrawer.getByText(/Visto às/).first()).toBeVisible();
  await expect(anaDrawer.getByText("vendo agora")).toBeVisible();

  // Bruno edita: a Ana vê "está editando" e não consegue editar.
  await brunoDrawer.getByRole("button", { name: /Editar/ }).click();
  await expect(anaDrawer.getByText("está editando")).toBeVisible();
  await expect(anaDrawer.getByRole("button", { name: /Editar/ })).toBeDisabled();

  // Bruno salva um prazo novo: a Ana vê a mudança e a linha do histórico na hora.
  await brunoDrawer.getByLabel("Prazo", { exact: true }).fill("2026-12-20");
  await bruno.keyboard.press("Control+s");
  await expect(brunoDrawer.getByRole("button", { name: /Editar/ })).toBeVisible();
  await expect(anaDrawer.getByText("definiu o prazo: 20/12/2026", { exact: false })).toBeVisible();
  await expect(anaDrawer.getByText("20 dez")).toBeVisible();
  await expect(anaDrawer.getByText("está editando")).toHaveCount(0);
  await expect(anaDrawer.getByRole("button", { name: /Editar/ })).toBeEnabled();

  // Comentário com menção: o Bruno recebe a notificação.
  const unreadBefore = (await bruno.getByTestId("caixa-de-entrada").getAttribute("data-nao-lidas")) ?? "0";
  const comment = anaDrawer.getByRole("textbox", { name: "Comentário" });
  await comment.click();
  await ana.keyboard.type("Confere com @Bru");
  await ana.getByRole("option", { name: new RegExp(users.operador.name) }).click();
  await ana.keyboard.type(" por favor");
  await ana.keyboard.press("Control+Enter");
  await expect(anaDrawer.getByText(/Confere com/)).toBeVisible();
  await expect(bruno.getByTestId("caixa-de-entrada")).toHaveAttribute("data-nao-lidas", String(Number(unreadBefore) + 1));
  await expect(brunoDrawer.getByText(/por favor/)).toBeVisible();

  // Quadro: arrastar para Em Andamento muda a situação para todos.
  await ana.keyboard.press("Escape");
  await expect(anaDrawer).toBeHidden();
  await showAs(ana, "Quadro");
  const card = ana.getByRole("button", { name: /Revisar tarifas de fim de ano/ });
  const target = ana.getByRole("region", { name: /^Em Andamento/ });
  const from = await card.boundingBox();
  const to = await target.boundingBox();
  await ana.mouse.move(from!.x + 40, from!.y + 20);
  await ana.mouse.down();
  await ana.mouse.move(from!.x + 60, from!.y + 30, { steps: 4 });
  await ana.mouse.move(to!.x + to!.width / 2, to!.y + 80, { steps: 10 });
  await ana.mouse.up();
  await expect(target.getByRole("button", { name: /Revisar tarifas de fim de ano/ })).toBeVisible();
  await expect(brunoDrawer.getByText(/alterou a situação de A Fazer para Em Andamento/)).toBeVisible();

  // Busca do Ctrl+K pelo código sem zeros.
  await ana.keyboard.press("Control+KeyK");
  await ana.getByRole("combobox", { name: "Buscar cliente ou executar um comando" }).fill(code.replace("-", "").replace(/0+(\d)/, "$1"));
  await expect(ana.getByRole("option", { name: /Revisar tarifas de fim de ano/ })).toBeVisible();
});

test("prints e acessibilidade (axe) de Demandas nos dois temas", async ({ browser }) => {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  const users = testUsers();
  for (const theme of ["escuro", "claro"] as Theme[]) {
    const page = await newPersonPage(browser, theme);
    await signIn(page, users.admin);
    const check = async (screen: string) => {
      const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      const problems = result.violations.map(
        (violation) => `${screen} (${theme}): ${violation.id} — ${violation.nodes.map((node) => node.target).join(" | ")}`
      );
      expect(problems, problems.join("\n")).toEqual([]);
    };
    const shot = async (name: string) => {
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${PRINTS}/${name}-${theme}.png` });
      await check(name);
    };

    await openDemands(page);
    await expect(page.getByRole("row", { name: /Revisar tarifas de fim de ano/ })).toBeVisible();
    await shot("lista");
    await showAs(page, "Quadro");
    const card = page.getByRole("region", { name: /^Em Andamento/ }).getByRole("button", { name: /Revisar tarifas de fim de ano/ });
    await expect(card).toBeVisible();
    await shot("quadro");
    await card.click();
    const drawer = page.getByRole("dialog", { name: /^Demanda #/ });
    await expect(drawer.getByRole("heading", { name: "Revisar tarifas de fim de ano" })).toBeVisible();
    await shot("painel-leitura");
    await drawer.getByRole("button", { name: /Editar/ }).click();
    await expect(drawer.getByLabel("Título")).toBeVisible();
    await shot("painel-edicao");
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await showAs(page, "Lista");
    await page.getByRole("button", { name: /Nova demanda/ }).click();
    await expect(page.getByRole("dialog", { name: "Nova demanda" })).toBeVisible();
    await shot("nova-demanda");
    await page.context().close();
  }
});

test("subtarefas reordenadas e marcadas com um clique, prévia e concluir riscando pela lista", async ({ browser }) => {
  const users = testUsers();
  const page = await newPersonPage(browser);
  await page.setViewportSize({ width: 1280, height: 720 });
  await signIn(page, users.admin);
  await openDemands(page);
  await page.keyboard.press("c");
  const novo = page.getByRole("dialog", { name: "Nova demanda" });
  await novo.getByLabel("Título").fill("Conferir fotos do hotel");
  // Cliente com busca, abrindo para baixo.
  await novo.getByRole("button", { name: "Cliente" }).click();
  await expect(page.getByPlaceholder("Buscar cliente por nome ou código")).toBeFocused();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${PRINTS}/busca-cliente-escuro.png` });
  await page.getByRole("option", { name: "Sem cliente" }).click();
  await expect(novo.getByRole("button", { name: "Cliente" })).toContainText("Sem cliente");
  for (const text of ["Baixar fotos", "Revisar legendas", "Publicar"]) {
    await novo.getByLabel("Nova subtarefa").fill(text);
    await page.keyboard.press("Enter");
  }
  // Reordenar pelo teclado: "Publicar" sobe para o topo.
  // O arrastar pelo teclado anima cada passo: uma pausa curta entre as teclas.
  await novo.getByRole("button", { name: "Mover subtarefa Publicar", exact: true }).focus();
  for (const key of ["Space", "ArrowUp", "ArrowUp", "Space"]) {
    await page.keyboard.press(key);
    await page.waitForTimeout(200);
  }
  await expect(novo.getByLabel(/^Texto da subtarefa/).first()).toHaveValue("Publicar");
  await novo.getByRole("button", { name: "Criar demanda" }).click();

  // Marcar sem Editar: grava na hora e entra no histórico (D-106).
  const drawer = page.getByRole("dialog", { name: /^Demanda #/ });
  await drawer.getByRole("checkbox", { name: "Baixar fotos" }).click();
  await expect(drawer.getByText('marcou como feita a subtarefa "Baixar fotos"')).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();

  // Prévia ao passar o mouse (D-108), com subtarefa marcável.
  await page.getByText("Conferir fotos do hotel").hover();
  const preview = page.getByRole("dialog", { name: "Prévia da demanda" });
  await preview.getByRole("checkbox", { name: "Revisar legendas" }).click();
  await expect(preview.getByText("2 de 3")).toBeVisible();
  await page.mouse.move(5, 600);
  await expect(preview).toBeHidden();

  // Concluir pela lista (D-107): risca e, depois de 2s, vai para Concluídas.
  await page.getByRole("checkbox", { name: "Concluir Conferir fotos do hotel" }).click();
  await expect(page.getByRole("checkbox", { name: "Desfazer conclusão de Conferir fotos do hotel" })).toBeChecked();
  await expect(page.getByRole("row", { name: /Conferir fotos do hotel/ })).toHaveCount(0, { timeout: 6000 });
  // Concluídas é um filtro (D-110).
  await page.getByRole("button", { name: "Filtros" }).click();
  await page.getByRole("checkbox", { name: /Ver concluídas/ }).check();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "Demandas concluídas", level: 1 })).toBeVisible();
  await page.getByRole("checkbox", { name: "Reabrir Conferir fotos do hotel" }).click();
  await expect(page.getByRole("row", { name: /Conferir fotos do hotel/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Remover filtro Concluídas" }).click();
  await expect(page.getByRole("row", { name: /Conferir fotos do hotel/ })).toBeVisible();

  // Classificar pela coluna e agrupar (D-111).
  await page.getByRole("button", { name: "Prazo", exact: true }).click();
  await expect(page.getByRole("columnheader", { name: /Prazo/ })).toHaveAttribute("aria-sort", "ascending");
  await page.getByRole("button", { name: /^Exibição/ }).click();
  await page.getByRole("radiogroup", { name: "Agrupar por" }).getByRole("radio", { name: "Situação" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /^A Fazer/ })).toHaveAttribute("aria-expanded", "true");
  await page.screenshot({ path: `${PRINTS}/agrupada-escuro.png` });

  // Colunas ajustáveis (D-114): a divisória alarga a coluna pelo teclado, e a largura fica guardada.
  const divider = page.getByRole("separator", { name: "Largura da coluna Cliente" });
  await divider.focus();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(divider).toHaveAttribute("aria-valuenow", "272");
  await page.reload();
  await expect(page.getByRole("separator", { name: "Largura da coluna Cliente" })).toHaveAttribute("aria-valuenow", "272");
  // Ordem das colunas: arrastar o título de Prazo para antes de Situação; o menu faz o mesmo pelo teclado.
  const headers = () => page.getByRole("columnheader").allInnerTexts();
  const prazo = page.getByRole("button", { name: "Prazo", exact: true });
  const situacao = page.getByRole("button", { name: "Situação", exact: true });
  const [from, to] = [await prazo.boundingBox(), await situacao.boundingBox()];
  await page.mouse.move(from!.x + 20, from!.y + from!.height / 2);
  await page.mouse.down();
  await page.mouse.move(from!.x - 40, from!.y + from!.height / 2, { steps: 5 });
  await page.mouse.move(to!.x + 10, to!.y + to!.height / 2, { steps: 10 });
  await page.mouse.up();
  await expect.poll(async () => (await headers()).map((text) => text.trim()).filter(Boolean).slice(-4)).toEqual(["Cliente", "Prazo", "Situação", "Atribuídos"]);
  const firstRow = page.locator("[data-codigo]").first();
  await expect(firstRow.getByRole("cell").nth(5)).toHaveClass(/text-right/);
  await page.reload();
  await expect.poll(async () => (await headers()).map((text) => text.trim()).filter(Boolean).slice(-4)).toEqual(["Cliente", "Prazo", "Situação", "Atribuídos"]);
  await page.getByRole("button", { name: /^Exibição/ }).click();
  await page.getByRole("button", { name: "Mover Cliente para a direita" }).click();
  await expect.poll(async () => (await headers()).map((text) => text.trim()).filter(Boolean).slice(-4)).toEqual(["Prazo", "Cliente", "Situação", "Atribuídos"]);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${PRINTS}/menu-exibicao-escuro.png` });
  await page.getByRole("button", { name: "Restaurar padrão" }).click();
  await expect.poll(async () => (await headers()).map((text) => text.trim()).filter(Boolean).slice(-4)).toEqual(["Cliente", "Situação", "Atribuídos", "Prazo"]);
  await expect(page.getByRole("separator", { name: "Largura da coluna Cliente" })).toHaveAttribute("aria-valuenow", "240");
  await page.keyboard.press("Escape");
  await page.context().close();
});
