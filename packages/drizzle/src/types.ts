import {
  apiKeyTypeEnum,
  apiScopeEnum,
  exportFormatEnum,
  exportJobStatusEnum,
  fieldTypeEnum,
  importFormatEnum,
  importItemStatusEnum,
  importJobStatusEnum,
  importSourceEnum,
  mediaTypeEnum,
  payloadFormatEnum,
  planTypeEnum,
  postStatusEnum,
  subscriptionRecurringIntervalEnum,
  subscriptionStatusEnum,
  usageAlertKindEnum,
  usageEventTypeEnum,
  webhookDeliveryStatusEnum,
  workspaceEventActorTypeEnum,
  workspaceEventResourceTypeEnum,
  workspaceEventSourceEnum,
  workspaceEventTypeEnum,
} from "./schema/enums";

export type PostStatus = (typeof postStatusEnum.enumValues)[number];
export type PlanType = (typeof planTypeEnum.enumValues)[number];
export type SubscriptionRecurringInterval =
  (typeof subscriptionRecurringIntervalEnum.enumValues)[number];
export type SubscriptionStatus =
  (typeof subscriptionStatusEnum.enumValues)[number];
export type WorkspaceEventType =
  (typeof workspaceEventTypeEnum.enumValues)[number];
export type WorkspaceEventSource =
  (typeof workspaceEventSourceEnum.enumValues)[number];
export type WorkspaceEventActorType =
  (typeof workspaceEventActorTypeEnum.enumValues)[number];
export type WorkspaceEventResourceType =
  (typeof workspaceEventResourceTypeEnum.enumValues)[number];
export type PayloadFormat = (typeof payloadFormatEnum.enumValues)[number];
export type MediaType = (typeof mediaTypeEnum.enumValues)[number];
export type UsageEventType = (typeof usageEventTypeEnum.enumValues)[number];
export type UsageAlertKind = (typeof usageAlertKindEnum.enumValues)[number];
export type ApiKeyType = (typeof apiKeyTypeEnum.enumValues)[number];
export type ApiScope = (typeof apiScopeEnum.enumValues)[number];
export type FieldType = (typeof fieldTypeEnum.enumValues)[number];
export type WebhookDeliveryStatus =
  (typeof webhookDeliveryStatusEnum.enumValues)[number];
export type ExportJobStatus = (typeof exportJobStatusEnum.enumValues)[number];
export type ExportFormat = (typeof exportFormatEnum.enumValues)[number];
export type ImportSource = (typeof importSourceEnum.enumValues)[number];
export type ImportJobStatus = (typeof importJobStatusEnum.enumValues)[number];
export type ImportFormat = (typeof importFormatEnum.enumValues)[number];
export type ImportItemStatus = (typeof importItemStatusEnum.enumValues)[number];
