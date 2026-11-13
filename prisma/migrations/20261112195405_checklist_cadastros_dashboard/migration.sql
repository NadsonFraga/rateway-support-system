-- CreateTable
CREATE TABLE "client_checklists" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'rascunho',
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB NOT NULL DEFAULT '{}',
    "fieldMeta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_deployments" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "catalogItemId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'a_cadastrar',
    "bottleneck" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "deadline" DATE,
    "notes" TEXT,
    "liveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_deployments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instance_notices" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instance_notices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instance_notice_reads" (
    "noticeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instance_notice_reads_pkey" PRIMARY KEY ("noticeId","userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_checklists_clientId_key" ON "client_checklists"("clientId");

-- CreateIndex
CREATE INDEX "client_checklists_status_idx" ON "client_checklists"("status");

-- CreateIndex
CREATE INDEX "channel_deployments_clientId_idx" ON "channel_deployments"("clientId");

-- CreateIndex
CREATE INDEX "channel_deployments_status_idx" ON "channel_deployments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "channel_deployments_clientId_catalogItemId_key" ON "channel_deployments"("clientId", "catalogItemId");

-- CreateIndex
CREATE INDEX "instance_notices_createdAt_idx" ON "instance_notices"("createdAt");

-- CreateIndex
CREATE INDEX "instance_notice_reads_userId_idx" ON "instance_notice_reads"("userId");

-- AddForeignKey
ALTER TABLE "client_checklists" ADD CONSTRAINT "client_checklists_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_deployments" ADD CONSTRAINT "channel_deployments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_deployments" ADD CONSTRAINT "channel_deployments_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "catalog_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instance_notices" ADD CONSTRAINT "instance_notices_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instance_notice_reads" ADD CONSTRAINT "instance_notice_reads_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "instance_notices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instance_notice_reads" ADD CONSTRAINT "instance_notice_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
