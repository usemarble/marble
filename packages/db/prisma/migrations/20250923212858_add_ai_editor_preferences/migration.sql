-- CreateTable
CREATE TABLE "public"."editor_preferences" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,

    CONSTRAINT "editor_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "editorPreferencesId" TEXT NOT NULL,

    CONSTRAINT "ai_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "editor_preferences_workspaceId_key" ON "public"."editor_preferences"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_editorPreferencesId_key" ON "public"."ai"("editorPreferencesId");

-- AddForeignKey
ALTER TABLE "public"."editor_preferences" ADD CONSTRAINT "editor_preferences_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai" ADD CONSTRAINT "ai_editorPreferencesId_fkey" FOREIGN KEY ("editorPreferencesId") REFERENCES "public"."editor_preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;
