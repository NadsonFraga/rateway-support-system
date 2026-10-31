// Cria o .env.local com chaves aleatórias novas.
// Nunca imprime os valores: abra o .env.local para copiá-los ao guardar a cópia de segurança.
import { existsSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const destino = ".env.local";

if (existsSync(destino)) {
  console.error(
    "O arquivo .env.local já existe. Nada foi alterado, para não substituir chaves em uso."
  );
  process.exit(1);
}

const conteudo = `# Segredos locais. NUNCA enviar ao git (protegido pelo .gitignore).
# Descrição de cada variável em .env.example.

# Troque COLE_A_SENHA_AQUI pela senha do usuário "postgres" criada na instalação.
DATABASE_URL=postgresql://postgres:COLE_A_SENHA_AQUI@localhost:5432/support_system_dev

BETTER_AUTH_SECRET=${randomBytes(32).toString("base64")}
BETTER_AUTH_URL=http://localhost:3000

VAULT_ENCRYPTION_KEY_V1=${randomBytes(32).toString("base64")}
VAULT_ACTIVE_KEY_VERSION=1
`;

writeFileSync(destino, conteudo, { encoding: "utf8", flag: "wx" });
console.log("Arquivo .env.local criado com chaves novas (valores não exibidos).");
