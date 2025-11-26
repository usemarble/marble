-- CreateEnum
CREATE TYPE "ApiKeyType" AS ENUM ('public', 'private');

-- CreateEnum
CREATE TYPE "ApiScope" AS ENUM ('posts_read', 'posts_write', 'authors_read', 'authors_write', 'categories_read', 'categories_write', 'tags_read', 'tags_write', 'media_read', 'media_write');

-- CreateTable
CREATE TABLE "api_key" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "prefix" TEXT,
    "key" TEXT NOT NULL,
    "preview" TEXT NOT NULL,
    "type" "ApiKeyType" NOT NULL DEFAULT 'public',
    "scopes" "ApiScope"[] DEFAULT ARRAY[]::"ApiScope"[],
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastUsed" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_key_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_key_key_key" ON "api_key"("key");

-- CreateIndex
CREATE INDEX "api_key_workspaceId_idx" ON "api_key"("workspaceId");

-- CreateIndex
CREATE INDEX "api_key_workspaceId_createdAt_idx" ON "api_key"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "api_key_workspaceId_enabled_idx" ON "api_key"("workspaceId", "enabled");

-- AddForeignKey
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
