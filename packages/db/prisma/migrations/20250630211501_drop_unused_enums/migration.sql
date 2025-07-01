/*
  Warnings:

  - The values [POST_PUBLISHED,POST_DELETED] on the enum `WebhookEvent` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "WebhookEvent_new" AS ENUM ('post_published', 'post_deleted');
ALTER TABLE "webhook" ALTER COLUMN "event" DROP DEFAULT;
ALTER TABLE "webhook" ALTER COLUMN "event" TYPE "WebhookEvent_new" USING ("event"::text::"WebhookEvent_new");
ALTER TYPE "WebhookEvent" RENAME TO "WebhookEvent_old";
ALTER TYPE "WebhookEvent_new" RENAME TO "WebhookEvent";
DROP TYPE "WebhookEvent_old";
COMMIT;

-- AlterTable
ALTER TABLE "webhook" ALTER COLUMN "event" DROP DEFAULT;

-- DropEnum
DROP TYPE "InviteStatus";
