// Prepara o banco de TESTES: instância de teste e dois usuários com Google Authenticator já configurado.
// Senhas e chaves do autenticador são geradas na hora e ficam só em test-results/ (ignorado pelo git).
import { mkdirSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { config } from "dotenv";
import { testDatabaseUrl } from "../test-database";


import { CREDENTIALS_FILE, type TestUser } from "./test-users";

// Roda via tsx (chamado pelo global-setup), porque o cliente do Prisma 7 é ESM.
async function main() {
  config({ path: ".env.local", quiet: true });
  process.env.DATABASE_URL = testDatabaseUrl();

  const { prisma } = await import("../../src/lib/db");
  const { auth } = await import("../../src/features/auth/auth");
  const { ROLES } = await import("../../src/features/auth/permissions");
  const { symmetricEncrypt } = await import("better-auth/crypto");

  await prisma.editLock.deleteMany();
  await prisma.catalogItem.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.user.deleteMany({ where: { email: { endsWith: "@teste.invalid" } } });
  await prisma.instanceSettings.upsert({
    where: { id: "instancia" },
    update: { name: "Instância de Teste" },
    create: { id: "instancia", name: "Instância de Teste" },
  });
  await prisma.realtimeProbe.upsert({
    where: { id: "teste" },
    update: { text: "" },
    create: { id: "teste", text: "" },
  });

  const context = await auth.$context;
  const users: Record<string, TestUser> = {};
  const people = [
    { key: "admin", name: "Ana Administradora", role: ROLES.administrador },
    { key: "operador", name: "Bruno Operador", role: ROLES.operadorRotina },
    { key: "admin2", name: "Dora Administradora", role: ROLES.administrador },
  ];

  for (const person of people) {
    const email = `${person.key}@teste.invalid`;
    const username = `${person.key}.teste`;
    const password = randomBytes(12).toString("base64url");
    const totpSecret = randomBytes(16).toString("hex");
    const created = await auth.api.createUser({
      body: { email, password, name: person.name, role: person.role, data: { username, mustChangePassword: false } },
    });
    await prisma.twoFactor.create({
      data: {
        id: randomBytes(12).toString("hex"),
        userId: created.user.id,
        secret: await symmetricEncrypt({ key: context.secretConfig, data: totpSecret }),
        backupCodes: await symmetricEncrypt({ key: context.secretConfig, data: "[]" }),
        verified: true,
      },
    });
    await prisma.user.update({ where: { id: created.user.id }, data: { twoFactorEnabled: true } });
    users[person.key] = { username, email, password, name: person.name, totpSecret };
  }

  // Membro recém-criado, ainda no primeiro acesso (senha temporária, sem autenticador).
  const { generateTempPassword, tempPasswordExpiry } = await import("../../src/features/auth/temp-password");
  const tempPassword = generateTempPassword();
  await auth.api.createUser({
    body: {
      email: "novo@teste.invalid",
      password: tempPassword,
      name: "Nina Nova",
      role: ROLES.administrador,
      data: { username: "novo.teste", mustChangePassword: true, tempPasswordExpiresAt: tempPasswordExpiry() },
    },
  });
  users.novo = {
    username: "novo.teste",
    email: "novo@teste.invalid",
    password: tempPassword,
    name: "Nina Nova",
    totpSecret: "",
  };

  mkdirSync("test-results", { recursive: true });
  writeFileSync(CREDENTIALS_FILE, JSON.stringify(users), "utf8");
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Falha ao preparar usuários de teste:", error instanceof Error ? error.message : error);
  process.exit(1);
});
