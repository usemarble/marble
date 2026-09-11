import { createId } from "@paralleldrive/cuid2";
import {
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { usageAlertKindEnum, usageEventTypeEnum } from "./enums";
import { workspace } from "./workspaces";

export const usageEvent = pgTable(
  "usage_event",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    type: usageEventTypeEnum().notNull(),
    workspaceId: text("workspaceId").notNull(),
    endpoint: text("endpoint"),
    size: integer("size"),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("usage_event_workspaceId_createdAt_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops"),
      table.createdAt.asc().nullsLast().op("timestamp_ops")
    ),
    index("usage_event_workspaceId_type_createdAt_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops"),
      table.type.asc().nullsLast().op("enum_ops"),
      table.createdAt.asc().nullsLast().op("timestamp_ops")
    ),
    foreignKey({
      columns: [table.workspaceId],
      foreignColumns: [workspace.id],
      name: "usage_event_workspaceId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const usageAlert = pgTable(
  "usage_alert",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    workspaceId: text("workspaceId").notNull(),
    type: usageEventTypeEnum().notNull(),
    kind: usageAlertKindEnum().notNull(),
    periodStart: timestamp("periodStart", {
      precision: 3,
      mode: "date",
    }).notNull(),
    periodEnd: timestamp("periodEnd", { precision: 3, mode: "date" }).notNull(),
    emailSentTo: text("emailSentTo").notNull(),
    sentAt: timestamp("sentAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex(
      "usage_alert_workspaceId_type_kind_periodStart_periodEnd_key"
    ).using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops"),
      table.type.asc().nullsLast().op("enum_ops"),
      table.kind.asc().nullsLast().op("enum_ops"),
      table.periodStart.asc().nullsLast().op("timestamp_ops"),
      table.periodEnd.asc().nullsLast().op("timestamp_ops")
    ),
    index("usage_alert_workspaceId_type_periodStart_periodEnd_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops"),
      table.type.asc().nullsLast().op("enum_ops"),
      table.periodStart.asc().nullsLast().op("timestamp_ops"),
      table.periodEnd.asc().nullsLast().op("timestamp_ops")
    ),
    foreignKey({
      columns: [table.workspaceId],
      foreignColumns: [workspace.id],
      name: "usage_alert_workspaceId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);
