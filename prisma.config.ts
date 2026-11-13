import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// O Prisma lê o mesmo .env.local que o sistema (segredos nunca vão para o git).
config({ path: ".env.local", quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres",
  },
});
