-- DropForeignKey
ALTER TABLE "public"."post" DROP CONSTRAINT "post_primaryAuthorId_fkey";

-- AlterTable
ALTER TABLE "public"."post" ALTER COLUMN "primaryAuthorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."post" ADD CONSTRAINT "post_primaryAuthorId_fkey" FOREIGN KEY ("primaryAuthorId") REFERENCES "public"."author"("id") ON DELETE SET NULL ON UPDATE CASCADE;
