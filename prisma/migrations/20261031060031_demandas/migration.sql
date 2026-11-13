
-- AlterTable
ALTER TABLE "catalog_items" ADD COLUMN     "companyAccount" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "vault_credentials" ALTER COLUMN "username" DROP NOT NULL,
ALTER COLUMN "password" DROP NOT NULL;

-- CreateTable
CREATE TABLE "catalog_item_categories" (
    "itemId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "catalog_item_categories_pkey" PRIMARY KEY ("itemId","category")
);

-- Copia a categoria e a ordem atuais de cada item para a nova tabela (D-103), sem perder nada.
INSERT INTO "catalog_item_categories" ("itemId", "category", "position")
SELECT "id", "category", "position" FROM "catalog_items";

-- DropIndex
DROP INDEX "catalog_items_category_position_idx";

-- AlterTable
ALTER TABLE "catalog_items" DROP COLUMN "category",
DROP COLUMN "position";

-- CreateTable
CREATE TABLE "demands" (
    "id" TEXT NOT NULL,
    "displayCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" JSONB,
    "status" TEXT NOT NULL DEFAULT 'a_fazer',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "dueDate" DATE,
    "dueTime" TEXT,
    "clientId" TEXT,
    "platformId" TEXT,
    "requireAllConfirm" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demand_assignees" (
    "demandId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "demand_assignees_pkey" PRIMARY KEY ("demandId","userId")
);

-- CreateTable
CREATE TABLE "demand_subtasks" (
    "id" TEXT NOT NULL,
    "demandId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "demand_subtasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demand_attachments" (
    "id" TEXT NOT NULL,
    "demandId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT,
    "addedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demand_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demand_events" (
    "id" TEXT NOT NULL,
    "demandId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" JSONB,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demand_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "catalog_item_categories_category_position_idx" ON "catalog_item_categories"("category", "position");

-- CreateIndex
CREATE UNIQUE INDEX "demands_displayCode_key" ON "demands"("displayCode");

-- CreateIndex
CREATE INDEX "demands_status_idx" ON "demands"("status");

-- CreateIndex
CREATE INDEX "demands_clientId_idx" ON "demands"("clientId");

-- CreateIndex
CREATE INDEX "demand_assignees_userId_idx" ON "demand_assignees"("userId");

-- CreateIndex
CREATE INDEX "demand_subtasks_demandId_idx" ON "demand_subtasks"("demandId");

-- CreateIndex
CREATE INDEX "demand_attachments_demandId_idx" ON "demand_attachments"("demandId");

-- CreateIndex
CREATE INDEX "demand_events_demandId_createdAt_idx" ON "demand_events"("demandId", "createdAt");

-- AddForeignKey
ALTER TABLE "catalog_item_categories" ADD CONSTRAINT "catalog_item_categories_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "catalog_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demands" ADD CONSTRAINT "demands_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demands" ADD CONSTRAINT "demands_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "catalog_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demands" ADD CONSTRAINT "demands_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demands" ADD CONSTRAINT "demands_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_assignees" ADD CONSTRAINT "demand_assignees_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "demands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_assignees" ADD CONSTRAINT "demand_assignees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_subtasks" ADD CONSTRAINT "demand_subtasks_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "demands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_attachments" ADD CONSTRAINT "demand_attachments_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "demands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_attachments" ADD CONSTRAINT "demand_attachments_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_events" ADD CONSTRAINT "demand_events_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "demands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_events" ADD CONSTRAINT "demand_events_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

