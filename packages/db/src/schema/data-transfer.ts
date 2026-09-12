import { createId } from "@paralleldrive/cuid2";
import {
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import {
  exportFormatEnum,
  exportJobStatusEnum,
  importFormatEnum,
  importItemStatusEnum,
  importJobStatusEnum,
  importSourceEnum,
} from "./enums";
import { workspace } from "./workspaces";

export const exportJob = pgTable(
  "export_job",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    workspaceId: text("workspaceId").notNull(),
    status: exportJobStatusEnum().default("queued").notNull(),
    format: exportFormatEnum().default("json").notNull(),
    scope: jsonb("scope").notNull(),
    storageKey: text("storageKey"),
    fileSize: integer("fileSize"),
    downloadTokenHash: text("downloadTokenHash"),
    expiresAt: timestamp({ precision: 3, mode: "date" }),
    startedAt: timestamp({ precision: 3, mode: "date" }),
    completedAt: timestamp({ precision: 3, mode: "date" }),
    failedAt: timestamp({ precision: 3, mode: "date" }),
    errorMessage: text("errorMessage"),
    emailSentAt: timestamp({ precision: 3, mode: "date" }),
    attemptCount: integer("attemptCount").default(0).notNull(),
    createdById: text("createdById"),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("export_job_expiresAt_idx").using(
      "btree",
      table.expiresAt.asc().nullsLast().op("timestamp_ops")
    ),
    index("export_job_workspaceId_createdAt_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops"),
      table.createdAt.asc().nullsLast().op("timestamp_ops")
    ),
    index("export_job_workspaceId_status_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops"),
      table.status.asc().nullsLast().op("enum_ops")
    ),
    foreignKey({
      columns: [table.workspaceId],
      foreignColumns: [workspace.id],
      name: "export_job_workspaceId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.createdById],
      foreignColumns: [user.id],
      name: "export_job_createdById_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ]
);

export const importJob = pgTable(
  "import_job",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    workspaceId: text("workspaceId").notNull(),
    source: importSourceEnum().notNull(),
    status: importJobStatusEnum().default("queued").notNull(),
    format: importFormatEnum(),
    sourceUrl: text("sourceUrl"),
    uploadKey: text("uploadKey"),
    totalItems: integer("totalItems").default(0).notNull(),
    readyItems: integer("readyItems").default(0).notNull(),
    errorItems: integer("errorItems").default(0).notNull(),
    importedItems: integer("importedItems").default(0).notNull(),
    mapping: jsonb("mapping"),
    startedAt: timestamp({ precision: 3, mode: "date" }),
    completedAt: timestamp({ precision: 3, mode: "date" }),
    failedAt: timestamp({ precision: 3, mode: "date" }),
    errorMessage: text("errorMessage"),
    createdById: text("createdById"),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("import_job_workspaceId_createdAt_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops"),
      table.createdAt.asc().nullsLast().op("timestamp_ops")
    ),
    index("import_job_workspaceId_status_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops"),
      table.status.asc().nullsLast().op("enum_ops")
    ),
    uniqueIndex("import_job_id_workspaceId_key").using(
      "btree",
      table.id.asc().nullsLast().op("text_ops"),
      table.workspaceId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.workspaceId],
      foreignColumns: [workspace.id],
      name: "import_job_workspaceId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.createdById],
      foreignColumns: [user.id],
      name: "import_job_createdById_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ]
);

export const importItem = pgTable(
  "import_item",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    importJobId: text("importJobId").notNull(),
    workspaceId: text("workspaceId").notNull(),
    status: importItemStatusEnum().default("pending").notNull(),
    sourceRef: text("sourceRef"),
    title: text("title"),
    slug: text("slug"),
    content: text("content"),
    contentJson: jsonb("contentJson"),
    description: text("description"),
    coverImage: text("coverImage"),
    rawCategory: text("rawCategory"),
    rawTags: jsonb("rawTags"),
    rawAuthor: text("rawAuthor"),
    resolvedCategoryId: text("resolvedCategoryId"),
    resolvedTagIds: jsonb("resolvedTagIds"),
    postId: text("postId"),
    errors: jsonb("errors"),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("import_item_importJobId_status_idx").using(
      "btree",
      table.importJobId.asc().nullsLast().op("text_ops"),
      table.status.asc().nullsLast().op("enum_ops")
    ),
    index("import_item_workspaceId_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.importJobId, table.workspaceId],
      foreignColumns: [importJob.id, importJob.workspaceId],
      name: "import_item_importJobId_workspaceId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.workspaceId],
      foreignColumns: [workspace.id],
      name: "import_item_workspaceId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);
