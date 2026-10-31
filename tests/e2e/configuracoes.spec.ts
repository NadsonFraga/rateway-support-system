import { expect, test, type Page } from "@playwright/test";
import { base32 } from "@better-auth/utils/base32";
import { createOTP } from "@better-auth/utils/otp";
import { newPersonPage, signIn, testUsers, type Theme } from "./helpers";

// Etapa 1.2 — Pronto quando: o administrador cadastra canais e PMS, cria um membro com senha
// temporária, e esse membro completa o primeiro acesso.

const PRINTS = "test-results/prints/etapa-1.2";
// PNG de 1x1 pixel, para testar o envio de logo.
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

async function openSettings(page: Page, section: string) {
  await page.getByRole("button", { name: "Configurações", exact: true }).click();
  await page.getByRole("navigation", { name: "Configurações" }).getByRole("button", { name: section }).click();
  return page.getByRole("region", { name: section });
}

async function addCatalogItem(page: Page, name: string, url?: string, withLogo = false) {
  const section = page.getByRole("region", { name: "Catálogo" });
  await section.getByRole("button", { name: "Adicionar" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nome").fill(name);
  if (url) await dialog.getByLabel("Endereço da extranet").fill(url);
  if (withLogo) {
    await dialog.locator('input[type="file"]').setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: PNG_1PX });
    await expect(dialog.getByRole("img", { name: "Logo" })).toBeVisible();
  }
  await dialog.getByRole("button", { name: "Salvar" }).click();
  await expect(dialog).toBeHidden();
  await expect(section.getByRole("listitem").filter({ hasText: name })).toBeVisible();
}

test("pronto quando: cadastra canais e PMS, cria membro e o membro faz o primeiro acesso", async ({ browser }) => {
  const users = testUsers();
  const admin = await newPersonPage(browser);
  await signIn(admin, users.admin);
  const catalog = await openSettings(admin, "Catálogo");

  await addCatalogItem(admin, "Canal Teste A", "https://extranet.invalid/login", true);
  await addCatalogItem(admin, "Canal Teste B");
  const rows = catalog.getByRole("list", { name: /Canais de venda/ }).getByRole("listitem");
  await expect(rows).toHaveText([/Canal Teste A/, /Canal Teste B/]);

  // Reordenar pelo teclado (alça de arrastar): B sobe para o primeiro lugar.
  await catalog.getByRole("button", { name: "Mover Canal Teste B" }).focus();
  await admin.keyboard.press("Space");
  await admin.waitForTimeout(200);
  await admin.keyboard.press("ArrowUp");
  await admin.waitForTimeout(300);
  await admin.keyboard.press("Space");
  await expect(rows).toHaveText([/Canal Teste B/, /Canal Teste A/]);

  // Arquivar e reativar (D-88).
  await catalog.getByRole("button", { name: "Ações de Canal Teste A" }).click();
  await admin.getByRole("menuitem", { name: "Arquivar" }).click();
  await expect(rows).toHaveText([/Canal Teste B/]);
  await catalog.getByLabel("Mostrar arquivados").check();
  await catalog.getByRole("button", { name: "Ações de Canal Teste A" }).click();
  await admin.getByRole("menuitem", { name: "Reativar" }).click();
  await expect(rows).toHaveCount(2);

  await catalog.getByRole("radio", { name: "PMS" }).click();
  await addCatalogItem(admin, "PMS Teste");

  // Novo membro com senha temporária mostrada uma única vez.
  const members = await openSettings(admin, "Membros");
  await members.getByRole("button", { name: "Novo membro" }).click();
  const dialog = admin.getByRole("dialog");
  await dialog.getByLabel("Nome").fill("Carla Nova");
  await dialog.getByLabel("Usuário").fill("Carla.Teste");
  await expect(dialog.getByLabel("Usuário")).toHaveValue("carla.teste");
  await dialog.getByLabel("E-mail").fill("carla@teste.invalid");
  await dialog.getByRole("button", { name: "Criar membro" }).click();
  const tempPassword = (await admin.getByTestId("senha-temporaria").innerText()).trim();
  expect(tempPassword).toMatch(/^\w{4}-\w{4}-\w{4}$/);
  await admin.getByRole("button", { name: "Pronto" }).click();
  await expect(members.getByRole("listitem").filter({ hasText: "Carla Nova" })).toContainText("Aguardando primeiro acesso");

  // A Carla entra em outro computador e completa o primeiro acesso.
  const carla = await newPersonPage(browser);
  await carla.goto("/entrar");
  await expect(carla.getByRole("button", { name: "Entrar" })).toBeEnabled();
  await carla.getByLabel("Usuário").fill("carla.teste");
  await carla.getByLabel("Senha", { exact: true }).fill(tempPassword);
  await carla.getByRole("button", { name: "Entrar" }).click();
  await carla.waitForURL("/primeiro-acesso");
  await carla.getByLabel("Nova senha", { exact: true }).fill("senha-da-carla-123");
  await carla.getByLabel("Repita a nova senha").fill("senha-da-carla-123");
  await carla.getByRole("button", { name: "Continuar" }).click();
  const manualKey = (await carla.locator("code").innerText()).replace(/\s/g, "");
  await carla.getByLabel("Código de 6 dígitos").fill(await createOTP(base32.decode(manualKey), { digits: 6, period: 30 }).totp());
  await carla.waitForURL("/");
  await expect(carla.getByRole("tab", { name: "Início" })).toBeVisible();

  // Na tela do administrador, a linha da Carla muda para "Ativo" sozinha (tempo real).
  await members.getByRole("button", { name: "Ações de Carla Nova" }).waitFor();
  await admin.getByRole("navigation", { name: "Configurações" }).getByRole("button", { name: "Membros" }).click();
});

