CREATE TABLE "webhook_notification" (
	"id" text PRIMARY KEY NOT NULL,
	"webhookEndpointId" text NOT NULL,
	"workspaceId" text NOT NULL,
	"incidentId" text NOT NULL,
	"kind" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payload" jsonb NOT NULL,
	"recipientEmails" text[] NOT NULL,
	"attemptCount" integer DEFAULT 0 NOT NULL,
	"nextAttemptAt" timestamp (3) DEFAULT now() NOT NULL,
	"claimedAt" timestamp (3),
	"sentAt" timestamp (3),
	"lastError" text,
	"createdAt" timestamp (3) NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "webhook_endpoint" ADD COLUMN "consecutiveFailures" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "webhook_endpoint" ADD COLUMN "failureStartedAt" timestamp (3);--> statement-breakpoint
ALTER TABLE "webhook_endpoint" ADD COLUMN "lastFailureAt" timestamp (3);--> statement-breakpoint
ALTER TABLE "webhook_endpoint" ADD COLUMN "lastDeliveryOutcomeAt" timestamp (3);--> statement-breakpoint
ALTER TABLE "webhook_endpoint" ADD COLUMN "failureIncidentId" text;--> statement-breakpoint
ALTER TABLE "webhook_endpoint" ADD COLUMN "lastFailureEmailAt" timestamp (3);--> statement-breakpoint
ALTER TABLE "webhook_endpoint" ADD COLUMN "disabledAt" timestamp (3);--> statement-breakpoint
ALTER TABLE "webhook_endpoint" ADD COLUMN "disabledReason" text;--> statement-breakpoint
ALTER TABLE "webhook_notification" ADD CONSTRAINT "webhook_notification_webhookEndpointId_fkey" FOREIGN KEY ("webhookEndpointId") REFERENCES "public"."webhook_endpoint"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "webhook_notification" ADD CONSTRAINT "webhook_notification_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_notification_endpoint_incident_kind_key" ON "webhook_notification" USING btree ("webhookEndpointId","incidentId","kind");--> statement-breakpoint
CREATE INDEX "webhook_notification_status_nextAttemptAt_idx" ON "webhook_notification" USING btree ("status","nextAttemptAt");