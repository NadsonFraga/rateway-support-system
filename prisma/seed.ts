// Semente inicial: cria a instância e o primeiro Administrador.
// Uso: npm run semente -- --instancia "Nome da plataforma" --nome "Seu nome" --email voce@empresa.com
// A senha temporária aparece só neste terminal (não fica salva em lugar nenhum além do banco, cifrada).
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";

config({ path: ".env.local", quiet: true });

const { values } = parseArgs({
  options: {
    instancia: { type: "string" },
    nome: { type: "string" },
    email: { type: "string" },
    // Alternativa para nomes com acento no Windows: um JSON com { instancia, nome, email } em UTF-8.
    dados: { type: "string" },
  },
});

async function main() {
  const fromFile = values.dados
    ? (JSON.parse(readFileSync(values.dados, "utf8")) as { instancia?: string; nome?: string; email?: string })
    : {};
  const instanceName = (fromFile.instancia ?? values.instancia)?.trim();
  const adminName = (fromFile.nome ?? values.nome)?.trim();
  const adminEmail = (fromFile.email ?? values.email)?.trim().toLowerCase();

  if (!instanceName || !adminName || !adminEmail) {
    console.error('Informe os três dados: --instancia "Nome" --nome "Seu nome" --email voce@empresa.com');
    process.exit(1);
  }

  // Importa depois do dotenv, para o banco e o login lerem o .env.local.
  const { prisma } = await import("@/lib/db");
  const { auth } = await import("@/features/auth/auth");
  const { ROLES } = await import("@/features/auth/permissions");
  const { generateTempPassword, tempPasswordExpiry } = await import("@/features/auth/temp-password");

  await prisma.instanceSettings.upsert({
    where: { id: "instancia" },
    update: { name: instanceName },
    create: { id: "instancia", name: instanceName },
  });
  await prisma.realtimeProbe.upsert({ where: { id: "teste" }, update: {}, create: { id: "teste" } });

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log(`Já existe um usuário com o e-mail ${adminEmail}. Nada foi alterado no usuário.`);
    await prisma.$disconnect();
    return;
  }

  const tempPassword = generateTempPassword();
  await auth.api.createUser({
    body: {
      email: adminEmail,
      name: adminName,
      password: tempPassword,
      role: ROLES.administrador,
      data: { mustChangePassword: true, tempPasswordExpiresAt: tempPasswordExpiry() },
    },
  });

  console.log("");
  console.log(`Instância: ${instanceName}`);
  console.log(`Administrador criado: ${adminName} <${adminEmail}>`);
  console.log("");
  console.log(`Senha temporária (válida por 48h): ${tempPassword}`);
  console.log("Esta senha só aparece agora. No primeiro acesso o sistema pede uma senha nova e o Google Authenticator.");
  console.log("");

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("A semente falhou:", error instanceof Error ? error.message : error);
  process.exit(1);
});
