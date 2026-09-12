/*
  Warnings:

  - Made the column `newPrimaryAuthorId` on table `post` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."post" DROP CONSTRAINT "post_newPrimaryAuthorId_fkey";

-- AlterTable
ALTER TABLE "public"."post" ALTER COLUMN "newPrimaryAuthorId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."post" ADD CONSTRAINT "post_newPrimaryAuthorId_fkey" FOREIGN KEY ("newPrimaryAuthorId") REFERENCES "public"."author"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
