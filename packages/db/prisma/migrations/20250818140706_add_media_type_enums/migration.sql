/*
  Warnings:

  - The values [JSON,FORM_ENCODED] on the enum `PayloadFormat` will be removed. If these variants are still used in the database, this will fail.
  - The values [unpublished] on the enum `PostStatus` will be removed. If these variants are still used in the database, this will fail.
  - The `type` column on the `media` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `size` on table `media` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."MediaType" AS ENUM ('image', 'video', 'audio', 'document');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."PayloadFormat_new" AS ENUM ('json', 'discord');
ALTER TABLE "public"."webhook" ALTER COLUMN "format" DROP DEFAULT;
ALTER TABLE "public"."webhook" ALTER COLUMN "format" TYPE "public"."PayloadFormat_new" USING ("format"::text::"public"."PayloadFormat_new");
ALTER TYPE "public"."PayloadFormat" RENAME TO "PayloadFormat_old";
ALTER TYPE "public"."PayloadFormat_new" RENAME TO "PayloadFormat";
DROP TYPE "public"."PayloadFormat_old";
ALTER TABLE "public"."webhook" ALTER COLUMN "format" SET DEFAULT 'json';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."PostStatus_new" AS ENUM ('published', 'draft');
ALTER TABLE "public"."post" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."post" ALTER COLUMN "status" TYPE "public"."PostStatus_new" USING ("status"::text::"public"."PostStatus_new");
ALTER TYPE "public"."PostStatus" RENAME TO "PostStatus_old";
ALTER TYPE "public"."PostStatus_new" RENAME TO "PostStatus";
DROP TYPE "public"."PostStatus_old";
ALTER TABLE "public"."post" ALTER COLUMN "status" SET DEFAULT 'published';
COMMIT;

-- AlterTable
ALTER TABLE "public"."media" DROP COLUMN "type",
ADD COLUMN     "type" "public"."MediaType" NOT NULL DEFAULT 'image',
ALTER COLUMN "size" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."webhook" ALTER COLUMN "format" SET DEFAULT 'json';
