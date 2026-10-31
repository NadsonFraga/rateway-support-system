import { spawnSync } from "node:child_process";

// Antes dos testes: prepara o banco de testes (migrações) e cria os usuários de teste.
export default function globalSetup() {
  for (const command of ["node scripts/banco-de-teste.mjs", "npx tsx tests/e2e/preparar-usuarios.ts"]) {
    const result = spawnSync(command, { stdio: "inherit", shell: true });
    if (result.status !== 0) throw new Error(`Falhou: ${command}`);
  }
}
