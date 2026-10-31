import { readFileSync } from "node:fs";
import { expect, type Browser, type Page } from "@playwright/test";
import { createOTP } from "@better-auth/utils/otp";
import { CREDENTIALS_FILE, type TestUser } from "./test-users";

export type Theme = "escuro" | "claro";

export function testUsers(): Record<"admin" | "operador" | "novo", TestUser> {
  return JSON.parse(readFileSync(CREDENTIALS_FILE, "utf8"));
}

export async function totpFor(user: TestUser) {
  return createOTP(user.totpSecret, { digits: 6, period: 30 }).totp();
}

/** Abre um navegador independente (como outro computador) já com o tema escolhido. */
export async function newPersonPage(browser: Browser, theme: Theme = "escuro") {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: "pt-BR" });
  await context.addInitScript((value) => window.localStorage.setItem("tema", value), theme);
  return context.newPage();
}

export async function signIn(page: Page, user: TestUser) {
  await page.goto("/entrar");
  await page.getByLabel("Usuário").fill(user.username);
  await page.getByLabel("Senha", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Código do autenticador" })).toBeVisible();
  await page.getByLabel("Código do autenticador").fill(await totpFor(user));
  await page.waitForURL("/");
}
