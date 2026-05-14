-- CreateEnum
CREATE TYPE "WorkspaceEventSource" AS ENUM ('dashboard', 'api', 'mcp', 'workflow', 'system');

-- CreateEnum
CREATE TYPE "WorkspaceEventActorType" AS ENUM ('user', 'api_key', 'mcp', 'system');

-- CreateEnum
CREATE TYPE "WorkspaceEventResourceType" AS ENUM ('post', 'category', 'tag', 'media', 'author', 'workspace');

-- CreateEnum
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('pending', 'sending', 'success', 'retrying', 'failed');

-- CreateEnum
CREATE TYPE "UsageAlertKind" AS ENUM ('warning', 'critical', 'exhausted');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "WorkspaceEventType" ADD VALUE 'post_unpublished';
ALTER TYPE "WorkspaceEventType" ADD VALUE 'author_created';
ALTER TYPE "WorkspaceEventType" ADD VALUE 'author_updated';
ALTER TYPE "WorkspaceEventType" ADD VALUE 'author_deleted';

-- AlterTable
ALTER TABLE "webhook_endpoint" RENAME CONSTRAINT "webhook_pkey" TO "webhook_endpoint_pkey";

-- CreateTable
CREATE TABLE "usage_alert" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "type" "UsageEventType" NOT NULL,
    "kind" "UsageAlertKind" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "emailSentTo" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_event" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "type" "WorkspaceEventType" NOT NULL,
    "source" "WorkspaceEventSource" NOT NULL DEFAULT 'dashboard',
    "resourceType" "WorkspaceEventResourceType",
    "resourceId" TEXT,
    "actorType" "WorkspaceEventActorType",
    "actorId" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_delivery" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "webhookEndpointId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" "WebhookDeliveryStatus" NOT NULL DEFAULT 'pending',
    "isTest" BOOLEAN NOT NULL DEFAULT false,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "nextRetryAt" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_delivery_attempt" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "statusCode" INTEGER,
    "responseBody" TEXT,
    "errorMessage" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_delivery_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "usage_alert_workspaceId_type_periodStart_periodEnd_idx" ON "usage_alert"("workspaceId", "type", "periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "usage_alert_workspaceId_type_kind_periodStart_periodEnd_key" ON "usage_alert"("workspaceId", "type", "kind", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "workspace_event_workspaceId_createdAt_idx" ON "workspace_event"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "workspace_event_workspaceId_type_idx" ON "workspace_event"("workspaceId", "type");

-- CreateIndex
CREATE INDEX "workspace_event_workspaceId_resourceType_resourceId_idx" ON "workspace_event"("workspaceId", "resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "workspace_event_workspaceId_processedAt_idx" ON "workspace_event"("workspaceId", "processedAt");

-- CreateIndex
CREATE INDEX "webhook_delivery_eventId_idx" ON "webhook_delivery"("eventId");

-- CreateIndex
CREATE INDEX "webhook_delivery_workspaceId_status_idx" ON "webhook_delivery"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "webhook_delivery_workspaceId_createdAt_idx" ON "webhook_delivery"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "webhook_delivery_webhookEndpointId_idx" ON "webhook_delivery"("webhookEndpointId");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_delivery_eventId_webhookEndpointId_key" ON "webhook_delivery"("eventId", "webhookEndpointId");

-- CreateIndex
CREATE INDEX "webhook_delivery_attempt_deliveryId_idx" ON "webhook_delivery_attempt"("deliveryId");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_delivery_attempt_deliveryId_attemptNumber_key" ON "webhook_delivery_attempt"("deliveryId", "attemptNumber");

-- RenameForeignKey
ALTER TABLE "webhook_endpoint" RENAME CONSTRAINT "webhook_workspaceId_fkey" TO "webhook_endpoint_workspaceId_fkey";

-- AddForeignKey
ALTER TABLE "usage_alert" ADD CONSTRAINT "usage_alert_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_event" ADD CONSTRAINT "workspace_event_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_delivery" ADD CONSTRAINT "webhook_delivery_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "workspace_event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_delivery" ADD CONSTRAINT "webhook_delivery_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_delivery" ADD CONSTRAINT "webhook_delivery_webhookEndpointId_fkey" FOREIGN KEY ("webhookEndpointId") REFERENCES "webhook_endpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_delivery_attempt" ADD CONSTRAINT "webhook_delivery_attempt_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "webhook_delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "webhook_workspaceId_enabled_idx" RENAME TO "webhook_endpoint_workspaceId_enabled_idx";

-- RenameIndex
ALTER INDEX "webhook_workspaceId_idx" RENAME TO "webhook_endpoint_workspaceId_idx";
