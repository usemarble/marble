-- CreateIndex
CREATE INDEX "account_userId_idx" ON "public"."account"("userId");

-- CreateIndex
CREATE INDEX "account_providerId_accountId_idx" ON "public"."account"("providerId", "accountId");

-- CreateIndex
CREATE INDEX "author_workspaceId_isActive_idx" ON "public"."author"("workspaceId", "isActive");

-- CreateIndex
CREATE INDEX "author_userId_idx" ON "public"."author"("userId");

-- CreateIndex
CREATE INDEX "category_workspaceId_idx" ON "public"."category"("workspaceId");

-- CreateIndex
CREATE INDEX "invitation_organizationId_idx" ON "public"."invitation"("organizationId");

-- CreateIndex
CREATE INDEX "invitation_email_idx" ON "public"."invitation"("email");

-- CreateIndex
CREATE INDEX "invitation_inviterId_idx" ON "public"."invitation"("inviterId");

-- CreateIndex
CREATE INDEX "media_workspaceId_createdAt_idx" ON "public"."media"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "media_workspaceId_type_idx" ON "public"."media"("workspaceId", "type");

-- CreateIndex
CREATE INDEX "member_userId_idx" ON "public"."member"("userId");

-- CreateIndex
CREATE INDEX "member_organizationId_idx" ON "public"."member"("organizationId");

-- CreateIndex
CREATE INDEX "member_organizationId_userId_idx" ON "public"."member"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "post_workspaceId_status_idx" ON "public"."post"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "post_workspaceId_createdAt_idx" ON "public"."post"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "post_workspaceId_status_publishedAt_idx" ON "public"."post"("workspaceId", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "post_categoryId_idx" ON "public"."post"("categoryId");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "public"."session"("userId");

-- CreateIndex
CREATE INDEX "session_activeOrganizationId_idx" ON "public"."session"("activeOrganizationId");

-- CreateIndex
CREATE INDEX "subscription_userId_idx" ON "public"."subscription"("userId");

-- CreateIndex
CREATE INDEX "subscription_status_idx" ON "public"."subscription"("status");

-- CreateIndex
CREATE INDEX "tag_workspaceId_idx" ON "public"."tag"("workspaceId");

-- CreateIndex
CREATE INDEX "webhook_workspaceId_idx" ON "public"."webhook"("workspaceId");

-- CreateIndex
CREATE INDEX "webhook_workspaceId_enabled_idx" ON "public"."webhook"("workspaceId", "enabled");
