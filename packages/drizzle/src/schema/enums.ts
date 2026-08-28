import { pgEnum } from "drizzle-orm/pg-core";

export const apiKeyTypeEnum = pgEnum("ApiKeyType", ["public", "private"]);

export const apiScopeEnum = pgEnum("ApiScope", ["posts_read", "posts_write", "authors_read", "authors_write", "categories_read", "categories_write", "tags_read", "tags_write", "media_read", "media_write", "posts_read_drafts", "fields_read", "fields_write"]);

export const exportFormatEnum = pgEnum("ExportFormat", ["json", "markdown"]);

export const exportJobStatusEnum = pgEnum("ExportJobStatus", ["queued", "processing", "ready", "failed", "expired"]);

export const fieldTypeEnum = pgEnum("FieldType", ["text", "number", "boolean", "date", "richtext", "select", "multiselect"]);

export const importFormatEnum = pgEnum("ImportFormat", ["markdown", "json", "wordpress"]);

export const importItemStatusEnum = pgEnum("ImportItemStatus", ["pending", "ready", "needs_review", "skipped", "imported", "failed"]);

export const importJobStatusEnum = pgEnum("ImportJobStatus", ["queued", "discovering", "processing", "review", "importing", "completed", "failed"]);

export const importSourceEnum = pgEnum("ImportSource", ["file", "url"]);

export const mediaTypeEnum = pgEnum("MediaType", ["image", "video", "audio", "document"]);

export const payloadFormatEnum = pgEnum("PayloadFormat", ["json", "discord", "slack"]);

export const planTypeEnum = pgEnum("PlanType", ["hobby", "pro"]);

export const postStatusEnum = pgEnum("PostStatus", ["published", "draft"]);

export const subscriptionRecurringIntervalEnum = pgEnum("SubscriptionRecurringInterval", ["day", "week", "month", "year"]);

export const subscriptionStatusEnum = pgEnum("SubscriptionStatus", ["active", "expired", "trialing", "past_due", "incomplete", "incomplete_expired", "unpaid", "canceled"]);

export const usageAlertKindEnum = pgEnum("UsageAlertKind", ["warning", "critical", "exhausted"]);

export const usageEventTypeEnum = pgEnum("UsageEventType", ["api_request", "media_upload", "webhook_delivery"]);

export const webhookDeliveryStatusEnum = pgEnum("WebhookDeliveryStatus", ["pending", "sending", "success", "retrying", "failed"]);

export const workspaceEventActorTypeEnum = pgEnum("WorkspaceEventActorType", ["user", "api_key", "mcp", "system"]);

export const workspaceEventResourceTypeEnum = pgEnum("WorkspaceEventResourceType", ["post", "category", "tag", "media", "author", "workspace"]);

export const workspaceEventSourceEnum = pgEnum("WorkspaceEventSource", ["dashboard", "api", "mcp", "workflow", "system"]);

export const workspaceEventTypeEnum = pgEnum("WorkspaceEventType", ["post_published", "post_deleted", "post_updated", "category_created", "category_updated", "category_deleted", "tag_created", "tag_updated", "tag_deleted", "media_uploaded", "media_deleted", "media_updated", "post_created", "post_unpublished", "author_created", "author_updated", "author_deleted"]);
