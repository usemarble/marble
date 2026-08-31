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
import {
  apiKeyTypeEnum,
  apiScopeEnum,
  exportFormatEnum,
  exportJobStatusEnum,
  fieldTypeEnum,
  importFormatEnum,
  importItemStatusEnum,
  importJobStatusEnum,
  importSourceEnum,
  mediaTypeEnum,
  payloadFormatEnum,
  planTypeEnum,
  postStatusEnum,
  subscriptionRecurringIntervalEnum,
  subscriptionStatusEnum,
  usageAlertKindEnum,
  usageEventTypeEnum,
  webhookDeliveryStatusEnum,
  workspaceEventActorTypeEnum,
  workspaceEventResourceTypeEnum,
  workspaceEventSourceEnum,
  workspaceEventTypeEnum,
} from "./enums";

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

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("emailVerified").notNull(),
    image: text("image"),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("user_email_key").using(
      "btree",
      table.email.asc().nullsLast().op("text_ops")
    ),
  ]
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    expiresAt: timestamp("expiresAt", { precision: 3, mode: "date" }).notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId").notNull(),
    activeOrganizationId: text("activeOrganizationId"),
  },
  (table) => [
    index("session_activeOrganizationId_idx").using(
      "btree",
      table.activeOrganizationId.asc().nullsLast().op("text_ops")
    ),
    index("session_token_idx").using(
      "btree",
      table.token.asc().nullsLast().op("text_ops")
    ),
    uniqueIndex("session_token_key").using(
      "btree",
      table.token.asc().nullsLast().op("text_ops")
    ),
    index("session_userId_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "session_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId").notNull(),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp({ precision: 3, mode: "date" }),
    refreshTokenExpiresAt: timestamp({ precision: 3, mode: "date" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("account_providerId_accountId_idx").using(
      "btree",
      table.providerId.asc().nullsLast().op("text_ops"),
      table.accountId.asc().nullsLast().op("text_ops")
    ),
    index("account_userId_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "account_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt", { precision: 3, mode: "date" }).notNull(),
    createdAt: timestamp({ precision: 3, mode: "date" }),
    updatedAt: timestamp({ precision: 3, mode: "date" }),
  },
  (table) => [
    index("verification_identifier_idx").using(
      "btree",
      table.identifier.asc().nullsLast().op("text_ops")
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
