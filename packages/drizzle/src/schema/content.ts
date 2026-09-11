import { createId } from "@paralleldrive/cuid2";
import {
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { postStatusEnum } from "./enums";
import { author, category, tag } from "./taxonomy";
import { workspace } from "./workspaces";

export const post = pgTable(
  "post",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    coverImage: text("coverImage"),
    contentJson: jsonb("contentJson").notNull(),
    description: text("description").notNull(),
    views: integer("views").default(0).notNull(),
    workspaceId: text("workspaceId").notNull(),
    slug: text("slug").notNull(),
    categoryId: text("categoryId").notNull(),
    status: postStatusEnum().default("draft").notNull(),
    featured: boolean("featured").default(false).notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    publishedAt: timestamp("publishedAt", {
      precision: 3,
      mode: "date",
    }).notNull(),
    attribution: jsonb("attribution"),
    primaryAuthorId: text("primaryAuthorId"),
  },
  (table) => [
    index("post_categoryId_idx").using(
      "btree",
      table.categoryId.asc().nullsLast().op("text_ops")
    ),
    index("post_workspaceId_createdAt_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops"),
      table.createdAt.asc().nullsLast().op("timestamp_ops")
    ),
    uniqueIndex("post_workspaceId_slug_key").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops"),
      table.slug.asc().nullsLast().op("text_ops")
    ),
    index("post_workspaceId_status_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops"),
      table.status.asc().nullsLast().op("enum_ops")
    ),
    index("post_workspaceId_status_publishedAt_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops"),
      table.status.asc().nullsLast().op("enum_ops"),
      table.publishedAt.asc().nullsLast().op("timestamp_ops")
    ),
    uniqueIndex("post_id_workspaceId_key").using(
      "btree",
      table.id.asc().nullsLast().op("text_ops"),
      table.workspaceId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [category.id],
      name: "post_categoryId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
    foreignKey({
      columns: [table.workspaceId],
      foreignColumns: [workspace.id],
      name: "post_workspaceId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.primaryAuthorId],
      foreignColumns: [author.id],
      name: "post_primaryAuthorId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ]
);

export const postToTag = pgTable(
  "_PostToTag",
  {
    a: text("A").notNull(),
    b: text("B").notNull(),
  },
  (table) => [
    index().using("btree", table.b.asc().nullsLast().op("text_ops")),
    foreignKey({
      columns: [table.a],
      foreignColumns: [post.id],
      name: "_PostToTag_A_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.b],
      foreignColumns: [tag.id],
      name: "_PostToTag_B_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    primaryKey({ columns: [table.a, table.b], name: "_PostToTag_AB_pkey" }),
  ]
);

export const postToAuthor = pgTable(
  "_PostToAuthor",
  {
    a: text("A").notNull(),
    b: text("B").notNull(),
  },
  (table) => [
    index().using("btree", table.b.asc().nullsLast().op("text_ops")),
    foreignKey({
      columns: [table.a],
      foreignColumns: [author.id],
      name: "_PostToAuthor_A_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.b],
      foreignColumns: [post.id],
      name: "_PostToAuthor_B_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    primaryKey({ columns: [table.a, table.b], name: "_PostToAuthor_AB_pkey" }),
  ]
);

export const shareLink = pgTable(
  "ShareLink",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    token: text("token").notNull(),
    postId: text("postId").notNull(),
    workspaceId: text("workspaceId").notNull(),
    password: text("password"),
    expiresAt: timestamp("expiresAt", { precision: 3, mode: "date" }).notNull(),
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
    index("ShareLink_expiresAt_idx").using(
      "btree",
      table.expiresAt.asc().nullsLast().op("timestamp_ops")
    ),
    index("ShareLink_isActive_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops")
    ),
    index("ShareLink_postId_idx").using(
      "btree",
      table.postId.asc().nullsLast().op("text_ops")
    ),
    uniqueIndex("ShareLink_token_key").using(
      "btree",
      table.token.asc().nullsLast().op("text_ops")
    ),
    index("ShareLink_workspaceId_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.postId],
      foreignColumns: [post.id],
      name: "ShareLink_postId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.workspaceId],
      foreignColumns: [workspace.id],
      name: "ShareLink_workspaceId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);
