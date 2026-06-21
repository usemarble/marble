-- CreateEnum
CREATE TYPE "ExportJobStatus" AS ENUM ('queued', 'processing', 'ready', 'failed', 'expired');

-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('json', 'markdown');

-- CreateEnum
CREATE TYPE "ImportSource" AS ENUM ('file', 'url');

-- CreateEnum
CREATE TYPE "ImportJobStatus" AS ENUM ('queued', 'discovering', 'processing', 'review', 'importing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "ImportFormat" AS ENUM ('markdown', 'json', 'wordpress');

-- CreateEnum
CREATE TYPE "ImportItemStatus" AS ENUM ('pending', 'ready', 'needs_review', 'skipped', 'imported', 'failed');

-- CreateTable
CREATE TABLE "export_job" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "status" "ExportJobStatus" NOT NULL DEFAULT 'queued',
    "format" "ExportFormat" NOT NULL DEFAULT 'json',
    "scope" JSONB NOT NULL,
    "storageKey" TEXT,
    "fileSize" INTEGER,
    "downloadTokenHash" TEXT,
    "expiresAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "emailSentAt" TIMESTAMP(3),
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "export_job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_job" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "source" "ImportSource" NOT NULL,
    "status" "ImportJobStatus" NOT NULL DEFAULT 'queued',
    "format" "ImportFormat",
    "sourceUrl" TEXT,
    "uploadKey" TEXT,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "readyItems" INTEGER NOT NULL DEFAULT 0,
    "errorItems" INTEGER NOT NULL DEFAULT 0,
    "importedItems" INTEGER NOT NULL DEFAULT 0,
    "mapping" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_item" (
    "id" TEXT NOT NULL,
    "importJobId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "status" "ImportItemStatus" NOT NULL DEFAULT 'pending',
    "sourceRef" TEXT,
    "title" TEXT,
    "slug" TEXT,
    "content" TEXT,
    "contentJson" JSONB,
    "description" TEXT,
    "coverImage" TEXT,
    "rawCategory" TEXT,
    "rawTags" JSONB,
    "rawAuthor" TEXT,
    "resolvedCategoryId" TEXT,
    "resolvedTagIds" JSONB,
    "postId" TEXT,
    "errors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "export_job_workspaceId_status_idx" ON "export_job"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "export_job_workspaceId_createdAt_idx" ON "export_job"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "export_job_expiresAt_idx" ON "export_job"("expiresAt");

-- CreateIndex
CREATE INDEX "import_job_workspaceId_status_idx" ON "import_job"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "import_job_workspaceId_createdAt_idx" ON "import_job"("workspaceId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "import_job_id_workspaceId_key" ON "import_job"("id", "workspaceId");

-- CreateIndex
CREATE INDEX "import_item_importJobId_status_idx" ON "import_item"("importJobId", "status");

-- CreateIndex
CREATE INDEX "import_item_workspaceId_idx" ON "import_item"("workspaceId");

-- AddForeignKey
ALTER TABLE "export_job" ADD CONSTRAINT "export_job_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_job" ADD CONSTRAINT "export_job_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_job" ADD CONSTRAINT "import_job_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_job" ADD CONSTRAINT "import_job_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_item" ADD CONSTRAINT "import_item_importJobId_workspaceId_fkey" FOREIGN KEY ("importJobId", "workspaceId") REFERENCES "import_job"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_item" ADD CONSTRAINT "import_item_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
