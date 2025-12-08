-- CreateEnum
CREATE TYPE "public"."ApiKeyType" AS ENUM ('public', 'private');

-- CreateEnum
CREATE TYPE "public"."ApiScope" AS ENUM ('posts_read', 'posts_write', 'authors_read', 'authors_write', 'categories_read', 'categories_write', 'tags_read', 'tags_write', 'media_read', 'media_write');

-- CreateTable
CREATE TABLE "public"."api_key" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "prefix" TEXT,
    "key" TEXT NOT NULL,
    "preview" TEXT NOT NULL,
    "type" "public"."ApiKeyType" NOT NULL DEFAULT 'public',
    "scopes" "public"."ApiScope"[] DEFAULT ARRAY[]::"public"."ApiScope"[],
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "rateLimitTimeWindow" INTEGER,
    "rateLimitMax" INTEGER,
    "lastRequest" TIMESTAMP(3),
    "lastUsed" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_key_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_key_key_key" ON "public"."api_key"("key");

-- CreateIndex
CREATE INDEX "api_key_workspaceId_idx" ON "public"."api_key"("workspaceId");

-- CreateIndex
CREATE INDEX "api_key_workspaceId_createdAt_idx" ON "public"."api_key"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "api_key_workspaceId_enabled_idx" ON "public"."api_key"("workspaceId", "enabled");

-- CreateIndex
CREATE INDEX "api_key_workspaceId_type_idx" ON "public"."api_key"("workspaceId", "type");

-- CreateIndex
CREATE INDEX "api_key_key_idx" ON "public"."api_key"("key");

-- AddForeignKey
ALTER TABLE "public"."api_key" ADD CONSTRAINT "api_key_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."api_key" ADD CONSTRAINT "api_key_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
