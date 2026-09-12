import { createId } from "@paralleldrive/cuid2";
import {
  boolean,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { workspace } from "./workspaces";

export const author = pgTable(
  "author",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    name: text("name").notNull(),
    email: text("email"),
    bio: text("bio"),
    image: text("image"),
    role: text("role"),
    slug: text("slug").notNull(),
    workspaceId: text("workspaceId").notNull(),
    userId: text("userId"),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("author_userId_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops")
    ),
    index("author_workspaceId_isActive_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops"),
      table.isActive.asc().nullsLast().op("bool_ops")
    ),
    uniqueIndex("author_workspaceId_slug_key").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops"),
      table.slug.asc().nullsLast().op("text_ops")
    ),
    uniqueIndex("author_workspaceId_userId_key").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops"),
      table.userId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.workspaceId],
      foreignColumns: [workspace.id],
      name: "author_workspaceId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "author_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ]
);

export const authorSocial = pgTable(
  "author_social",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    authorId: text("authorId").notNull(),
    platform: text("platform").notNull(),
    url: text("url").notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("author_social_authorId_idx").using(
      "btree",
      table.authorId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.authorId],
      foreignColumns: [author.id],
      name: "author_social_authorId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const category = pgTable(
  "category",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    name: text("name").notNull(),
    description: text("description"),
    slug: text("slug").notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
    workspaceId: text("workspaceId").notNull(),
  },
  (table) => [
    index("category_workspaceId_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops")
    ),
    uniqueIndex("category_workspaceId_slug_key").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops"),
      table.slug.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.workspaceId],
      foreignColumns: [workspace.id],
      name: "category_workspaceId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const tag = pgTable(
  "tag",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    name: text("name").notNull(),
    description: text("description"),
    slug: text("slug").notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
    workspaceId: text("workspaceId").notNull(),
  },
  (table) => [
    index("tag_workspaceId_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops")
    ),
    uniqueIndex("tag_workspaceId_slug_key").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops"),
      table.slug.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.workspaceId],
      foreignColumns: [workspace.id],
      name: "tag_workspaceId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);
