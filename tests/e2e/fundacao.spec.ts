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
  await expect(page.getByRole("heading", { name: "Início", exact: true })).toBeVisible();
  await expect(page).toHaveTitle(/Instância de Teste/);

  await page.getByRole("button", { name: users.admin.name, exact: true }).click();
  await page.getByRole("menuitem", { name: "Sair" }).click();
  await page.waitForURL("/entrar");
  await page.goto("/");
  await page.waitForURL("/entrar");
});

test("senha errada mostra mensagem genérica", async ({ browser }) => {
  const users = testUsers();
  const page = await newPersonPage(browser);
  await page.goto("/entrar");
  await page.getByLabel("Usuário").fill(users.admin.username);
  await page.getByLabel("Senha", { exact: true }).fill("senha-errada-123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Usuário ou senha incorretos.")).toBeVisible();
});

test("login por usuário: maiúsculas não importam e o login por e-mail está desligado (D-85)", async ({ browser }) => {
  const users = testUsers();
  const page = await newPersonPage(browser);
  const headers = { origin: "http://localhost:3100" };

  const byEmail = await page.request.post("/api/auth/sign-in/email", {
    data: { email: users.admin.email, password: users.admin.password },
    headers,
  });
  expect(byEmail.status()).toBe(404);
  const lookup = await page.request.post("/api/auth/is-username-available", {
    data: { username: users.admin.username },
    headers,
  });
  expect(lookup.status()).toBe(404);

  await signIn(page, { ...users.admin, username: users.admin.username.toUpperCase() });
  await expect(page.getByRole("heading", { name: "Início", exact: true })).toBeVisible();
});

test("prints das telas nos dois temas", async ({ browser }) => {
  const users = testUsers();
  for (const theme of ["escuro", "claro"] as Theme[]) {
    const page = await newPersonPage(browser, theme);
    await page.goto("/entrar");
    await expect(page.getByRole("button", { name: "Entrar" })).toBeEnabled();
    await page.screenshot({ path: `${PRINTS}/login-${theme}.png` });

    await signIn(page, users.admin);
    await expect(page.getByRole("heading", { name: "Início", exact: true })).toBeVisible();
    await page.screenshot({ path: `${PRINTS}/tela-vazia-${theme}.png` });

    await page.getByRole("button", { name: users.admin.name, exact: true }).click();
    await expect(page.getByRole("menuitem", { name: "Sair" })).toBeVisible();
    await page.waitForTimeout(300); // fim da animação de abertura do menu
    await page.screenshot({ path: `${PRINTS}/menu-avatar-${theme}.png` });
    await page.keyboard.press("Escape");
    await page.context().close();
  }
});

test("acessibilidade (axe, WCAG 2.2 AA) nas telas de login e início, nos dois temas", async ({ browser }) => {
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
    await check("início");
    await page.context().close();
  }
});

test("primeiro acesso: senha temporária, senha nova, autenticador; nada funciona antes de concluir", async ({ browser }) => {
  const { novo } = testUsers();
  const page = await newPersonPage(browser);
  await page.goto("/entrar");
  await page.getByLabel("Usuário").fill(novo.username);
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
  await expect(page.getByRole("heading", { name: "Início", exact: true })).toBeVisible();
});
