-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN     "billingMessageTemplate" TEXT NOT NULL DEFAULT 'Olá, {{contato_financeiro.nome}}. Lembrete: a cobrança de {{servico}} do {{cliente.nome}} vence em {{vencimento}}. Qualquer dúvida, estamos à disposição. Equipe {{instancia.nome}}';

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_items" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "extranetUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "phases" TEXT[],
    "position" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "catalog_items_category_position_idx" ON "catalog_items"("category", "position");


-- Serviços padrão (D-15, D-17, D-27): regras do produto, não nomes de cliente.
INSERT INTO "services" ("id", "name", "kind", "phases", "position", "updatedAt") VALUES
  ('assessoria', 'Assessoria', 'continuo', ARRAY['Implantação', 'Em Operação', 'Pausado', 'Cancelado'], 1, CURRENT_TIMESTAMP),
  ('central_reservas', 'Central de Reservas', 'continuo', ARRAY['Implantação', 'Em Operação', 'Pausado', 'Cancelado'], 2, CURRENT_TIMESTAMP),
  ('cadastro_revisao', 'Cadastro/Revisão', 'pontual', ARRAY['Checklist', 'Em Execução', 'Entrega', 'Concluído'], 3, CURRENT_TIMESTAMP),
  ('consultoria', 'Consultoria', 'pontual', ARRAY['Em Andamento', 'Concluída'], 4, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
