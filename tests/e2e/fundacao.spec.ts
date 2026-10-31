import { expect, test } from "@playwright/test";
import { base32 } from "@better-auth/utils/base32";
import { createOTP } from "@better-auth/utils/otp";
import { newPersonPage, signIn, testUsers, type Theme } from "./helpers";

// Critério da Etapa 1.0: entrar com uma conta, ver a tela vazia nos dois temas, e uma alteração
// feita num navegador aparecer em outro em menos de 1 segundo.

const PRINTS = "test-results/prints/etapa-1.0";

test("login com senha e Google Authenticator, tela vazia e Sair", async ({ browser }) => {
  const users = testUsers();
  const page = await newPersonPage(browser);
  await signIn(page, users.admin);
  await expect(page.getByRole("heading", { name: "Fundação pronta" })).toBeVisible();
  await expect(page).toHaveTitle(/Instância de Teste/);

  await page.getByRole("button", { name: `Conta de ${users.admin.name}` }).click();
  await page.getByRole("menuitem", { name: "Sair" }).click();
  await page.waitForURL("/entrar");
  await page.goto("/");
  await page.waitForURL("/entrar");
});

test("senha errada mostra mensagem genérica", async ({ browser }) => {
  const users = testUsers();
  const page = await newPersonPage(browser);
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(users.admin.email);
  await page.getByLabel("Senha", { exact: true }).fill("senha-errada-123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();
});

test("tempo real: alteração aparece no outro navegador em menos de 1 segundo, com trava", async ({ browser }) => {
  const users = testUsers();
  const ana = await newPersonPage(browser);
  const bruno = await newPersonPage(browser);
  await signIn(ana, users.admin);
  await signIn(bruno, users.operador);
  await ana.goto("/dev/tempo-real");
  await bruno.goto("/dev/tempo-real");
  await expect(ana.getByTestId("conexao")).toHaveText("Conectado");
  await expect(bruno.getByTestId("conexao")).toHaveText("Conectado");

  // Presença: cada um vê o outro "vendo agora".
  await expect(ana.getByTestId("vendo-agora")).toHaveText(users.operador.name);
  await expect(bruno.getByTestId("vendo-agora")).toHaveText(users.admin.name);

  // Ana edita: Bruno vê a faixa "está editando" e não consegue editar.
  await ana.getByRole("button", { name: /Editar/ }).click();
  await expect(bruno.getByTestId("faixa-trava")).toContainText(`${users.admin.name} está editando`);
  await expect(bruno.getByRole("button", { name: /Editar/ })).toBeDisabled();

  const text = `Alteração de teste ${Date.now()}`;
  await ana.getByTestId("texto-teste").fill(text);

  const started = Date.now();
  await ana.keyboard.press("Control+s");
  await expect(bruno.getByTestId("texto-teste")).toHaveValue(text, { timeout: 5000 });
  const elapsed = Date.now() - started;
  console.log(`Do Ctrl+S no navegador da Ana até aparecer no do Bruno: ${elapsed} ms`);
  expect(elapsed).toBeLessThan(1000);

  // Depois de salvar, a trava é liberada para todos.
  await expect(bruno.getByTestId("faixa-trava")).toBeHidden();
  await expect(bruno.getByRole("button", { name: /Editar/ })).toBeEnabled();
});

test("prints das telas nos dois temas", async ({ browser }) => {
  const users = testUsers();
  for (const theme of ["escuro", "claro"] as Theme[]) {
    const page = await newPersonPage(browser, theme);
    await page.goto("/entrar");
    await expect(page.getByRole("button", { name: "Entrar" })).toBeEnabled();
    await page.screenshot({ path: `${PRINTS}/login-${theme}.png` });

    await signIn(page, users.admin);
    await expect(page.getByRole("heading", { name: "Fundação pronta" })).toBeVisible();
    await page.screenshot({ path: `${PRINTS}/tela-vazia-${theme}.png` });

    await page.getByRole("button", { name: `Conta de ${users.admin.name}` }).click();
    await expect(page.getByRole("menuitem", { name: "Sair" })).toBeVisible();
    await page.waitForTimeout(300); // fim da animação de abertura do menu
    await page.screenshot({ path: `${PRINTS}/menu-avatar-${theme}.png` });
    await page.keyboard.press("Escape");

    const other = await newPersonPage(browser, theme);
    await signIn(other, users.operador);
    await other.goto("/dev/tempo-real");
    await page.goto("/dev/tempo-real");
    await expect(page.getByTestId("conexao")).toHaveText("Conectado");
    await other.getByRole("button", { name: /Editar/ }).click();
    await expect(page.getByTestId("faixa-trava")).toBeVisible();
    await page.screenshot({ path: `${PRINTS}/tempo-real-travado-${theme}.png` });
    await other.keyboard.press("Escape");

    await page.goto("/dev/componentes");
    await expect(page.getByText("Ajustar restrição de estadia mínima").first()).toBeVisible();
    await page.waitForTimeout(800); // fim da montagem escalonada
    await page.screenshot({ path: `${PRINTS}/catalogo-${theme}.png`, fullPage: true });
    await page.context().close();
    await other.context().close();
  }
});

test("acessibilidade (axe, WCAG 2.2 AA) nas telas da etapa, nos dois temas", async ({ browser }) => {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  const users = testUsers();
  for (const theme of ["escuro", "claro"] as Theme[]) {
    const page = await newPersonPage(browser, theme);
    const check = async (screen: string) => {
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      const problems = result.violations.map(
        (violation) => `${screen} (${theme}): ${violation.id} — ${violation.nodes.length} elemento(s)`
      );
      expect(problems, problems.join("\n")).toEqual([]);
    };

    await page.goto("/entrar");
    await expect(page.getByRole("button", { name: "Entrar" })).toBeEnabled();
    await check("login");
    await signIn(page, users.admin);
    await check("tela vazia");
    await page.goto("/dev/tempo-real");
    await expect(page.getByTestId("conexao")).toHaveText("Conectado");
    await check("tempo real");
    await page.goto("/dev/componentes");
    await expect(page.getByText("Ajustar restrição de estadia mínima").first()).toBeVisible();
    await page.waitForTimeout(800);
    await check("catálogo");
    await page.context().close();
  }
});

test("primeiro acesso: senha temporária, senha nova, autenticador; nada funciona antes de concluir", async ({ browser }) => {
  const { novo } = testUsers();
  const page = await newPersonPage(browser);
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(novo.email);
  await page.getByLabel("Senha", { exact: true }).fill(novo.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("/primeiro-acesso");

  // Com só a senha temporária, funções de administração do login são recusadas.
  const blocked = await page.request.get("/api/auth/admin/list-users");
  expect(blocked.status()).toBe(403);
  // E as telas do sistema levam de volta ao primeiro acesso.
  await page.goto("/");
  await page.waitForURL("/primeiro-acesso");

  const newPassword = `nova-${Date.now()}-senha`;
  await page.getByLabel("Nova senha", { exact: true }).fill(newPassword);
  await page.getByLabel("Repita a nova senha").fill(newPassword);
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("img", { name: "QR Code para o Google Authenticator" })).toBeVisible();

  const manualKey = (await page.locator("code").innerText()).replace(/\s/g, "");
  const code = await createOTP(base32.decode(manualKey), { digits: 6, period: 30 }).totp();
  await page.getByLabel("Código de 6 dígitos").fill(code);
  await page.waitForURL("/");
  await expect(page.getByRole("heading", { name: "Fundação pronta" })).toBeVisible();
});
