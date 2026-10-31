-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "displayCode" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "city" TEXT,
    "state" TEXT,
    "website" TEXT,
    "channelManagerId" TEXT,
    "pmsId" TEXT,
    "contactType" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactLink" TEXT,
    "financeName" TEXT,
    "financePhone" TEXT,
    "notice" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_services" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "billingDay" INTEGER,
    "dueDate" DATE,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vault_credentials" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "catalogItemId" TEXT NOT NULL,
    "label" TEXT,
    "propertyId" TEXT,
    "username" JSONB NOT NULL,
    "password" JSONB NOT NULL,
    "extranetUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vault_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_displayCode_key" ON "clients"("displayCode");

-- CreateIndex
CREATE INDEX "clients_name_idx" ON "clients"("name");

-- CreateIndex
CREATE INDEX "client_services_clientId_idx" ON "client_services"("clientId");

-- CreateIndex
CREATE INDEX "vault_credentials_clientId_idx" ON "vault_credentials"("clientId");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_channelManagerId_fkey" FOREIGN KEY ("channelManagerId") REFERENCES "catalog_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_pmsId_fkey" FOREIGN KEY ("pmsId") REFERENCES "catalog_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_services" ADD CONSTRAINT "client_services_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_services" ADD CONSTRAINT "client_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vault_credentials" ADD CONSTRAINT "vault_credentials_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vault_credentials" ADD CONSTRAINT "vault_credentials_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "catalog_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

