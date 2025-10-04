-- CreateIndex
CREATE INDEX "session_token_idx" ON "public"."session"("token");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "public"."verification"("identifier");
