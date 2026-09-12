/*
  Warnings:

  - Made the column `publishedAt` on table `post` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."post" ALTER COLUMN "publishedAt" SET NOT NULL;
