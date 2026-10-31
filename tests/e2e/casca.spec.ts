import { expect, test, type Page } from "@playwright/test";
import { newPersonPage, signIn, testUsers, type Theme } from "./helpers";

// Etapa 1.1 — Pronto quando: abrir, alternar e fechar abas sem perder o que foi digitado,
// e a caixa de entrada recebe uma notificação de teste na hora.

const PRINTS = "test-results/prints/etapa-1.1";

const tab = (page: Page, name: RegExp | string) => page.getByRole("tab", { name });

async function openDraft(page: Page) {
  await page.getByRole("button", { name: /Nova aba/ }).click();
  await page.getByRole("button", { name: /Rascunho de teste/ }).click();
  await expect(page.getByRole("heading", { name: /Rascunho de teste \d/ })).toBeVisible();
}

test("abas: o que foi digitado continua ao trocar de aba, com ponto de não salvo e confirmação ao fechar", async ({
  browser,
}) => {
  const page = await newPersonPage(browser);
  await signIn(page, testUsers().admin);
  await expect(tab(page, "Início")).toHaveAttribute("aria-selected", "true");

  await openDraft(page);
  const title = page.getByLabel("Título");
  await title.fill("Texto que não pode sumir");
  await expect(tab(page, /Rascunho de teste 1/).getByRole("img", { name: "Alterações não salvas" })).toBeVisible();

  await page.getByRole("navigation", { name: "Módulos" }).getByRole("button", { name: "Demandas" }).click();
  await expect(page).toHaveURL(/\/demandas$/);
  await expect(page.getByRole("heading", { name: "Demandas", exact: true })).toBeVisible();

  await tab(page, /Rascunho de teste 1/).click();
  await expect(page.getByLabel("Título")).toHaveValue("Texto que não pode sumir");

  // Fechar com alteração não salva pede confirmação.
  await tab(page, /Rascunho de teste 1/).locator("[data-fechar-aba]").click();
  await expect(page.getByRole("dialog", { name: "Descartar alterações?" })).toBeVisible();
  await page.getByRole("button", { name: "Continuar editando" }).click();
  await expect(page.getByLabel("Título")).toHaveValue("Texto que não pode sumir");
  await tab(page, /Rascunho de teste 1/).locator("[data-fechar-aba]").click();
  await page.getByRole("button", { name: "Descartar e fechar" }).click();
  await expect(tab(page, /Rascunho de teste 1/)).toHaveCount(0);

  // A aba Início não tem botão de fechar.
  await expect(tab(page, "Início").locator("[data-fechar-aba]")).toHaveCount(0);
});

test("atalhos Alt+T, Alt+W, Alt+. e Alt+, (D-81) e o F5 reabre as abas (D-84)", async ({ browser }) => {
  const page = await newPersonPage(browser);
  await signIn(page, testUsers().admin);
  const nav = page.getByRole("navigation", { name: "Módulos" });
  await nav.getByRole("button", { name: "Demandas" }).click();
  await nav.getByRole("button", { name: "Clientes" }).click();
  await expect(tab(page, "Clientes")).toHaveAttribute("aria-selected", "true");

  await page.keyboard.press("Alt+Comma");
  await expect(tab(page, "Demandas")).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Alt+Period");
  await expect(tab(page, "Clientes")).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Alt+Period");
  await expect(tab(page, "Início")).toHaveAttribute("aria-selected", "true");

  await page.keyboard.press("Alt+KeyT");
  await expect(tab(page, "Nova aba")).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Alt+KeyW");
  await expect(tab(page, "Nova aba")).toHaveCount(0);

  await page.reload();
  await expect(tab(page, "Demandas")).toBeVisible();
  await expect(tab(page, "Clientes")).toBeVisible();
});

