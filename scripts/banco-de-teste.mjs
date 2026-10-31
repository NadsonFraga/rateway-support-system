// Prepara o banco de TESTES (separado do banco de desenvolvimento) e aplica as migrações.
// Usa o mesmo usuário e senha do .env.local, trocando só o nome do banco. Nunca imprime a senha.
import { spawnSync } from "node:child_process";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const url = new URL(process.env.DATABASE_URL);
url.pathname = "/support_system_test";

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, DATABASE_URL: url.toString() },
});
process.exit(result.status ?? 1);
