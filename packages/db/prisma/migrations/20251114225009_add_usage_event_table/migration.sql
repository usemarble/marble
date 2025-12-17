-- CreateEnum
CREATE TYPE "UsageEventType" AS ENUM ('api_request', 'media_upload', 'webhook_delivery');

-- CreateTable
CREATE TABLE "usage_event" (
    "id" TEXT NOT NULL,
    "type" "UsageEventType" NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "endpoint" TEXT,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "usage_event_workspaceId_type_createdAt_idx" ON "usage_event"("workspaceId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "usage_event_workspaceId_createdAt_idx" ON "usage_event"("workspaceId", "createdAt");

-- AddForeignKey
ALTER TABLE "usage_event" ADD CONSTRAINT "usage_event_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
