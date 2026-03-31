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

-- AddForeignKey
ALTER TABLE "public"."field_option" ADD CONSTRAINT "field_option_fieldId_workspaceId_fkey" FOREIGN KEY ("fieldId", "workspaceId") REFERENCES "public"."field"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."field_option" ADD CONSTRAINT "field_option_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