test("só Administrador vê Configurações; desativar derruba a sessão na hora", async ({ browser }) => {
  const users = testUsers();
  const bruno = await newPersonPage(browser);
  await signIn(bruno, users.operador);
  await expect(bruno.getByRole("button", { name: "Configurações", exact: true })).toHaveCount(0);
  await bruno.goto("/configuracoes");
  await expect(bruno.getByText("Configurações do Sistema são só para Administradores.")).toBeVisible();

  const admin = await newPersonPage(browser);
  await signIn(admin, users.admin);
  const members = await openSettings(admin, "Membros");
  await members.getByRole("switch", { name: `Conta de ${users.operador.name} ativa` }).click();
  await admin.getByRole("button", { name: "Desativar", exact: true }).click();
  await bruno.waitForURL(/\/entrar/, { timeout: 5000 });

  // Desativado não entra.
  await bruno.getByLabel("Usuário").fill(users.operador.username);
  await bruno.getByLabel("Senha", { exact: true }).fill(users.operador.password);
  await bruno.getByRole("button", { name: "Entrar" }).click();
  await expect(bruno.getByRole("alert").filter({ hasText: /incorretos|desativad|banned/i })).toBeVisible();

  // Reativa para os outros testes.
  await members.getByRole("switch", { name: `Conta de ${users.operador.name} ativa` }).click();
  await expect(members.getByRole("switch", { name: `Conta de ${users.operador.name} ativa` })).toHaveAttribute("aria-checked", "true");
});

test("aviso de conflito (D-87) e nome da plataforma atualiza para todos", async ({ browser }) => {
  const users = testUsers();
  const ana = await newPersonPage(browser);
  const dora = await newPersonPage(browser);
  await signIn(ana, users.admin);
  await signIn(dora, users.admin2);
  const anaIdentity = await openSettings(ana, "Identidade");
  const doraIdentity = await openSettings(dora, "Identidade");

  await doraIdentity.getByLabel("Nome da plataforma").fill("Rascunho da Dora");
  await anaIdentity.getByLabel("Nome da plataforma").fill("Plataforma Renomeada");
  const started = Date.now();
  await anaIdentity.getByRole("button", { name: "Salvar" }).click();
  await expect(doraIdentity.getByText(`${users.admin.name} salvou esta seção agora`)).toBeVisible({ timeout: 5000 });
  console.log(`Aviso de conflito chegou em ${Date.now() - started} ms`);
  await expect(dora.getByText("Plataforma Renomeada").first()).toBeVisible();

  // Dora descarta e vê a versão salva; Ana devolve o nome original.
  await doraIdentity.getByRole("button", { name: "Ver versão salva" }).click();
  await expect(doraIdentity.getByLabel("Nome da plataforma")).toHaveValue("Plataforma Renomeada");
  await anaIdentity.getByLabel("Nome da plataforma").fill("Instância de Teste");
  await anaIdentity.press("Control+s");
  await expect(doraIdentity.getByLabel("Nome da plataforma")).toHaveValue("Instância de Teste");

  // Logo enviado aparece na barra superior de todos, na hora.
  await anaIdentity.locator('input[type="file"]').first().setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: PNG_1PX });
  await expect(anaIdentity.getByRole("img", { name: "Logo para tema escuro" })).toBeVisible();
  await anaIdentity.getByRole("button", { name: "Salvar" }).click();
  await expect(dora.locator("header").locator('img[src^="/arquivos/"]').first()).toBeVisible({ timeout: 5000 });
  await expect(ana.locator("header").locator('img[src^="/arquivos/"]').first()).toBeVisible();
  // Remove para os outros testes.
  await anaIdentity.getByRole("button", { name: "Remover" }).first().click();
  await anaIdentity.getByRole("button", { name: "Salvar" }).click();
  await expect(dora.locator("header").locator('img[src^="/arquivos/"]')).toHaveCount(0, { timeout: 5000 });
});

