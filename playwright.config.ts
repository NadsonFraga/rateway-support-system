import { defineConfig, devices } from "@playwright/test";
import { testDatabaseUrl } from "./tests/test-database";

// Testes de ponta a ponta: sobem o sistema na porta 3100 apontando para o banco de TESTES.
// Compila em .next-e2e, separado do `npm run dev`.
const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "tests/e2e",
  outputDir: "test-results/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    viewport: { width: 1920, height: 1080 },
    locale: "pt-BR",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1920, height: 1080 } } }],
  webServer: {
    command: "npx tsx server.ts",
    url: `${BASE_URL}/api/auth/ok`,
    timeout: 180_000,
    reuseExistingServer: false,
    env: {
      PORT: String(PORT),
      DATABASE_URL: testDatabaseUrl(),
      BETTER_AUTH_URL: BASE_URL,
      // A suíte faz vários logins seguidos do mesmo endereço; em uso real o limite é 10 por minuto.
      AUTH_SIGNIN_RATE_LIMIT: "200",
      NEXT_DIST_DIR: ".next-e2e",
    },
  },
});
