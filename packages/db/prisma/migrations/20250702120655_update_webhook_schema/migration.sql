/*
  Warnings:

  - You are about to drop the column `event` on the `webhook` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PayloadFormat" AS ENUM ('JSON', 'FORM_ENCODED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "WebhookEvent" ADD VALUE 'post_updated';
ALTER TYPE "WebhookEvent" ADD VALUE 'category_created';
ALTER TYPE "WebhookEvent" ADD VALUE 'category_updated';
ALTER TYPE "WebhookEvent" ADD VALUE 'category_deleted';
ALTER TYPE "WebhookEvent" ADD VALUE 'tag_created';
ALTER TYPE "WebhookEvent" ADD VALUE 'tag_updated';
ALTER TYPE "WebhookEvent" ADD VALUE 'tag_deleted';
ALTER TYPE "WebhookEvent" ADD VALUE 'media_uploaded';
ALTER TYPE "WebhookEvent" ADD VALUE 'media_deleted';

-- AlterTable
ALTER TABLE "webhook" DROP COLUMN "event",
ADD COLUMN     "events" "WebhookEvent"[],
ADD COLUMN     "format" "PayloadFormat" NOT NULL DEFAULT 'JSON';
