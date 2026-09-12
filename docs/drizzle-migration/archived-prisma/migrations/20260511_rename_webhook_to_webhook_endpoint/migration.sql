-- Rename the enum type (no data change, all existing values are preserved)
ALTER TYPE "WebhookEvent" RENAME TO "WorkspaceEventType";

-- Add the new post_created value to the enum
ALTER TYPE "WorkspaceEventType" ADD VALUE IF NOT EXISTS 'post_created';

-- Rename the table
ALTER TABLE "webhook" RENAME TO "webhook_endpoint";

-- Rename the endpoint column to url
ALTER TABLE "webhook_endpoint" RENAME COLUMN "endpoint" TO "url";
