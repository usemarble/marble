-- AlterTable
ALTER TABLE "public"."post" ADD COLUMN     "newPrimaryAuthorId" TEXT;

-- CreateTable
CREATE TABLE "public"."author" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "bio" TEXT,
    "image" TEXT,
    "role" TEXT,
    "slug" TEXT NOT NULL,
    "socials" JSONB,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "author_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_PostToAuthor" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PostToAuthor_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "author_workspaceId_userId_key" ON "public"."author"("workspaceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "author_workspaceId_slug_key" ON "public"."author"("workspaceId", "slug");

-- CreateIndex
CREATE INDEX "_PostToAuthor_B_index" ON "public"."_PostToAuthor"("B");

-- AddForeignKey
ALTER TABLE "public"."post" ADD CONSTRAINT "post_newPrimaryAuthorId_fkey" FOREIGN KEY ("newPrimaryAuthorId") REFERENCES "public"."author"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."author" ADD CONSTRAINT "author_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."author" ADD CONSTRAINT "author_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_PostToAuthor" ADD CONSTRAINT "_PostToAuthor_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."author"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_PostToAuthor" ADD CONSTRAINT "_PostToAuthor_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
