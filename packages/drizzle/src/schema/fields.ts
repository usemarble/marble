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
import { post } from "./content";
import { fieldTypeEnum } from "./enums";
import { workspace } from "./workspaces";

export const field = pgTable(
  "field",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    workspaceId: text("workspaceId").notNull(),
    key: text("key").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    type: fieldTypeEnum().notNull(),
    required: boolean("required").default(false).notNull(),
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("field_workspaceId_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops")
    ),
    uniqueIndex("field_workspaceId_key_key").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops"),
      table.key.asc().nullsLast().op("text_ops")
    ),
    uniqueIndex("field_id_workspaceId_key").using(
      "btree",
      table.id.asc().nullsLast().op("text_ops"),
      table.workspaceId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.workspaceId],
      foreignColumns: [workspace.id],
      name: "field_workspaceId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const fieldOption = pgTable(
  "field_option",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    fieldId: text("fieldId").notNull(),
    workspaceId: text("workspaceId").notNull(),
    value: text("value").notNull(),
    label: text("label").notNull(),
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("field_option_fieldId_idx").using(
      "btree",
      table.fieldId.asc().nullsLast().op("text_ops")
    ),
    index("field_option_fieldId_position_idx").using(
      "btree",
      table.fieldId.asc().nullsLast().op("text_ops"),
      table.position.asc().nullsLast().op("int4_ops")
    ),
    uniqueIndex("field_option_fieldId_value_key").using(
      "btree",
      table.fieldId.asc().nullsLast().op("text_ops"),
      table.value.asc().nullsLast().op("text_ops")
    ),
    uniqueIndex("field_option_id_workspaceId_key").using(
      "btree",
      table.id.asc().nullsLast().op("text_ops"),
      table.workspaceId.asc().nullsLast().op("text_ops")
    ),
    index("field_option_workspaceId_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.fieldId, table.workspaceId],
      foreignColumns: [field.id, field.workspaceId],
      name: "field_option_fieldId_workspaceId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.workspaceId],
      foreignColumns: [workspace.id],
      name: "field_option_workspaceId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const fieldValue = pgTable(
  "field_value",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    postId: text("postId").notNull(),
    fieldId: text("fieldId").notNull(),
    workspaceId: text("workspaceId").notNull(),
    value: text("value").notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("field_value_fieldId_idx").using(
      "btree",
      table.fieldId.asc().nullsLast().op("text_ops")
    ),
    uniqueIndex("field_value_postId_fieldId_key").using(
      "btree",
      table.postId.asc().nullsLast().op("text_ops"),
      table.fieldId.asc().nullsLast().op("text_ops")
    ),
    index("field_value_postId_idx").using(
      "btree",
      table.postId.asc().nullsLast().op("text_ops")
    ),
    index("field_value_workspaceId_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.postId, table.workspaceId],
      foreignColumns: [post.id, post.workspaceId],
      name: "field_value_postId_workspaceId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.fieldId, table.workspaceId],
      foreignColumns: [field.id, field.workspaceId],
      name: "field_value_fieldId_workspaceId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.workspaceId],
      foreignColumns: [workspace.id],
      name: "field_value_workspaceId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);
