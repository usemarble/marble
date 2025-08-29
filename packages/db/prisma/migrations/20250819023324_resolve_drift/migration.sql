/*
  Warnings:

  - Made the column `status` on table `post` required. This step will fail if there are existing NULL values in that column.
  - Made the column `format` on table `webhook` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "post" ALTER COLUMN "status" SET NOT NULL;

-- AlterTable
ALTER TABLE "webhook" ALTER COLUMN "format" SET NOT NULL;
