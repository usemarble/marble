/*
  Warnings:

  - A unique constraint covering the columns `[id,workspaceId]` on the table `post` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."FieldType" AS ENUM ('text', 'number', 'boolean', 'date', 'richtext', 'select', 'multiselect');

-- CreateTable
CREATE TABLE "public"."field" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."FieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."field_option" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."field_value" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_value_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "field_workspaceId_idx" ON "public"."field"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "field_workspaceId_key_key" ON "public"."field"("workspaceId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "field_id_workspaceId_key" ON "public"."field"("id", "workspaceId");

-- CreateIndex
CREATE INDEX "field_option_fieldId_idx" ON "public"."field_option"("fieldId");

-- CreateIndex
CREATE INDEX "field_option_workspaceId_idx" ON "public"."field_option"("workspaceId");

-- CreateIndex
CREATE INDEX "field_option_fieldId_position_idx" ON "public"."field_option"("fieldId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "field_option_fieldId_value_key" ON "public"."field_option"("fieldId", "value");

-- CreateIndex
CREATE UNIQUE INDEX "field_option_id_workspaceId_key" ON "public"."field_option"("id", "workspaceId");

-- CreateIndex
CREATE INDEX "field_value_postId_idx" ON "public"."field_value"("postId");

-- CreateIndex
CREATE INDEX "field_value_fieldId_idx" ON "public"."field_value"("fieldId");

-- CreateIndex
CREATE INDEX "field_value_workspaceId_idx" ON "public"."field_value"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "field_value_postId_fieldId_key" ON "public"."field_value"("postId", "fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "post_id_workspaceId_key" ON "public"."post"("id", "workspaceId");

-- AddForeignKey
ALTER TABLE "public"."field" ADD CONSTRAINT "field_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."field_option" ADD CONSTRAINT "field_option_fieldId_workspaceId_fkey" FOREIGN KEY ("fieldId", "workspaceId") REFERENCES "public"."field"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."field_option" ADD CONSTRAINT "field_option_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."field_value" ADD CONSTRAINT "field_value_postId_workspaceId_fkey" FOREIGN KEY ("postId", "workspaceId") REFERENCES "public"."post"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."field_value" ADD CONSTRAINT "field_value_fieldId_workspaceId_fkey" FOREIGN KEY ("fieldId", "workspaceId") REFERENCES "public"."field"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."field_value" ADD CONSTRAINT "field_value_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
