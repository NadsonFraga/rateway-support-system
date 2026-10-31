import { config } from "dotenv";

/** Endereço do banco de TESTES: mesmo usuário e senha do .env.local, outro nome de banco. */
export function testDatabaseUrl() {
  config({ path: ".env.local", quiet: true });
  const url = new URL(process.env.DATABASE_URL ?? "");
  url.pathname = "/support_system_test";
  return url.toString();
}
