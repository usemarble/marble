import { createId } from "@paralleldrive/cuid2";
import {
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import {
  payloadFormatEnum,
  webhookDeliveryStatusEnum,
  workspaceEventActorTypeEnum,
  workspaceEventResourceTypeEnum,
  workspaceEventSourceEnum,
  workspaceEventTypeEnum,
} from "./enums";
import { workspace } from "./workspaces";

export const webhookEndpoint = pgTable(
  "webhook_endpoint",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    name: text("name").notNull(),
    url: text("url").notNull(),
    secret: text("secret").notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    workspaceId: text("workspaceId").notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
    events: workspaceEventTypeEnum("events").array().notNull(),
    format: payloadFormatEnum().default("json").notNull(),
  },
  (table) => [
    index("webhook_endpoint_workspaceId_enabled_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops"),
      table.enabled.asc().nullsLast().op("bool_ops")
    ),
    index("webhook_endpoint_workspaceId_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.workspaceId],
      foreignColumns: [workspace.id],
      name: "webhook_endpoint_workspaceId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const workspaceEvent = pgTable(
  "workspace_event",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    workspaceId: text("workspaceId").notNull(),
    type: workspaceEventTypeEnum().notNull(),
    source: workspaceEventSourceEnum().default("dashboard").notNull(),
    resourceType: workspaceEventResourceTypeEnum(),
    resourceId: text("resourceId"),
    actorType: workspaceEventActorTypeEnum(),
    actorId: text("actorId"),
    payload: jsonb("payload").default({}).notNull(),
    processedAt: timestamp({ precision: 3, mode: "date" }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("workspace_event_workspaceId_createdAt_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops"),
      table.createdAt.asc().nullsLast().op("timestamp_ops")
    ),
    index("workspace_event_workspaceId_processedAt_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops"),
      table.processedAt.asc().nullsLast().op("timestamp_ops")
    ),
    index("workspace_event_workspaceId_resourceType_resourceId_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops"),
      table.resourceType.asc().nullsLast().op("enum_ops"),
      table.resourceId.asc().nullsLast().op("text_ops")
    ),
    index("workspace_event_workspaceId_type_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops"),
      table.type.asc().nullsLast().op("enum_ops")
    ),
    foreignKey({
      columns: [table.workspaceId],
      foreignColumns: [workspace.id],
      name: "workspace_event_workspaceId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const webhookDelivery = pgTable(
  "webhook_delivery",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    eventId: text("eventId").notNull(),
    workspaceId: text("workspaceId").notNull(),
    webhookEndpointId: text("webhookEndpointId").notNull(),
    url: text("url").notNull(),
    status: webhookDeliveryStatusEnum().default("pending").notNull(),
    isTest: boolean("isTest").default(false).notNull(),
    attemptCount: integer("attemptCount").default(0).notNull(),
    maxAttempts: integer("maxAttempts").default(3).notNull(),
    nextRetryAt: timestamp({ precision: 3, mode: "date" }),
    lastAttemptAt: timestamp({ precision: 3, mode: "date" }),
    deliveredAt: timestamp({ precision: 3, mode: "date" }),
    failedAt: timestamp({ precision: 3, mode: "date" }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("webhook_delivery_eventId_idx").using(
      "btree",
      table.eventId.asc().nullsLast().op("text_ops")
    ),
    uniqueIndex("webhook_delivery_eventId_webhookEndpointId_key").using(
      "btree",
      table.eventId.asc().nullsLast().op("text_ops"),
      table.webhookEndpointId.asc().nullsLast().op("text_ops")
    ),
    index("webhook_delivery_webhookEndpointId_idx").using(
      "btree",
      table.webhookEndpointId.asc().nullsLast().op("text_ops")
    ),
    index("webhook_delivery_workspaceId_createdAt_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops"),
      table.createdAt.asc().nullsLast().op("timestamp_ops")
    ),
    index("webhook_delivery_workspaceId_status_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops"),
      table.status.asc().nullsLast().op("enum_ops")
    ),
    foreignKey({
      columns: [table.eventId],
      foreignColumns: [workspaceEvent.id],
      name: "webhook_delivery_eventId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.workspaceId],
      foreignColumns: [workspace.id],
      name: "webhook_delivery_workspaceId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.webhookEndpointId],
      foreignColumns: [webhookEndpoint.id],
      name: "webhook_delivery_webhookEndpointId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const webhookDeliveryAttempt = pgTable(
  "webhook_delivery_attempt",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    deliveryId: text("deliveryId").notNull(),
    attemptNumber: integer("attemptNumber").notNull(),
    success: boolean("success").default(false).notNull(),
    statusCode: integer("statusCode"),
    responseBody: text("responseBody"),
    errorMessage: text("errorMessage"),
    durationMs: integer("durationMs"),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("webhook_delivery_attempt_deliveryId_attemptNumber_key").using(
      "btree",
      table.deliveryId.asc().nullsLast().op("text_ops"),
      table.attemptNumber.asc().nullsLast().op("int4_ops")
    ),
    index("webhook_delivery_attempt_deliveryId_idx").using(
      "btree",
      table.deliveryId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.deliveryId],
      foreignColumns: [webhookDelivery.id],
      name: "webhook_delivery_attempt_deliveryId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);
