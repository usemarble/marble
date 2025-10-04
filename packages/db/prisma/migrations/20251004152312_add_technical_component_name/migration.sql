/*
  Warnings:

  - Added the required column `technicalName` to the `custom_component` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."custom_component" ADD COLUMN     "technicalName" TEXT NOT NULL;
