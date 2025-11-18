-- AlterEnum
ALTER TYPE "WebhookEvent" ADD VALUE 'media_updated';

-- AlterTable
ALTER TABLE "media" ADD COLUMN     "alt" TEXT;
