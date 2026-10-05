ALTER TABLE "workspace_event" ADD COLUMN "enqueuedAt" timestamp (3);--> statement-breakpoint
-- Every existing row predates the outbox. Mark it enqueued so the sweep only
-- looks at events written from now on: re-sending the history would fire old
-- webhooks again, including the events stranded between Sep 12 and Sep 29.
UPDATE "workspace_event" SET "enqueuedAt" = "createdAt";--> statement-breakpoint
CREATE INDEX "workspace_event_unenqueued_idx" ON "workspace_event" USING btree ("createdAt" timestamp_ops) WHERE "workspace_event"."enqueuedAt" is null;
