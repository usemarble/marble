-- CreateTable
CREATE TABLE "public"."brand_knowledge_website" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" JSONB NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_knowledge_website_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "brand_knowledge_website_workspaceId_idx" ON "public"."brand_knowledge_website"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "brand_knowledge_website_workspaceId_url_key" ON "public"."brand_knowledge_website"("workspaceId", "url");

-- AddForeignKey
ALTER TABLE "public"."brand_knowledge_website" ADD CONSTRAINT "brand_knowledge_website_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
