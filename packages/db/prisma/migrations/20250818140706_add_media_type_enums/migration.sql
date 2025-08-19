-- CreateEnum
CREATE TYPE "public"."MediaType" AS ENUM ('image', 'video', 'audio', 'document');

-- AlterEnum: PayloadFormat
-- Step 1: Create the new enum type
CREATE TYPE "public"."PayloadFormat_new" AS ENUM ('json', 'discord');
-- Step 2: Add a new temporary column
ALTER TABLE "public"."webhook" ADD COLUMN "format_new" "public"."PayloadFormat_new";
-- Step 3: Populate the new column using multiple simple UPDATEs
UPDATE "public"."webhook" SET "format_new" = 'json'::"public"."PayloadFormat_new" WHERE "format"::text = 'JSON';
UPDATE "public"."webhook" SET "format_new" = 'discord'::"public"."PayloadFormat_new" WHERE "format"::text = 'FORM_ENCODED';
UPDATE "public"."webhook" SET "format_new" = 'json'::"public"."PayloadFormat_new" WHERE "format_new" IS NULL;
-- Step 4: Drop the old column and rename the new one
ALTER TABLE "public"."webhook" DROP COLUMN "format";
ALTER TABLE "public"."webhook" RENAME COLUMN "format_new" TO "format";
-- Step 5: Clean up enum types
ALTER TYPE "public"."PayloadFormat" RENAME TO "PayloadFormat_old";
ALTER TYPE "public"."PayloadFormat_new" RENAME TO "PayloadFormat";
DROP TYPE "public"."PayloadFormat_old";
-- Step 6: Add the default value
ALTER TABLE "public"."webhook" ALTER COLUMN "format" SET DEFAULT 'json';


-- AlterEnum: PostStatus
-- Step 1: Create the new enum type
CREATE TYPE "public"."PostStatus_new" AS ENUM ('published', 'draft');
-- Step 2: Add a new temporary column
ALTER TABLE "public"."post" ADD COLUMN "status_new" "public"."PostStatus_new";
-- Step 3: Populate the new column using multiple simple UPDATEs
UPDATE "public"."post" SET "status_new" = 'published'::"public"."PostStatus_new" WHERE "status"::text = 'published';
UPDATE "public"."post" SET "status_new" = 'draft'::"public"."PostStatus_new" WHERE "status"::text = 'unpublished';
UPDATE "public"."post" SET "status_new" = 'draft'::"public"."PostStatus_new" WHERE "status"::text = 'draft';
UPDATE "public"."post" SET "status_new" = 'published'::"public"."PostStatus_new" WHERE "status_new" IS NULL;
-- Step 4: Drop the old column and rename the new one
ALTER TABLE "public"."post" DROP COLUMN "status";
ALTER TABLE "public"."post" RENAME COLUMN "status_new" TO "status";
-- Step 5: Clean up enum types
ALTER TYPE "public"."PostStatus" RENAME TO "PostStatus_old";
ALTER TYPE "public"."PostStatus_new" RENAME TO "PostStatus";
DROP TYPE "public"."PostStatus_old";
-- Step 6: Add the default value
ALTER TABLE "public"."post" ALTER COLUMN "status" SET DEFAULT 'published';


-- AlterTable: media
-- Step 1: Add the new column with the correct enum type
ALTER TABLE "public"."media" ADD COLUMN "type_new" "public"."MediaType";
-- Step 2: Populate the new column using multiple simple UPDATEs
UPDATE "public"."media" SET "type_new" = 'image'::"public"."MediaType" WHERE "type"::text = 'image';
UPDATE "public"."media" SET "type_new" = 'video'::"public"."MediaType" WHERE "type"::text = 'video';
UPDATE "public"."media" SET "type_new" = 'audio'::"public"."MediaType" WHERE "type"::text = 'audio';
UPDATE "public"."media" SET "type_new" = 'document'::"public"."MediaType" WHERE "type"::text = 'document';
UPDATE "public"."media" SET "type_new" = 'image'::"public"."MediaType" WHERE "type_new" IS NULL;
-- Step 3: Drop the old 'type' column and rename the new one
ALTER TABLE "public"."media" DROP COLUMN "type";
ALTER TABLE "public"."media" RENAME COLUMN "type_new" TO "type";
-- Step 4: Enforce NOT NULL and set a default
ALTER TABLE "public"."media" ALTER COLUMN "type" SET NOT NULL;
ALTER TABLE "public"."media" ALTER COLUMN "type" SET DEFAULT 'image';
-- Step 5: Backfill NULL sizes before enforcing NOT NULL
UPDATE "public"."media" SET "size" = 0 WHERE "size" IS NULL;
ALTER TABLE "public"."media" ALTER COLUMN "size" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."webhook" ALTER COLUMN "format" SET DEFAULT 'json';
