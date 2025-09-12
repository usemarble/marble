-- CreateEnum
CREATE TYPE "public"."PropertyType" AS ENUM ('string', 'number', 'boolean', 'date', 'email', 'url', 'textarea', 'select');

-- CreateTable
CREATE TABLE "public"."custom_component" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_component_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."component_property" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."PropertyType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" TEXT,
    "customComponentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "component_property_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "custom_component_workspaceId_name_key" ON "public"."custom_component"("workspaceId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "component_property_customComponentId_name_key" ON "public"."component_property"("customComponentId", "name");

-- AddForeignKey
ALTER TABLE "public"."custom_component" ADD CONSTRAINT "custom_component_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."component_property" ADD CONSTRAINT "component_property_customComponentId_fkey" FOREIGN KEY ("customComponentId") REFERENCES "public"."custom_component"("id") ON DELETE CASCADE ON UPDATE CASCADE;