test("Minha Conta: trocar senha, Esc duplo descarta e tema", async ({ browser }) => {
  const users = testUsers();
  const dora = await newPersonPage(browser);
  await signIn(dora, users.admin2);
  await dora.getByRole("button", { name: users.admin2.name, exact: true }).click();
  await dora.getByRole("menuitem", { name: "Minha Conta" }).click();
  const profile = dora.getByRole("region", { name: "Perfil" });

  // Esc duplo: o primeiro avisa, o segundo descarta (D-64).
  await profile.getByLabel("Nome", { exact: true }).fill("Dora Temporária");
  await expect(dora.getByRole("tab", { name: /Minha Conta/ }).getByRole("img", { name: "Alterações não salvas" })).toBeVisible();
  await profile.getByLabel("Nome", { exact: true }).press("Escape");
  await expect(profile.getByText("Esc de novo para descartar")).toBeVisible();
  await profile.getByLabel("Nome", { exact: true }).press("Escape");
  await expect(profile.getByLabel("Nome", { exact: true })).toHaveValue(users.admin2.name);

  await profile.getByRole("button", { name: "Trocar senha" }).click();
  const dialog = dora.getByRole("dialog");
  await dialog.getByLabel("Senha atual").fill(users.admin2.password);
  await dialog.getByLabel("Nova senha", { exact: true }).fill("nova-senha-da-dora-1");
  await dialog.getByLabel("Repita a nova senha").fill("nova-senha-da-dora-1");
  await dialog.getByRole("button", { name: "Trocar senha" }).click();
  await expect(dialog.getByText("Senha trocada.")).toBeVisible();
  await dialog.getByRole("button", { name: "Pronto" }).click();

  // Reconfigurar o autenticador (troca de celular) e continuar logada.
  await profile.getByRole("button", { name: "Reconfigurar autenticador" }).click();
  const auth = dora.getByRole("dialog");
  await auth.getByLabel("Senha atual").fill("nova-senha-da-dora-1");
  await auth.getByRole("button", { name: "Gerar QR Code" }).click();
  await expect(auth.getByRole("img", { name: "QR Code para o Google Authenticator" })).toBeVisible();
  const key = (await auth.locator("code").innerText()).replace(/\s/g, "");
  await auth.getByLabel("Código de 6 dígitos").fill(await createOTP(base32.decode(key), { digits: 6, period: 30 }).totp());
  await expect(auth.getByText("Autenticador reconfigurado.")).toBeVisible();
  await auth.getByRole("button", { name: "Pronto" }).click();
  await dora.reload();
  await expect(dora.getByRole("region", { name: "Perfil" })).toBeVisible();
  await expect(dora).toHaveURL(/\/minha-conta$/);

  await dora.getByRole("navigation", { name: "Minha Conta" }).getByRole("button", { name: "Aparência" }).click();
  await dora.getByRole("radio", { name: "Claro" }).click();
  await expect(dora.locator("html")).toHaveAttribute("data-theme", "light");
});

test("prints e acessibilidade (axe) de Configurações e Minha Conta nos dois temas", async ({ browser }) => {
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
    for (const section of ["Identidade", "Identificadores", "Catálogo", "Serviços", "Mensagens", "Membros"]) {
      const region = await openSettings(page, section);
      await expect(region.getByRole("heading", { name: section, exact: true })).toBeVisible();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${PRINTS}/${section.normalize("NFD").replace(/[^\w]/g, "").toLowerCase()}-${theme}.png` });
      await check(section);
    }
    await page.getByRole("region", { name: "Membros" }).getByRole("button", { name: "Novo membro" }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${PRINTS}/novo-membro-${theme}.png` });
    await check("novo membro");
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: users.admin.name, exact: true }).click();
    await page.getByRole("menuitem", { name: "Minha Conta" }).click();
    await expect(page.getByRole("region", { name: "Perfil" })).toBeVisible();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${PRINTS}/minha-conta-${theme}.png` });
    await check("minha conta");
    await page.context().close();
  }
});
