/*
  Warnings:

  - You are about to drop the column `primaryAuthorId` on the `post` table. All the data in the column will be lost.
  - You are about to drop the `_PostToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."_PostToUser" DROP CONSTRAINT "_PostToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_PostToUser" DROP CONSTRAINT "_PostToUser_B_fkey";

-- DropForeignKey
ALTER TABLE "public"."post" DROP CONSTRAINT "post_primaryAuthorId_fkey";

-- AlterTable
ALTER TABLE "public"."post" DROP COLUMN "primaryAuthorId";

-- DropTable
DROP TABLE "public"."_PostToUser";
