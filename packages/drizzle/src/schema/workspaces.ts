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

export const workspace = pgTable(
  "workspace",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    logo: text("logo"),
    metadata: text("metadata"),
    description: text("description"),
    subdomain: text("subdomain"),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    timezone: text("timezone").default("Europe/London").notNull(),
  },
  (table) => [
    uniqueIndex("workspace_slug_key").using(
      "btree",
      table.slug.asc().nullsLast().op("text_ops")
    ),
    uniqueIndex("workspace_subdomain_key").using(
      "btree",
      table.subdomain.asc().nullsLast().op("text_ops")
    ),
  ]
);

export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    organizationId: text("organizationId").notNull(),
    userId: text("userId").notNull(),
    role: text("role"),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("member_organizationId_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops")
    ),
    index("member_organizationId_userId_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
      table.userId.asc().nullsLast().op("text_ops")
    ),
    index("member_userId_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [workspace.id],
      name: "member_organizationId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "member_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const invitation = pgTable(
  "invitation",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    organizationId: text("organizationId").notNull(),
    email: text("email").notNull(),
    role: text("role"),
    status: text("status").notNull(),
    expiresAt: timestamp("expiresAt", { precision: 3, mode: "date" }).notNull(),
    inviterId: text("inviterId").notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("invitation_email_idx").using(
      "btree",
      table.email.asc().nullsLast().op("text_ops")
    ),
    index("invitation_inviterId_idx").using(
      "btree",
      table.inviterId.asc().nullsLast().op("text_ops")
    ),
    index("invitation_organizationId_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.inviterId],
      foreignColumns: [user.id],
      name: "invitation_inviterId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [workspace.id],
      name: "invitation_organizationId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const userNotificationPreferences = pgTable(
  "user_notification_preferences",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    userId: text("userId").notNull(),
    marketing: boolean("marketing").default(false).notNull(),
    product: boolean("product").default(true).notNull(),
    marketingConsentedAt: timestamp({ precision: 3, mode: "date" }),
    marketingConsentSource: text("marketingConsentSource"),
    marketingUnsubscribedAt: timestamp({ precision: 3, mode: "date" }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("user_notification_preferences_userId_key").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "user_notification_preferences_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const workspaceNotificationPreferences = pgTable(
  "workspace_notification_preferences",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    memberId: text("memberId").notNull(),
    usageAlerts: boolean("usageAlerts").default(true).notNull(),
    subscriptions: boolean("subscriptions").default(true).notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("workspace_notification_preferences_memberId_key").using(
      "btree",
      table.memberId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.memberId],
      foreignColumns: [member.id],
      name: "workspace_notification_preferences_memberId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);
