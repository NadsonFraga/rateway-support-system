import { spawnSync } from "node:child_process";

// Antes dos testes de unidade: aplica as migrações no banco de testes.
export default function setup() {
  const result = spawnSync("node scripts/banco-de-teste.mjs", { stdio: "inherit", shell: true });
  if (result.status !== 0) throw new Error("Falha ao preparar o banco de testes.");
}
