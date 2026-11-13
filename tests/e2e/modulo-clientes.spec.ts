import { expect, test, type Browser, type Page } from "@playwright/test";
import { signIn, testUsers, type Theme } from "./helpers";

// Etapa 1.3 — Pronto quando: um cliente é criado com serviços, aparece na lista certa, e o fluxo
// "Copiar e Abrir Extranet" deixa o usuário no Ctrl+V (a senha fica no histórico do Win+V, conferido à mão).

const PRINTS = "test-results/prints/etapa-1.3";
const EXTRANET = "https://extranet.invalid/entrar";

/** Navegador com permissão de área de transferência e a extranet fictícia respondendo. */
async function personPage(browser: Browser, theme: Theme = "escuro") {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: "pt-BR",
    permissions: ["clipboard-read", "clipboard-write"],
  });
  await context.addInitScript((value) => window.localStorage.setItem("tema", value), theme);
  await context.route("https://extranet.invalid/**", (route) => route.fulfill({ body: "extranet de teste", contentType: "text/plain" }));
  return context.newPage();
}

async function openClients(page: Page) {
  await page.getByRole("navigation", { name: "Módulos" }).getByRole("button", { name: "Clientes" }).click();
  await expect(page.getByRole("heading", { name: "Clientes", level: 1 })).toBeVisible();
}

