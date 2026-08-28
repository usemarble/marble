-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."ApiKeyType" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TYPE "public"."ApiScope" AS ENUM('posts_read', 'posts_write', 'authors_read', 'authors_write', 'categories_read', 'categories_write', 'tags_read', 'tags_write', 'media_read', 'media_write', 'posts_read_drafts', 'fields_read', 'fields_write');--> statement-breakpoint
CREATE TYPE "public"."ExportFormat" AS ENUM('json', 'markdown');--> statement-breakpoint
CREATE TYPE "public"."ExportJobStatus" AS ENUM('queued', 'processing', 'ready', 'failed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."FieldType" AS ENUM('text', 'number', 'boolean', 'date', 'richtext', 'select', 'multiselect');--> statement-breakpoint
CREATE TYPE "public"."ImportFormat" AS ENUM('markdown', 'json', 'wordpress');--> statement-breakpoint
CREATE TYPE "public"."ImportItemStatus" AS ENUM('pending', 'ready', 'needs_review', 'skipped', 'imported', 'failed');--> statement-breakpoint
CREATE TYPE "public"."ImportJobStatus" AS ENUM('queued', 'discovering', 'processing', 'review', 'importing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."ImportSource" AS ENUM('file', 'url');--> statement-breakpoint
CREATE TYPE "public"."MediaType" AS ENUM('image', 'video', 'audio', 'document');--> statement-breakpoint
CREATE TYPE "public"."PayloadFormat" AS ENUM('json', 'discord', 'slack');--> statement-breakpoint
CREATE TYPE "public"."PlanType" AS ENUM('hobby', 'pro');--> statement-breakpoint
CREATE TYPE "public"."PostStatus" AS ENUM('published', 'draft');--> statement-breakpoint
CREATE TYPE "public"."SubscriptionRecurringInterval" AS ENUM('day', 'week', 'month', 'year');--> statement-breakpoint
CREATE TYPE "public"."SubscriptionStatus" AS ENUM('active', 'expired', 'trialing', 'past_due', 'incomplete', 'incomplete_expired', 'unpaid', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."UsageAlertKind" AS ENUM('warning', 'critical', 'exhausted');--> statement-breakpoint
CREATE TYPE "public"."UsageEventType" AS ENUM('api_request', 'media_upload', 'webhook_delivery');--> statement-breakpoint
CREATE TYPE "public"."WebhookDeliveryStatus" AS ENUM('pending', 'sending', 'success', 'retrying', 'failed');--> statement-breakpoint
CREATE TYPE "public"."WorkspaceEventActorType" AS ENUM('user', 'api_key', 'mcp', 'system');--> statement-breakpoint
CREATE TYPE "public"."WorkspaceEventResourceType" AS ENUM('post', 'category', 'tag', 'media', 'author', 'workspace');--> statement-breakpoint
CREATE TYPE "public"."WorkspaceEventSource" AS ENUM('dashboard', 'api', 'mcp', 'workflow', 'system');--> statement-breakpoint
CREATE TYPE "public"."WorkspaceEventType" AS ENUM('post_published', 'post_deleted', 'post_updated', 'category_created', 'category_updated', 'category_deleted', 'tag_created', 'tag_updated', 'tag_deleted', 'media_uploaded', 'media_deleted', 'media_updated', 'post_created', 'post_unpublished', 'author_created', 'author_updated', 'author_deleted');--> statement-breakpoint
CREATE TABLE "ShareLink" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"postId" text NOT NULL,
	"workspaceId" text NOT NULL,
	"password" text,
	"expiresAt" timestamp(3) NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_event" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "UsageEventType" NOT NULL,
	"workspaceId" text NOT NULL,
	"endpoint" text,
	"size" integer,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "author_social" (
	"id" text PRIMARY KEY NOT NULL,
	"authorId" text NOT NULL,
	"platform" text NOT NULL,
	"url" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_key" (
	"id" text PRIMARY KEY NOT NULL,
	"workspaceId" text NOT NULL,
	"userId" text,
	"name" text NOT NULL,
	"prefix" text,
	"key" text NOT NULL,
	"preview" text NOT NULL,
	"type" "ApiKeyType" DEFAULT 'public' NOT NULL,
	"scopes" "ApiScope""[] DEFAULT '{"RAY"}',
	"requestCount" integer DEFAULT 0 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"rateLimitTimeWindow" integer,
	"rateLimitMax" integer,
	"lastRequest" timestamp(3),
	"lastUsed" timestamp(3),
	"expiresAt" timestamp(3),
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"plan" "PlanType" NOT NULL,
	"status" "SubscriptionStatus" NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"cancelAtPeriodEnd" boolean NOT NULL,
	"canceledAt" timestamp(3),
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"currentPeriodEnd" timestamp(3) NOT NULL,
	"currentPeriodStart" timestamp(3) NOT NULL,
	"endedAt" timestamp(3),
	"endsAt" timestamp(3),
	"polarId" text NOT NULL,
	"workspaceId" text NOT NULL,
	"amount" integer DEFAULT 20 NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"discountId" text,
	"productId" text,
	"recurringInterval" "SubscriptionRecurringInterval" DEFAULT 'month' NOT NULL,
	"startedAt" timestamp(3),
	"lastPolarEventAt" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "field" (
	"id" text PRIMARY KEY NOT NULL,
	"workspaceId" text NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "FieldType" NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "field_option" (
	"id" text PRIMARY KEY NOT NULL,
	"fieldId" text NOT NULL,
	"workspaceId" text NOT NULL,
	"value" text NOT NULL,
	"label" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "field_value" (
	"id" text PRIMARY KEY NOT NULL,
	"postId" text NOT NULL,
	"fieldId" text NOT NULL,
	"workspaceId" text NOT NULL,
	"value" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_notification_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"memberId" text NOT NULL,
	"usageAlerts" boolean DEFAULT true NOT NULL,
	"subscriptions" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"size" integer NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"workspaceId" text NOT NULL,
	"type" "MediaType" DEFAULT 'image' NOT NULL,
	"alt" text,
	"blurHash" text,
	"duration" integer,
	"height" integer,
	"mimeType" text,
	"width" integer,
	"storageKey" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_notification_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"marketing" boolean DEFAULT false NOT NULL,
	"product" boolean DEFAULT true NOT NULL,
	"marketingConsentedAt" timestamp(3),
	"marketingConsentSource" text,
	"marketingUnsubscribedAt" timestamp(3),
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_event" (
	"id" text PRIMARY KEY NOT NULL,
	"workspaceId" text NOT NULL,
	"type" "WorkspaceEventType" NOT NULL,
	"source" "WorkspaceEventSource" DEFAULT 'dashboard' NOT NULL,
	"resourceType" "WorkspaceEventResourceType",
	"resourceId" text,
	"actorType" "WorkspaceEventActorType",
	"actorId" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"processedAt" timestamp(3),
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_delivery" (
	"id" text PRIMARY KEY NOT NULL,
	"eventId" text NOT NULL,
	"workspaceId" text NOT NULL,
	"webhookEndpointId" text NOT NULL,
	"url" text NOT NULL,
	"status" "WebhookDeliveryStatus" DEFAULT 'pending' NOT NULL,
	"isTest" boolean DEFAULT false NOT NULL,
	"attemptCount" integer DEFAULT 0 NOT NULL,
	"maxAttempts" integer DEFAULT 3 NOT NULL,
	"nextRetryAt" timestamp(3),
	"lastAttemptAt" timestamp(3),
	"deliveredAt" timestamp(3),
	"failedAt" timestamp(3),
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_delivery_attempt" (
	"id" text PRIMARY KEY NOT NULL,
	"deliveryId" text NOT NULL,
	"attemptNumber" integer NOT NULL,
	"success" boolean DEFAULT false NOT NULL,
	"statusCode" integer,
	"responseBody" text,
	"errorMessage" text,
	"durationMs" integer,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_alert" (
	"id" text PRIMARY KEY NOT NULL,
	"workspaceId" text NOT NULL,
	"type" "UsageEventType" NOT NULL,
	"kind" "UsageAlertKind" NOT NULL,
	"periodStart" timestamp(3) NOT NULL,
	"periodEnd" timestamp(3) NOT NULL,
	"emailSentTo" text NOT NULL,
	"sentAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_item" (
	"id" text PRIMARY KEY NOT NULL,
	"importJobId" text NOT NULL,
	"workspaceId" text NOT NULL,
	"status" "ImportItemStatus" DEFAULT 'pending' NOT NULL,
	"sourceRef" text,
	"title" text,
	"slug" text,
	"content" text,
	"contentJson" jsonb,
	"description" text,
	"coverImage" text,
	"rawCategory" text,
	"rawTags" jsonb,
	"rawAuthor" text,
	"resolvedCategoryId" text,
	"resolvedTagIds" jsonb,
	"postId" text,
	"errors" jsonb,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "export_job" (
	"id" text PRIMARY KEY NOT NULL,
	"workspaceId" text NOT NULL,
	"status" "ExportJobStatus" DEFAULT 'queued' NOT NULL,
	"format" "ExportFormat" DEFAULT 'json' NOT NULL,
	"scope" jsonb NOT NULL,
	"storageKey" text,
	"fileSize" integer,
	"downloadTokenHash" text,
	"expiresAt" timestamp(3),
	"startedAt" timestamp(3),
	"completedAt" timestamp(3),
	"failedAt" timestamp(3),
	"errorMessage" text,
	"emailSentAt" timestamp(3),
	"attemptCount" integer DEFAULT 0 NOT NULL,
	"createdById" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_job" (
	"id" text PRIMARY KEY NOT NULL,
	"workspaceId" text NOT NULL,
	"source" "ImportSource" NOT NULL,
	"status" "ImportJobStatus" DEFAULT 'queued' NOT NULL,
	"format" "ImportFormat",
	"sourceUrl" text,
	"uploadKey" text,
	"totalItems" integer DEFAULT 0 NOT NULL,
	"readyItems" integer DEFAULT 0 NOT NULL,
	"errorItems" integer DEFAULT 0 NOT NULL,
	"importedItems" integer DEFAULT 0 NOT NULL,
	"mapping" jsonb,
	"startedAt" timestamp(3),
	"completedAt" timestamp(3),
	"failedAt" timestamp(3),
	"errorMessage" text,
	"createdById" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_endpoint" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"secret" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"workspaceId" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"events" "WorkspaceEventType""[],
	"format" "PayloadFormat" DEFAULT 'json' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_prisma_migrations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"finished_at" timestamp with time zone,
	"migration_name" varchar(255) NOT NULL,
	"logs" text,
	"rolled_back_at" timestamp with time zone,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"applied_steps_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"metadata" text,
	"description" text,
	"subdomain" text,
	"updatedAt" timestamp(3) NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"timezone" text DEFAULT 'Europe/London' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"slug" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"workspaceId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"slug" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"workspaceId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp(3) NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp(3) NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	"activeOrganizationId" text
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp(3),
	"refreshTokenExpiresAt" timestamp(3),
	"scope" text,
	"password" text,
	"createdAt" timestamp(3) NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"coverImage" text,
	"contentJson" jsonb NOT NULL,
	"description" text NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"workspaceId" text NOT NULL,
	"slug" text NOT NULL,
	"categoryId" text NOT NULL,
	"status" "PostStatus" DEFAULT 'draft' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"publishedAt" timestamp(3) NOT NULL,
	"attribution" jsonb,
	"primaryAuthorId" text
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean NOT NULL,
	"image" text,
	"createdAt" timestamp(3) NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp(3) NOT NULL,
	"createdAt" timestamp(3),
	"updatedAt" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text NOT NULL,
	"expiresAt" timestamp(3) NOT NULL,
	"inviterId" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"userId" text NOT NULL,
	"role" text,
	"createdAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "author" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"bio" text,
	"image" text,
	"role" text,
	"slug" text NOT NULL,
	"workspaceId" text NOT NULL,
	"userId" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_PostToTag" (
	"A" text NOT NULL,
	"B" text NOT NULL,
	CONSTRAINT "_PostToTag_AB_pkey" PRIMARY KEY("A","B")
);
--> statement-breakpoint
CREATE TABLE "_PostToAuthor" (
	"A" text NOT NULL,
	"B" text NOT NULL,
	CONSTRAINT "_PostToAuthor_AB_pkey" PRIMARY KEY("A","B")
);
--> statement-breakpoint
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "usage_event" ADD CONSTRAINT "usage_event_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "author_social" ADD CONSTRAINT "author_social_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."author"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "field" ADD CONSTRAINT "field_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "field_option" ADD CONSTRAINT "field_option_fieldId_workspaceId_fkey" FOREIGN KEY ("fieldId","workspaceId") REFERENCES "public"."field"("id","workspaceId") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "field_option" ADD CONSTRAINT "field_option_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "field_value" ADD CONSTRAINT "field_value_postId_workspaceId_fkey" FOREIGN KEY ("postId","workspaceId") REFERENCES "public"."post"("id","workspaceId") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "field_value" ADD CONSTRAINT "field_value_fieldId_workspaceId_fkey" FOREIGN KEY ("fieldId","workspaceId") REFERENCES "public"."field"("id","workspaceId") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "field_value" ADD CONSTRAINT "field_value_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "workspace_notification_preferences" ADD CONSTRAINT "workspace_notification_preferences_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "workspace_event" ADD CONSTRAINT "workspace_event_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "webhook_delivery" ADD CONSTRAINT "webhook_delivery_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."workspace_event"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "webhook_delivery" ADD CONSTRAINT "webhook_delivery_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "webhook_delivery" ADD CONSTRAINT "webhook_delivery_webhookEndpointId_fkey" FOREIGN KEY ("webhookEndpointId") REFERENCES "public"."webhook_endpoint"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "webhook_delivery_attempt" ADD CONSTRAINT "webhook_delivery_attempt_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "public"."webhook_delivery"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "usage_alert" ADD CONSTRAINT "usage_alert_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "import_item" ADD CONSTRAINT "import_item_importJobId_workspaceId_fkey" FOREIGN KEY ("importJobId","workspaceId") REFERENCES "public"."import_job"("id","workspaceId") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "import_item" ADD CONSTRAINT "import_item_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "export_job" ADD CONSTRAINT "export_job_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "export_job" ADD CONSTRAINT "export_job_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "import_job" ADD CONSTRAINT "import_job_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "import_job" ADD CONSTRAINT "import_job_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "webhook_endpoint" ADD CONSTRAINT "webhook_endpoint_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tag" ADD CONSTRAINT "tag_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_primaryAuthorId_fkey" FOREIGN KEY ("primaryAuthorId") REFERENCES "public"."author"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "author" ADD CONSTRAINT "author_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "author" ADD CONSTRAINT "author_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_PostToTag" ADD CONSTRAINT "_PostToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_PostToTag" ADD CONSTRAINT "_PostToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_PostToAuthor" ADD CONSTRAINT "_PostToAuthor_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."author"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_PostToAuthor" ADD CONSTRAINT "_PostToAuthor_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "ShareLink_expiresAt_idx" ON "ShareLink" USING btree ("expiresAt" timestamp_ops);--> statement-breakpoint
CREATE INDEX "ShareLink_isActive_idx" ON "ShareLink" USING btree ("isActive" bool_ops);--> statement-breakpoint
CREATE INDEX "ShareLink_postId_idx" ON "ShareLink" USING btree ("postId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "ShareLink_token_key" ON "ShareLink" USING btree ("token" text_ops);--> statement-breakpoint
CREATE INDEX "ShareLink_workspaceId_idx" ON "ShareLink" USING btree ("workspaceId" text_ops);--> statement-breakpoint
CREATE INDEX "usage_event_workspaceId_createdAt_idx" ON "usage_event" USING btree ("workspaceId" text_ops,"createdAt" timestamp_ops);--> statement-breakpoint
CREATE INDEX "usage_event_workspaceId_type_createdAt_idx" ON "usage_event" USING btree ("workspaceId" timestamp_ops,"type" timestamp_ops,"createdAt" timestamp_ops);--> statement-breakpoint
CREATE INDEX "author_social_authorId_idx" ON "author_social" USING btree ("authorId" text_ops);--> statement-breakpoint
CREATE INDEX "api_key_key_idx" ON "api_key" USING btree ("key" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "api_key_key_key" ON "api_key" USING btree ("key" text_ops);--> statement-breakpoint
CREATE INDEX "api_key_workspaceId_createdAt_idx" ON "api_key" USING btree ("workspaceId" text_ops,"createdAt" text_ops);--> statement-breakpoint
CREATE INDEX "api_key_workspaceId_enabled_idx" ON "api_key" USING btree ("workspaceId" text_ops,"enabled" text_ops);--> statement-breakpoint
CREATE INDEX "api_key_workspaceId_idx" ON "api_key" USING btree ("workspaceId" text_ops);--> statement-breakpoint
CREATE INDEX "api_key_workspaceId_type_idx" ON "api_key" USING btree ("workspaceId" text_ops,"type" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_polarId_key" ON "subscription" USING btree ("polarId" text_ops);--> statement-breakpoint
CREATE INDEX "subscription_status_idx" ON "subscription" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "subscription_userId_idx" ON "subscription" USING btree ("userId" text_ops);--> statement-breakpoint
CREATE INDEX "subscription_workspaceId_status_idx" ON "subscription" USING btree ("workspaceId" enum_ops,"status" enum_ops);--> statement-breakpoint
CREATE INDEX "field_workspaceId_idx" ON "field" USING btree ("workspaceId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "field_workspaceId_key_key" ON "field" USING btree ("workspaceId" text_ops,"key" text_ops);--> statement-breakpoint
CREATE INDEX "field_option_fieldId_idx" ON "field_option" USING btree ("fieldId" text_ops);--> statement-breakpoint
CREATE INDEX "field_option_fieldId_position_idx" ON "field_option" USING btree ("fieldId" int4_ops,"position" int4_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "field_option_fieldId_value_key" ON "field_option" USING btree ("fieldId" text_ops,"value" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "field_option_id_workspaceId_key" ON "field_option" USING btree ("id" text_ops,"workspaceId" text_ops);--> statement-breakpoint
CREATE INDEX "field_option_workspaceId_idx" ON "field_option" USING btree ("workspaceId" text_ops);--> statement-breakpoint
CREATE INDEX "field_value_fieldId_idx" ON "field_value" USING btree ("fieldId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "field_value_postId_fieldId_key" ON "field_value" USING btree ("postId" text_ops,"fieldId" text_ops);--> statement-breakpoint
CREATE INDEX "field_value_postId_idx" ON "field_value" USING btree ("postId" text_ops);--> statement-breakpoint
CREATE INDEX "field_value_workspaceId_idx" ON "field_value" USING btree ("workspaceId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_notification_preferences_memberId_key" ON "workspace_notification_preferences" USING btree ("memberId" text_ops);--> statement-breakpoint
CREATE INDEX "media_workspaceId_createdAt_idx" ON "media" USING btree ("workspaceId" text_ops,"createdAt" text_ops);--> statement-breakpoint
CREATE INDEX "media_workspaceId_type_idx" ON "media" USING btree ("workspaceId" text_ops,"type" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "user_notification_preferences_userId_key" ON "user_notification_preferences" USING btree ("userId" text_ops);--> statement-breakpoint
CREATE INDEX "workspace_event_workspaceId_createdAt_idx" ON "workspace_event" USING btree ("workspaceId" text_ops,"createdAt" text_ops);--> statement-breakpoint
CREATE INDEX "workspace_event_workspaceId_processedAt_idx" ON "workspace_event" USING btree ("workspaceId" text_ops,"processedAt" timestamp_ops);--> statement-breakpoint
CREATE INDEX "workspace_event_workspaceId_resourceType_resourceId_idx" ON "workspace_event" USING btree ("workspaceId" enum_ops,"resourceType" text_ops,"resourceId" enum_ops);--> statement-breakpoint
CREATE INDEX "workspace_event_workspaceId_type_idx" ON "workspace_event" USING btree ("workspaceId" enum_ops,"type" text_ops);--> statement-breakpoint
CREATE INDEX "webhook_delivery_eventId_idx" ON "webhook_delivery" USING btree ("eventId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_delivery_eventId_webhookEndpointId_key" ON "webhook_delivery" USING btree ("eventId" text_ops,"webhookEndpointId" text_ops);--> statement-breakpoint
CREATE INDEX "webhook_delivery_webhookEndpointId_idx" ON "webhook_delivery" USING btree ("webhookEndpointId" text_ops);--> statement-breakpoint
CREATE INDEX "webhook_delivery_workspaceId_createdAt_idx" ON "webhook_delivery" USING btree ("workspaceId" text_ops,"createdAt" timestamp_ops);--> statement-breakpoint
CREATE INDEX "webhook_delivery_workspaceId_status_idx" ON "webhook_delivery" USING btree ("workspaceId" text_ops,"status" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_delivery_attempt_deliveryId_attemptNumber_key" ON "webhook_delivery_attempt" USING btree ("deliveryId" int4_ops,"attemptNumber" int4_ops);--> statement-breakpoint
CREATE INDEX "webhook_delivery_attempt_deliveryId_idx" ON "webhook_delivery_attempt" USING btree ("deliveryId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "usage_alert_workspaceId_type_kind_periodStart_periodEnd_key" ON "usage_alert" USING btree ("workspaceId" timestamp_ops,"type" text_ops,"kind" timestamp_ops,"periodStart" timestamp_ops,"periodEnd" enum_ops);--> statement-breakpoint
CREATE INDEX "usage_alert_workspaceId_type_periodStart_periodEnd_idx" ON "usage_alert" USING btree ("workspaceId" enum_ops,"type" timestamp_ops,"periodStart" enum_ops,"periodEnd" enum_ops);--> statement-breakpoint
CREATE INDEX "import_item_importJobId_status_idx" ON "import_item" USING btree ("importJobId" text_ops,"status" text_ops);--> statement-breakpoint
CREATE INDEX "import_item_workspaceId_idx" ON "import_item" USING btree ("workspaceId" text_ops);--> statement-breakpoint
CREATE INDEX "export_job_expiresAt_idx" ON "export_job" USING btree ("expiresAt" timestamp_ops);--> statement-breakpoint
CREATE INDEX "export_job_workspaceId_createdAt_idx" ON "export_job" USING btree ("workspaceId" timestamp_ops,"createdAt" timestamp_ops);--> statement-breakpoint
CREATE INDEX "export_job_workspaceId_status_idx" ON "export_job" USING btree ("workspaceId" text_ops,"status" text_ops);--> statement-breakpoint
CREATE INDEX "import_job_workspaceId_createdAt_idx" ON "import_job" USING btree ("workspaceId" text_ops,"createdAt" text_ops);--> statement-breakpoint
CREATE INDEX "import_job_workspaceId_status_idx" ON "import_job" USING btree ("workspaceId" text_ops,"status" text_ops);--> statement-breakpoint
CREATE INDEX "webhook_endpoint_workspaceId_enabled_idx" ON "webhook_endpoint" USING btree ("workspaceId" text_ops,"enabled" text_ops);--> statement-breakpoint
CREATE INDEX "webhook_endpoint_workspaceId_idx" ON "webhook_endpoint" USING btree ("workspaceId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_slug_key" ON "workspace" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_subdomain_key" ON "workspace" USING btree ("subdomain" text_ops);--> statement-breakpoint
CREATE INDEX "category_workspaceId_idx" ON "category" USING btree ("workspaceId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "category_workspaceId_slug_key" ON "category" USING btree ("workspaceId" text_ops,"slug" text_ops);--> statement-breakpoint
CREATE INDEX "tag_workspaceId_idx" ON "tag" USING btree ("workspaceId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "tag_workspaceId_slug_key" ON "tag" USING btree ("workspaceId" text_ops,"slug" text_ops);--> statement-breakpoint
CREATE INDEX "session_activeOrganizationId_idx" ON "session" USING btree ("activeOrganizationId" text_ops);--> statement-breakpoint
CREATE INDEX "session_token_idx" ON "session" USING btree ("token" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_key" ON "session" USING btree ("token" text_ops);--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("userId" text_ops);--> statement-breakpoint
CREATE INDEX "account_providerId_accountId_idx" ON "account" USING btree ("providerId" text_ops,"accountId" text_ops);--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("userId" text_ops);--> statement-breakpoint
CREATE INDEX "post_categoryId_idx" ON "post" USING btree ("categoryId" text_ops);--> statement-breakpoint
CREATE INDEX "post_workspaceId_createdAt_idx" ON "post" USING btree ("workspaceId" text_ops,"createdAt" timestamp_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "post_workspaceId_slug_key" ON "post" USING btree ("workspaceId" text_ops,"slug" text_ops);--> statement-breakpoint
CREATE INDEX "post_workspaceId_status_idx" ON "post" USING btree ("workspaceId" enum_ops,"status" enum_ops);--> statement-breakpoint
CREATE INDEX "post_workspaceId_status_publishedAt_idx" ON "post" USING btree ("workspaceId" timestamp_ops,"status" timestamp_ops,"publishedAt" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_key" ON "user" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier" text_ops);--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "invitation_inviterId_idx" ON "invitation" USING btree ("inviterId" text_ops);--> statement-breakpoint
CREATE INDEX "invitation_organizationId_idx" ON "invitation" USING btree ("organizationId" text_ops);--> statement-breakpoint
CREATE INDEX "member_organizationId_idx" ON "member" USING btree ("organizationId" text_ops);--> statement-breakpoint
CREATE INDEX "member_organizationId_userId_idx" ON "member" USING btree ("organizationId" text_ops,"userId" text_ops);--> statement-breakpoint
CREATE INDEX "member_userId_idx" ON "member" USING btree ("userId" text_ops);--> statement-breakpoint
CREATE INDEX "author_userId_idx" ON "author" USING btree ("userId" text_ops);--> statement-breakpoint
CREATE INDEX "author_workspaceId_isActive_idx" ON "author" USING btree ("workspaceId" text_ops,"isActive" bool_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "author_workspaceId_slug_key" ON "author" USING btree ("workspaceId" text_ops,"slug" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "author_workspaceId_userId_key" ON "author" USING btree ("workspaceId" text_ops,"userId" text_ops);--> statement-breakpoint
CREATE INDEX "_PostToTag_B_index" ON "_PostToTag" USING btree ("B" text_ops);--> statement-breakpoint
CREATE INDEX "_PostToAuthor_B_index" ON "_PostToAuthor" USING btree ("B" text_ops);
*/