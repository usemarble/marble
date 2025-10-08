-- CreateTable
CREATE TABLE "public"."component_instance" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "customComponentId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "component_instance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "component_instance_postId_idx" ON "public"."component_instance"("postId");

-- CreateIndex
CREATE INDEX "component_instance_customComponentId_idx" ON "public"."component_instance"("customComponentId");

-- AddForeignKey
ALTER TABLE "public"."component_instance" ADD CONSTRAINT "component_instance_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."component_instance" ADD CONSTRAINT "component_instance_customComponentId_fkey" FOREIGN KEY ("customComponentId") REFERENCES "public"."custom_component"("id") ON DELETE CASCADE ON UPDATE CASCADE;
