import { pgEnum } from "drizzle-orm/pg-core";

export const postStatusEnum = pgEnum("PostStatus", ["published", "draft"]);

export const planTypeEnum = pgEnum("PlanType", ["hobby", "pro"]);

export const subscriptionRecurringIntervalEnum = pgEnum(
  "SubscriptionRecurringInterval",
  ["day", "week", "month", "year"]
);

export const subscriptionStatusEnum = pgEnum("SubscriptionStatus", [
  "active",
  "expired",
  "trialing",
  "past_due",
  "incomplete",
  "incomplete_expired",
  "unpaid",
  "canceled",
]);

export const workspaceEventTypeEnum = pgEnum("WorkspaceEventType", [
  "post_created",
  "post_published",
  "post_unpublished",
  "post_updated",
  "post_deleted",
  "category_created",
  "category_updated",
  "category_deleted",
  "tag_created",
  "tag_updated",
  "tag_deleted",
  "media_uploaded",
  "media_updated",
  "media_deleted",
  "author_created",
  "author_updated",
  "author_deleted",
]);

export const workspaceEventSourceEnum = pgEnum("WorkspaceEventSource", [
  "dashboard",
  "api",
  "mcp",
  "workflow",
  "system",
]);

export const workspaceEventActorTypeEnum = pgEnum("WorkspaceEventActorType", [
  "user",
  "api_key",
  "mcp",
  "system",
]);

export const workspaceEventResourceTypeEnum = pgEnum(
  "WorkspaceEventResourceType",
  ["post", "category", "tag", "media", "author", "workspace"]
);

export const payloadFormatEnum = pgEnum("PayloadFormat", [
  "json",
  "discord",
  "slack",
]);

export const mediaTypeEnum = pgEnum("MediaType", [
  "image",
  "video",
  "audio",
  "document",
]);

export const usageEventTypeEnum = pgEnum("UsageEventType", [
  "api_request",
  "media_upload",
  "webhook_delivery",
]);

export const usageAlertKindEnum = pgEnum("UsageAlertKind", [
  "warning",
  "critical",
  "exhausted",
]);

export const apiKeyTypeEnum = pgEnum("ApiKeyType", ["public", "private"]);

export const apiScopeEnum = pgEnum("ApiScope", [
  "posts_read",
  "posts_read_drafts",
  "posts_write",
  "authors_read",
  "authors_write",
  "categories_read",
  "categories_write",
  "tags_read",
  "tags_write",
  "media_read",
  "media_write",
  "fields_read",
  "fields_write",
]);

export const fieldTypeEnum = pgEnum("FieldType", [
  "text",
  "number",
  "boolean",
  "date",
  "richtext",
  "select",
  "multiselect",
]);

export const webhookDeliveryStatusEnum = pgEnum("WebhookDeliveryStatus", [
  "pending",
  "sending",
  "success",
  "retrying",
  "failed",
]);

export const exportJobStatusEnum = pgEnum("ExportJobStatus", [
  "queued",
  "processing",
  "ready",
  "failed",
  "expired",
]);

export const exportFormatEnum = pgEnum("ExportFormat", ["json", "markdown"]);

export const importSourceEnum = pgEnum("ImportSource", ["file", "url"]);

export const importJobStatusEnum = pgEnum("ImportJobStatus", [
  "queued",
  "discovering",
  "processing",
  "review",
  "importing",
  "completed",
  "failed",
]);

export const importFormatEnum = pgEnum("ImportFormat", [
  "markdown",
  "json",
  "wordpress",
]);

export const importItemStatusEnum = pgEnum("ImportItemStatus", [
  "pending",
  "ready",
  "needs_review",
  "skipped",
  "imported",
  "failed",
]);