test("busca Ctrl+K abre módulos e a sidebar guarda a largura", async ({ browser }) => {
  const page = await newPersonPage(browser);
  await signIn(page, testUsers().admin);

  await page.keyboard.press("Control+KeyK");
  const search = page.getByRole("combobox", { name: "Buscar ou executar um comando" });
  await search.fill("cadastros");
  await page.keyboard.press("Enter");
  await expect(tab(page, "Cadastros")).toHaveAttribute("aria-selected", "true");

  const divider = page.getByTestId("divisor-sidebar");
  await divider.focus();
  for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowRight");
  await expect(divider).toHaveAttribute("aria-valuenow", "308");
  await page.reload();
  await expect(page.getByTestId("divisor-sidebar")).toHaveAttribute("aria-valuenow", "308");
});

test("caixa de entrada recebe a notificação de teste em menos de 1 segundo", async ({ browser }) => {
  const users = testUsers();
  const ana = await newPersonPage(browser);
  const bruno = await newPersonPage(browser);
  await signIn(ana, users.admin);
  await signIn(bruno, users.operador);
  const inbox = bruno.getByTestId("caixa-de-entrada");
  await expect(bruno.getByTestId("ponto-conexao")).toHaveAttribute("data-estado", "conectado");
  // Zera a caixa do Bruno antes de medir.
  await inbox.click();
  const markAll = bruno.getByRole("button", { name: "Marcar todas como lidas" });
  if (await markAll.isEnabled()) await markAll.click();
  await bruno.keyboard.press("Escape");
  await expect(inbox).toHaveAttribute("data-nao-lidas", "0");

  await ana.keyboard.press("Control+KeyK");
  await ana.getByRole("combobox", { name: "Buscar ou executar um comando" }).fill("notificação de teste");
  const started = Date.now();
  await ana.keyboard.press("Enter");
  await expect(inbox).not.toHaveAttribute("data-nao-lidas", "0", { timeout: 5000 });
  const elapsed = Date.now() - started;
  console.log(`Da Ana enviar até a caixa de entrada do Bruno acender: ${elapsed} ms`);
  expect(elapsed).toBeLessThan(1000);

  await inbox.click();
  await expect(bruno.getByRole("listitem").filter({ hasText: "Notificação de teste" }).first()).toBeVisible();
  await bruno.getByRole("button", { name: "Marcar todas como lidas" }).click();
  await expect(inbox).toHaveAttribute("data-nao-lidas", "0");
});

test("prints e acessibilidade (axe) da casca nos dois temas", async ({ browser }) => {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  const users = testUsers();
  for (const theme of ["escuro", "claro"] as Theme[]) {
    const page = await newPersonPage(browser, theme);
    await signIn(page, users.admin);
    const check = async (screen: string) => {
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      const problems = result.violations.map(
        (violation) => `${screen} (${theme}): ${violation.id} — ${violation.nodes.map((node) => node.target).join(" | ")}`
      );
      expect(problems, problems.join("\n")).toEqual([]);
    };

    const nav = page.getByRole("navigation", { name: "Módulos" });
    await nav.getByRole("button", { name: "Demandas" }).click();
    await openDraft(page);
    await page.getByLabel("Título").fill("Conferência de cadastro");
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${PRINTS}/casca-abas-${theme}.png` });
    await check("casca");

    await page.keyboard.press("Control+KeyK");
    await expect(page.getByRole("combobox", { name: "Buscar ou executar um comando" })).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${PRINTS}/busca-ctrl-k-${theme}.png` });
    await check("busca");
    await page.keyboard.press("Escape");

    await page.getByTestId("caixa-de-entrada").click();
    await expect(page.getByRole("heading", { name: "Caixa de entrada" })).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${PRINTS}/caixa-de-entrada-${theme}.png` });
    await check("caixa de entrada");
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Opções de exibição" }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${PRINTS}/opcoes-de-exibicao-${theme}.png` });
    await check("opções de exibição");
    await page.keyboard.press("Escape");

    await page.keyboard.press("Alt+KeyW");
    await expect(page.getByRole("dialog", { name: "Descartar alterações?" })).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${PRINTS}/confirmar-fechar-${theme}.png` });
    await check("confirmar fechar");
    await page.context().close();
  }
});
