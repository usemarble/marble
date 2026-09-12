/*
  Warnings:

  - You are about to drop the column `socials` on the `author` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."author" DROP COLUMN "socials";

-- CreateTable
CREATE TABLE "public"."author_social" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "author_social_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "author_social_authorId_idx" ON "public"."author_social"("authorId");

-- AddForeignKey
ALTER TABLE "public"."author_social" ADD CONSTRAINT "author_social_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."author"("id") ON DELETE CASCADE ON UPDATE CASCADE;
