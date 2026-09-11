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
import {
  planTypeEnum,
  subscriptionRecurringIntervalEnum,
  subscriptionStatusEnum,
} from "./enums";
import { workspace } from "./workspaces";

export const subscription = pgTable(
  "subscription",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    userId: text("userId").notNull(),
    plan: planTypeEnum().notNull(),
    status: subscriptionStatusEnum().notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
    cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").notNull(),
    canceledAt: timestamp({ precision: 3, mode: "date" }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    currentPeriodEnd: timestamp("currentPeriodEnd", {
      precision: 3,
      mode: "date",
    }).notNull(),
    currentPeriodStart: timestamp("currentPeriodStart", {
      precision: 3,
      mode: "date",
    }).notNull(),
    endedAt: timestamp({ precision: 3, mode: "date" }),
    endsAt: timestamp({ precision: 3, mode: "date" }),
    polarId: text("polarId").notNull(),
    workspaceId: text("workspaceId").notNull(),
    amount: integer("amount").default(20).notNull(),
    currency: text("currency").default("USD").notNull(),
    discountId: text("discountId"),
    productId: text("productId"),
    recurringInterval: subscriptionRecurringIntervalEnum()
      .default("month")
      .notNull(),
    startedAt: timestamp({ precision: 3, mode: "date" }),
    lastPolarEventAt: timestamp({ precision: 3, mode: "date" }),
  },
  (table) => [
    uniqueIndex("subscription_polarId_key").using(
      "btree",
      table.polarId.asc().nullsLast().op("text_ops")
    ),
    index("subscription_status_idx").using(
      "btree",
      table.status.asc().nullsLast().op("enum_ops")
    ),
    index("subscription_userId_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops")
    ),
    index("subscription_workspaceId_status_idx").using(
      "btree",
      table.workspaceId.asc().nullsLast().op("text_ops"),
      table.status.asc().nullsLast().op("enum_ops")
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "subscription_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.workspaceId],
      foreignColumns: [workspace.id],
      name: "subscription_workspaceId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);
