import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { testDatabaseUrl } from "./tests/test-database";

// Testes automáticos. Os que usam banco rodam no banco de TESTES (support_system_test), nunca no de desenvolvimento.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    env: {
      DATABASE_URL: testDatabaseUrl(),
      VAULT_ENCRYPTION_KEY_V1: "",
    },
    fileParallelism: false,
    globalSetup: ["./tests/vitest-setup.ts"],
  },
});
