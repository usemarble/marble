import { createId } from "@paralleldrive/cuid2";
import {
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { mediaTypeEnum } from "./enums";
import { workspace } from "./workspaces";

export const media = pgTable(
  "media",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    name: text("name").notNull(),
    url: text("url").notNull(),
    size: integer("size").notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
    workspaceId: text("workspaceId").notNull(),
    type: mediaTypeEnum().default("image").notNull(),
    alt: text("alt"),
    blurHash: text("blurHash"),
    duration: integer("duration"),
    height: integer("height"),
    mimeType: text("mimeType"),
    width: integer("width"),
    storageKey: text("storageKey").notNull(),
  },
  (table) => [
    index("media_workspaceId_createdAt_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops"),
      table.createdAt.asc().nullsLast().op("timestamp_ops")
    ),
    index("media_workspaceId_type_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops"),
      table.type.asc().nullsLast().op("enum_ops")
    ),
    foreignKey({
      columns: [table.workspaceId],
      foreignColumns: [workspace.id],
      name: "media_workspaceId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);
