ALTER TYPE "public"."PostStatus" ADD VALUE 'scheduled';--> statement-breakpoint
CREATE INDEX "post_status_publishedAt_idx" ON "post" USING btree ("status","publishedAt");