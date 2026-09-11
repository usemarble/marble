import { createId } from "@paralleldrive/cuid2";
import {
  boolean,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { apiKeyTypeEnum, apiScopeEnum } from "./enums";
import { workspace } from "./workspaces";

export const apiKey = pgTable(
  "api_key",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    workspaceId: text("workspaceId").notNull(),
    userId: text("userId"),
    name: text("name").notNull(),
    prefix: text("prefix"),
    key: text("key").notNull(),
    preview: text("preview").notNull(),
    type: apiKeyTypeEnum().default("public").notNull(),
    scopes: apiScopeEnum("scopes").array().default([]).notNull(),
    requestCount: integer("requestCount").default(0).notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    rateLimitTimeWindow: integer("rateLimitTimeWindow"),
    rateLimitMax: integer("rateLimitMax"),
    lastRequest: timestamp({ precision: 3, mode: "date" }),
    lastUsed: timestamp({ precision: 3, mode: "date" }),
    expiresAt: timestamp({ precision: 3, mode: "date" }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("api_key_key_idx").using(
      "btree",
      table.key.asc().nullsLast().op("text_ops")
    ),
    uniqueIndex("api_key_key_key").using(
      "btree",
      table.key.asc().nullsLast().op("text_ops")
    ),
    index("api_key_workspaceId_createdAt_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops"),
      table.createdAt.asc().nullsLast().op("timestamp_ops")
    ),
    index("api_key_workspaceId_enabled_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops"),
      table.enabled.asc().nullsLast().op("bool_ops")
    ),
    index("api_key_workspaceId_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops")
    ),
    index("api_key_workspaceId_type_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops"),
      table.type.asc().nullsLast().op("enum_ops")
    ),
    foreignKey({
      columns: [table.workspaceId],
      foreignColumns: [workspace.id],
      name: "api_key_workspaceId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "api_key_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ]
);