async function createClient(page: Page, name: string, sigla: string, service: string, phase: string, financePhone = "") {
  await page.getByRole("button", { name: "Novo cliente" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nome fantasia").fill(name);
  // A sugestão pode vir com menos de 3 letras; o analista completa (D-74).
  await page.waitForTimeout(500);
  await dialog.getByLabel("Sigla").fill(sigla);
  await expect(dialog.getByText(`Código: #${sigla}-001`)).toBeVisible();
  await dialog.getByLabel("Cidade").fill("Gramado");
  await dialog.getByLabel("UF").fill("rs");
  if (financePhone) await dialog.getByLabel("WhatsApp (com DDD)").fill(financePhone);
  await dialog.getByLabel("Serviço", { exact: true }).selectOption({ label: service });
  await dialog.getByLabel("Fase").selectOption(phase);
  await dialog.getByRole("button", { name: "Criar cliente" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
}

test("pronto quando: cria cliente com serviços, lista certa e Copiar e Abrir Extranet", async ({ browser }) => {
  const users = testUsers();
  const admin = await personPage(browser);
  await signIn(admin, users.admin);
  const operador = await personPage(browser);
  await signIn(operador, users.operador);
  await openClients(operador);

  // Canal com extranet no catálogo.
  await admin.getByRole("button", { name: "Configurações", exact: true }).click();
  await admin.getByRole("navigation", { name: "Configurações" }).getByRole("button", { name: "Catálogo" }).click();
  const catalog = admin.getByRole("region", { name: "Catálogo" });
  await catalog.getByRole("button", { name: "Adicionar" }).click();
  await admin.getByRole("dialog").getByLabel("Nome").fill("Canal Cofre");
  await admin.getByRole("dialog").getByLabel("Endereço da extranet").fill(EXTRANET);
  await admin.getByRole("dialog").getByRole("button", { name: "Salvar" }).click();
  await expect(admin.getByRole("dialog")).toBeHidden();

  // Cliente ativo e cliente inativo (serviço concluído).
  await openClients(admin);
  await createClient(admin, "Pousada Teste Sol", "PSOL", "Assessoria", "Implantação", "(54) 99876-5432");
  await openClients(admin);
  await createClient(admin, "Hotel Teste Lua", "HLUA", "Consultoria", "Concluída");

  // Lista certa: o filtro padrão (Ativo) esconde o inativo. O operador vê o novo cliente sem recarregar.
  await openClients(admin);
  const list = admin.getByRole("table", { name: "Clientes" });
  await expect(list.getByRole("row", { name: /Pousada Teste Sol/ })).toBeVisible();
  await expect(list.getByRole("row", { name: /Hotel Teste Lua/ })).toHaveCount(0);
  await expect(operador.getByRole("table", { name: "Clientes" }).getByRole("row", { name: /Pousada Teste Sol/ })).toBeVisible();
  await admin.getByRole("button", { name: "Filtros" }).click();
  await admin.getByLabel("Inativo").check();
  await admin.keyboard.press("Escape");
  await expect(list.getByRole("row", { name: /Hotel Teste Lua/ })).toBeVisible();

  // Busca pelo código sem zeros e sem hífen.
  const code = (await list.getByRole("row", { name: /Pousada Teste Sol/ }).getAttribute("data-codigo")) ?? "";
  await admin.getByLabel("Buscar nome ou código").fill(code.replace("-", "").replace(/0+(\d)/, "$1"));
  await expect(list.getByRole("row", { name: /Pousada Teste Sol/ })).toBeVisible();
  await expect(list.getByRole("row", { name: /Hotel Teste Lua/ })).toHaveCount(0);

  // Ficha já aberta: o clique só vai até ela, sem duplicar (D-94).
  await list.getByRole("row", { name: /Pousada Teste Sol/ }).click();
  await expect(admin.getByRole("heading", { name: "Pousada Teste Sol", level: 1 })).toBeVisible();
  const openTabs = admin.getByRole("tablist", { name: "Abas abertas" });
  await expect(openTabs.getByRole("tab", { name: /Pousada Teste Sol/ })).toHaveCount(1);
  await expect(openTabs.getByRole("tab", { name: /Pousada Teste Sol/ })).toHaveAttribute("aria-selected", "true");

  // Cofre: adicionar acesso e Copiar e Abrir Extranet.
  await admin.keyboard.press("Alt+4");
  await admin.getByRole("button", { name: "Adicionar acesso" }).first().click();
  const dialog = admin.getByRole("dialog");
  await dialog.getByLabel("Canal").selectOption({ label: "Canal Cofre" });
  await expect(dialog.getByLabel("URL da extranet")).toHaveValue(EXTRANET);
  await dialog.getByLabel("ID da propriedade").fill("PROP-77");
  await dialog.getByLabel("Usuário").fill("usuario.cofre");
  await dialog.getByLabel("Senha", { exact: true }).fill("senha-secreta-1");
  await dialog.getByRole("button", { name: "Adicionar" }).click();
  await expect(dialog).toBeHidden();
  const row = admin.getByRole("table", { name: "Acessos do cliente" }).getByRole("row", { name: /Canal Cofre/ });
  await expect(row).toContainText("••••••••••••");
  await expect(row).not.toContainText("senha-secreta-1");

  const popup = admin.context().waitForEvent("page");
  await row.getByRole("button", { name: /Copiar e abrir extranet/ }).click();
  const extranet = await popup;
  expect(extranet.url()).toBe(EXTRANET);
  await expect(row.getByRole("button", { name: /Copiar e abrir extranet/ })).toContainText("Copiado");
  // O último item copiado é o usuário (Ctrl+V); a senha foi copiada antes, para o Win+V.
  expect(await admin.evaluate(() => navigator.clipboard.readText())).toBe("usuario.cofre");
  await extranet.close();

  await row.getByRole("button", { name: /Copiar senha/ }).click();
  await expect.poll(() => admin.evaluate(() => navigator.clipboard.readText())).toBe("senha-secreta-1");

  // Cobrança: link do WhatsApp do contato financeiro com a mensagem preenchida.
  await admin.keyboard.press("Alt+5");
  const charge = admin.getByRole("link", { name: "Cobrar no WhatsApp" });
  await expect(charge).toHaveAttribute("href", /^https:\/\/wa\.me\/5554998765432\?text=.*Pousada%20Teste%20Sol/);

  // Operador: vê e copia, mas não edita nem adiciona (D-36, D-91).
  await operador.getByRole("table", { name: "Clientes" }).getByRole("row", { name: /Pousada Teste Sol/ }).click();
  await expect(operador.getByRole("heading", { name: "Pousada Teste Sol", level: 1 })).toBeVisible();
  await operador.keyboard.press("Alt+4");
  await expect(operador.getByRole("table", { name: "Acessos do cliente" }).getByRole("row", { name: /Canal Cofre/ })).toBeVisible();
  await expect(operador.getByRole("button", { name: "Adicionar acesso" })).toHaveCount(0);
  await operador.getByRole("button", { name: "Configurações do cliente" }).click();
  await expect(operador.getByRole("dialog").getByLabel("Nome fantasia")).toBeDisabled();
  await expect(operador.getByRole("dialog").getByRole("button", { name: "Editar" })).toHaveCount(0);
});

test("prints e acessibilidade (axe) de Clientes nos dois temas", async ({ browser }) => {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  const users = testUsers();
  for (const theme of ["escuro", "claro"] as Theme[]) {
    const page = await personPage(browser, theme);
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

    await openClients(page);
    await expect(page.getByRole("row", { name: /Pousada Teste Sol/ })).toBeVisible();
    await shot("lista");
    await page.getByRole("button", { name: "Novo cliente" }).first().click();
    await page.getByRole("dialog").getByLabel("Nome fantasia").fill("Pousada Exemplo");
    await shot("novo-cliente");
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();

    await page.getByRole("row", { name: /Pousada Teste Sol/ }).click();
    await expect(page.getByRole("heading", { name: "Pousada Teste Sol", level: 1 })).toBeVisible();
    await shot("ficha-visao-geral");
    for (const [key, name] of [
      ["Alt+2", "ficha-dados-tecnicos"],
      ["Alt+4", "ficha-cofre"],
      ["Alt+5", "ficha-cobranca"],
    ]) {
      await page.keyboard.press(key);
      await shot(name);
    }
    await page.getByRole("button", { name: "Configurações do cliente" }).click();
    await shot("configuracoes-do-cliente");
    await page.context().close();
  }
});

test("catálogo com várias categorias e acesso pela conta da empresa (D-103, D-104)", async ({ browser }) => {
  const users = testUsers();
  const admin = await personPage(browser);
  await signIn(admin, users.admin);
  await admin.getByRole("button", { name: "Configurações", exact: true }).click();
  await admin.getByRole("navigation", { name: "Configurações" }).getByRole("button", { name: "Catálogo" }).click();
  const catalog = admin.getByRole("region", { name: "Catálogo" });

  // Um item Channel Manager e PMS ao mesmo tempo.
  await catalog.getByRole("button", { name: "Adicionar" }).click();
  let dialog = admin.getByRole("dialog");
  await dialog.getByLabel("Nome").fill("Sistema Duplo");
  await dialog.getByRole("checkbox", { name: "Canal de venda" }).uncheck();
  await dialog.getByRole("checkbox", { name: "Channel Manager" }).check();
  await dialog.getByRole("checkbox", { name: "PMS" }).check();
  await dialog.getByRole("button", { name: "Salvar" }).click();
  await expect(dialog).toBeHidden();

  // Canal pela conta da empresa.
  await catalog.getByRole("radio", { name: "Canais de venda" }).click();
  await catalog.getByRole("button", { name: "Adicionar" }).click();
  dialog = admin.getByRole("dialog");
  await dialog.getByLabel("Nome").fill("Perfil Empresa");
  await dialog.getByRole("checkbox", { name: /Acesso pela conta da empresa/ }).check();
  await dialog.getByLabel("Endereço da extranet").fill("https://extranet.invalid/geral");
  await dialog.getByRole("button", { name: "Salvar" }).click();
  await expect(dialog).toBeHidden();

  // A ficha oferece o mesmo item nos dois campos.
  await admin.getByRole("navigation", { name: "Módulos" }).getByRole("button", { name: "Clientes" }).click();
  await admin.getByRole("table", { name: "Clientes" }).getByRole("row", { name: /Pousada Teste Sol/ }).click();
  await expect(admin.getByRole("heading", { name: "Pousada Teste Sol", level: 1 })).toBeVisible();
  await admin.getByRole("button", { name: "Configurações do cliente" }).click();
  dialog = admin.getByRole("dialog");
  await expect(dialog.getByLabel("Channel Manager").locator("option", { hasText: "Sistema Duplo" })).toHaveCount(1);
  await expect(dialog.getByLabel("PMS").locator("option", { hasText: "Sistema Duplo" })).toHaveCount(1);
  await admin.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  // No Cofre, o acesso guarda só o link da página da propriedade.
  await admin.keyboard.press("Alt+4");
  await admin.getByRole("button", { name: "Adicionar acesso" }).first().click();
  dialog = admin.getByRole("dialog");
  await dialog.getByLabel("Canal").selectOption({ label: "Perfil Empresa" });
  await expect(dialog.getByLabel("Usuário")).toHaveCount(0);
  await dialog.getByLabel("Link da página da propriedade").fill("https://extranet.invalid/propriedade-77");
  await dialog.getByRole("button", { name: "Adicionar" }).click();
  await expect(dialog).toBeHidden();
  const row = admin.getByRole("table", { name: "Acessos do cliente" }).getByRole("row", { name: /Perfil Empresa/ });
  await expect(row).toContainText("Conta da empresa");
  await expect(row.getByRole("link", { name: /Abrir página/ })).toHaveAttribute("href", "https://extranet.invalid/propriedade-77");
});
