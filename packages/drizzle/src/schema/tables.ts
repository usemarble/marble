import {
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
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

/** Better Auth organization → physical `workspace` table */
export const workspace = pgTable("workspace", {
  id: text("id").primaryKey().$defaultFn(createId).notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  metadata: text("metadata"),
  description: text("description"),
  subdomain: text("subdomain").unique(),
  updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date())
    .notNull(),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
    .$defaultFn(() => new Date())
    .notNull(),
  timezone: text("timezone").default("Europe/London").notNull(),
});

export const user = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(createId).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    expiresAt: timestamp("expiresAt", { precision: 3, mode: "date" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    activeOrganizationId: text("activeOrganizationId"),
  },
  (table) => [
    index("session_userId_idx").on(table.userId),
    index("session_token_idx").on(table.token),
    index("session_activeOrganizationId_idx").on(table.activeOrganizationId),
  ]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt", {
      precision: 3,
      mode: "date",
    }),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", {
      precision: 3,
      mode: "date",
    }),
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
    index("account_userId_idx").on(table.userId),
    index("account_providerId_accountId_idx").on(
      table.providerId,
      table.accountId
    ),
  ]
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt", { precision: 3, mode: "date" }).notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);

export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    organizationId: text("organizationId")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role"),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("member_userId_idx").on(table.userId),
    index("member_organizationId_idx").on(table.organizationId),
    index("member_organizationId_userId_idx").on(
      table.organizationId,
      table.userId
    ),
  ]
);

export const invitation = pgTable(
  "invitation",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    organizationId: text("organizationId")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    status: text("status").notNull(),
    expiresAt: timestamp("expiresAt", { precision: 3, mode: "date" }).notNull(),
    inviterId: text("inviterId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("invitation_organizationId_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
    index("invitation_inviterId_idx").on(table.inviterId),
  ]
);

export const userNotificationPreferences = pgTable(
  "user_notification_preferences",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    userId: text("userId")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    marketing: boolean("marketing").default(false).notNull(),
    product: boolean("product").default(true).notNull(),
    marketingConsentedAt: timestamp("marketingConsentedAt", {
      precision: 3,
      mode: "date",
    }),
    marketingConsentSource: text("marketingConsentSource"),
    marketingUnsubscribedAt: timestamp("marketingUnsubscribedAt", {
      precision: 3,
      mode: "date",
    }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  }
);

export const workspaceNotificationPreferences = pgTable(
  "workspace_notification_preferences",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    memberId: text("memberId")
      .notNull()
      .unique()
      .references(() => member.id, { onDelete: "cascade" }),
    usageAlerts: boolean("usageAlerts").default(true).notNull(),
    subscriptions: boolean("subscriptions").default(true).notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  }
);

export const subscription = pgTable(
  "subscription",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    plan: planTypeEnum("plan").notNull(),
    status: subscriptionStatusEnum("status").notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
    cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").notNull(),
    canceledAt: timestamp("canceledAt", { precision: 3, mode: "date" }),
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
    endedAt: timestamp("endedAt", { precision: 3, mode: "date" }),
    endsAt: timestamp("endsAt", { precision: 3, mode: "date" }),
    polarId: text("polarId").notNull().unique(),
    workspaceId: text("workspaceId")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    startedAt: timestamp("startedAt", { precision: 3, mode: "date" }),
    productId: text("productId"),
    amount: integer("amount").default(20).notNull(),
    currency: text("currency").default("USD").notNull(),
    discountId: text("discountId"),
    lastPolarEventAt: timestamp("lastPolarEventAt", {
      precision: 3,
      mode: "date",
    }),
    recurringInterval: subscriptionRecurringIntervalEnum("recurringInterval")
      .default("month")
      .notNull(),
  },
  (table) => [
    index("subscription_userId_idx").on(table.userId),
    index("subscription_status_idx").on(table.status),
    index("subscription_workspaceId_status_idx").on(
      table.workspaceId,
      table.status
    ),
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
    workspaceId: text("workspaceId")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    userId: text("userId").references(() => user.id, { onDelete: "set null" }),
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
    uniqueIndex("author_workspaceId_userId_key").on(
      table.workspaceId,
      table.userId
    ),
    uniqueIndex("author_workspaceId_slug_key").on(
      table.workspaceId,
      table.slug
    ),
    index("author_workspaceId_isActive_idx").on(
      table.workspaceId,
      table.isActive
    ),
    index("author_userId_idx").on(table.userId),
  ]
);

export const authorSocial = pgTable(
  "author_social",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    authorId: text("authorId")
      .notNull()
      .references(() => author.id, { onDelete: "cascade" }),
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
  (table) => [index("author_social_authorId_idx").on(table.authorId)]
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
    workspaceId: text("workspaceId")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("category_workspaceId_slug_key").on(
      table.workspaceId,
      table.slug
    ),
    index("category_workspaceId_idx").on(table.workspaceId),
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
    workspaceId: text("workspaceId")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("tag_workspaceId_slug_key").on(table.workspaceId, table.slug),
    index("tag_workspaceId_idx").on(table.workspaceId),
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
    workspaceId: text("workspaceId")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    categoryId: text("categoryId")
      .notNull()
      .references(() => category.id),
    status: postStatusEnum("status").default("draft").notNull(),
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
    primaryAuthorId: text("primaryAuthorId").references(() => author.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    uniqueIndex("post_workspaceId_slug_key").on(table.workspaceId, table.slug),
    uniqueIndex("post_id_workspaceId_key").on(table.id, table.workspaceId),
    index("post_workspaceId_status_idx").on(table.workspaceId, table.status),
    index("post_workspaceId_createdAt_idx").on(
      table.workspaceId,
      table.createdAt
    ),
    index("post_workspaceId_status_publishedAt_idx").on(
      table.workspaceId,
      table.status,
      table.publishedAt
    ),
    index("post_categoryId_idx").on(table.categoryId),
  ]
);

/** Prisma implicit M2M: Post ↔ Tag (A=Post, B=Tag alphabetically) */
export const postToTag = pgTable(
  "_PostToTag",
  {
    a: text("A")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    b: text("B")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("_PostToTag_AB_unique").on(table.a, table.b),
    index("_PostToTag_B_index").on(table.b),
  ]
);

/**
 * Prisma implicit M2M: Post ↔ Author via "PostToAuthor"
 * Alphabetically Author < Post → A=Author, B=Post
 */
export const postToAuthor = pgTable(
  "_PostToAuthor",
  {
    a: text("A")
      .notNull()
      .references(() => author.id, { onDelete: "cascade" }),
    b: text("B")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("_PostToAuthor_AB_unique").on(table.a, table.b),
    index("_PostToAuthor_B_index").on(table.b),
  ]
);

/** No @@map in Prisma — physical table is PascalCase `ShareLink` */
export const shareLink = pgTable(
  "ShareLink",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    token: text("token").notNull().unique(),
    postId: text("postId")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    workspaceId: text("workspaceId")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
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
    index("ShareLink_postId_idx").on(table.postId),
    index("ShareLink_workspaceId_idx").on(table.workspaceId),
    index("ShareLink_expiresAt_idx").on(table.expiresAt),
    index("ShareLink_isActive_idx").on(table.isActive),
  ]
);

export const media = pgTable(
  "media",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    name: text("name").notNull(),
    url: text("url").notNull(),
    storageKey: text("storageKey").notNull(),
    size: integer("size").notNull(),
    alt: text("alt"),
    mimeType: text("mimeType"),
    width: integer("width"),
    height: integer("height"),
    duration: integer("duration"),
    blurHash: text("blurHash"),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
    workspaceId: text("workspaceId")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    type: mediaTypeEnum("type").default("image").notNull(),
  },
  (table) => [
    index("media_workspaceId_createdAt_idx").on(
      table.workspaceId,
      table.createdAt
    ),
    index("media_workspaceId_type_idx").on(table.workspaceId, table.type),
  ]
);

export const field = pgTable(
  "field",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    workspaceId: text("workspaceId")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    type: fieldTypeEnum("type").notNull(),
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
    uniqueIndex("field_workspaceId_key_key").on(table.workspaceId, table.key),
    uniqueIndex("field_id_workspaceId_key").on(table.id, table.workspaceId),
    index("field_workspaceId_idx").on(table.workspaceId),
  ]
);

export const fieldOption = pgTable(
  "field_option",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    fieldId: text("fieldId").notNull(),
    workspaceId: text("workspaceId")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
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
    foreignKey({
      columns: [table.fieldId, table.workspaceId],
      foreignColumns: [field.id, field.workspaceId],
      name: "field_option_fieldId_workspaceId_fkey",
    }).onDelete("cascade"),
    uniqueIndex("field_option_fieldId_value_key").on(
      table.fieldId,
      table.value
    ),
    uniqueIndex("field_option_id_workspaceId_key").on(
      table.id,
      table.workspaceId
    ),
    index("field_option_fieldId_idx").on(table.fieldId),
    index("field_option_workspaceId_idx").on(table.workspaceId),
    index("field_option_fieldId_position_idx").on(
      table.fieldId,
      table.position
    ),
  ]
);

export const fieldValue = pgTable(
  "field_value",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    postId: text("postId").notNull(),
    fieldId: text("fieldId").notNull(),
    workspaceId: text("workspaceId")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
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
    foreignKey({
      columns: [table.postId, table.workspaceId],
      foreignColumns: [post.id, post.workspaceId],
      name: "field_value_postId_workspaceId_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.fieldId, table.workspaceId],
      foreignColumns: [field.id, field.workspaceId],
      name: "field_value_fieldId_workspaceId_fkey",
    }).onDelete("cascade"),
    uniqueIndex("field_value_postId_fieldId_key").on(
      table.postId,
      table.fieldId
    ),
    index("field_value_postId_idx").on(table.postId),
    index("field_value_fieldId_idx").on(table.fieldId),
    index("field_value_workspaceId_idx").on(table.workspaceId),
  ]
);

export const apiKey = pgTable(
  "api_key",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    workspaceId: text("workspaceId")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    userId: text("userId").references(() => user.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    prefix: text("prefix"),
    key: text("key").notNull().unique(),
    preview: text("preview").notNull(),
    type: apiKeyTypeEnum("type").default("public").notNull(),
    scopes: apiScopeEnum("scopes").array().default([]).notNull(),
    requestCount: integer("requestCount").default(0).notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    rateLimitTimeWindow: integer("rateLimitTimeWindow"),
    rateLimitMax: integer("rateLimitMax"),
    lastRequest: timestamp("lastRequest", { precision: 3, mode: "date" }),
    lastUsed: timestamp("lastUsed", { precision: 3, mode: "date" }),
    expiresAt: timestamp("expiresAt", { precision: 3, mode: "date" }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("api_key_workspaceId_idx").on(table.workspaceId),
    index("api_key_workspaceId_createdAt_idx").on(
      table.workspaceId,
      table.createdAt
    ),
    index("api_key_workspaceId_enabled_idx").on(
      table.workspaceId,
      table.enabled
    ),
    index("api_key_workspaceId_type_idx").on(table.workspaceId, table.type),
    index("api_key_key_idx").on(table.key),
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
    workspaceId: text("workspaceId")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
    events: workspaceEventTypeEnum("events").array().notNull(),
    format: payloadFormatEnum("format").default("json").notNull(),
  },
  (table) => [
    index("webhook_endpoint_workspaceId_idx").on(table.workspaceId),
    index("webhook_endpoint_workspaceId_enabled_idx").on(
      table.workspaceId,
      table.enabled
    ),
  ]
);

export const workspaceEvent = pgTable(
  "workspace_event",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    workspaceId: text("workspaceId")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    type: workspaceEventTypeEnum("type").notNull(),
    source: workspaceEventSourceEnum("source").default("dashboard").notNull(),
    resourceType: workspaceEventResourceTypeEnum("resourceType"),
    resourceId: text("resourceId"),
    actorType: workspaceEventActorTypeEnum("actorType"),
    actorId: text("actorId"),
    payload: jsonb("payload").default({}).notNull(),
    processedAt: timestamp("processedAt", { precision: 3, mode: "date" }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("workspace_event_workspaceId_createdAt_idx").on(
      table.workspaceId,
      table.createdAt
    ),
    index("workspace_event_workspaceId_type_idx").on(
      table.workspaceId,
      table.type
    ),
    index("workspace_event_workspaceId_resourceType_resourceId_idx").on(
      table.workspaceId,
      table.resourceType,
      table.resourceId
    ),
    index("workspace_event_workspaceId_processedAt_idx").on(
      table.workspaceId,
      table.processedAt
    ),
  ]
);

export const webhookDelivery = pgTable(
  "webhook_delivery",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    eventId: text("eventId")
      .notNull()
      .references(() => workspaceEvent.id, { onDelete: "cascade" }),
    workspaceId: text("workspaceId")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    webhookEndpointId: text("webhookEndpointId")
      .notNull()
      .references(() => webhookEndpoint.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    status: webhookDeliveryStatusEnum("status").default("pending").notNull(),
    isTest: boolean("isTest").default(false).notNull(),
    attemptCount: integer("attemptCount").default(0).notNull(),
    maxAttempts: integer("maxAttempts").default(3).notNull(),
    nextRetryAt: timestamp("nextRetryAt", { precision: 3, mode: "date" }),
    lastAttemptAt: timestamp("lastAttemptAt", { precision: 3, mode: "date" }),
    deliveredAt: timestamp("deliveredAt", { precision: 3, mode: "date" }),
    failedAt: timestamp("failedAt", { precision: 3, mode: "date" }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("webhook_delivery_eventId_idx").on(table.eventId),
    index("webhook_delivery_workspaceId_status_idx").on(
      table.workspaceId,
      table.status
    ),
    index("webhook_delivery_workspaceId_createdAt_idx").on(
      table.workspaceId,
      table.createdAt
    ),
    index("webhook_delivery_webhookEndpointId_idx").on(table.webhookEndpointId),
    uniqueIndex("webhook_delivery_eventId_webhookEndpointId_key").on(
      table.eventId,
      table.webhookEndpointId
    ),
  ]
);

export const webhookDeliveryAttempt = pgTable(
  "webhook_delivery_attempt",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    deliveryId: text("deliveryId")
      .notNull()
      .references(() => webhookDelivery.id, { onDelete: "cascade" }),
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
    uniqueIndex("webhook_delivery_attempt_deliveryId_attemptNumber_key").on(
      table.deliveryId,
      table.attemptNumber
    ),
    index("webhook_delivery_attempt_deliveryId_idx").on(table.deliveryId),
  ]
);

export const usageEvent = pgTable(
  "usage_event",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    type: usageEventTypeEnum("type").notNull(),
    workspaceId: text("workspaceId")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    endpoint: text("endpoint"),
    size: integer("size"),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("usage_event_workspaceId_type_createdAt_idx").on(
      table.workspaceId,
      table.type,
      table.createdAt
    ),
    index("usage_event_workspaceId_createdAt_idx").on(
      table.workspaceId,
      table.createdAt
    ),
  ]
);

export const usageAlert = pgTable(
  "usage_alert",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    workspaceId: text("workspaceId")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    type: usageEventTypeEnum("type").notNull(),
    kind: usageAlertKindEnum("kind").notNull(),
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
    ).on(
      table.workspaceId,
      table.type,
      table.kind,
      table.periodStart,
      table.periodEnd
    ),
    index("usage_alert_workspaceId_type_periodStart_periodEnd_idx").on(
      table.workspaceId,
      table.type,
      table.periodStart,
      table.periodEnd
    ),
  ]
);

export const exportJob = pgTable(
  "export_job",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    workspaceId: text("workspaceId")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    status: exportJobStatusEnum("status").default("queued").notNull(),
    format: exportFormatEnum("format").default("json").notNull(),
    scope: jsonb("scope").notNull(),
    storageKey: text("storageKey"),
    fileSize: integer("fileSize"),
    downloadTokenHash: text("downloadTokenHash"),
    expiresAt: timestamp("expiresAt", { precision: 3, mode: "date" }),
    startedAt: timestamp("startedAt", { precision: 3, mode: "date" }),
    completedAt: timestamp("completedAt", { precision: 3, mode: "date" }),
    failedAt: timestamp("failedAt", { precision: 3, mode: "date" }),
    errorMessage: text("errorMessage"),
    emailSentAt: timestamp("emailSentAt", { precision: 3, mode: "date" }),
    attemptCount: integer("attemptCount").default(0).notNull(),
    createdById: text("createdById").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("export_job_workspaceId_status_idx").on(
      table.workspaceId,
      table.status
    ),
    index("export_job_workspaceId_createdAt_idx").on(
      table.workspaceId,
      table.createdAt
    ),
    index("export_job_expiresAt_idx").on(table.expiresAt),
  ]
);

export const importJob = pgTable(
  "import_job",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    workspaceId: text("workspaceId")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    source: importSourceEnum("source").notNull(),
    status: importJobStatusEnum("status").default("queued").notNull(),
    format: importFormatEnum("format"),
    sourceUrl: text("sourceUrl"),
    uploadKey: text("uploadKey"),
    totalItems: integer("totalItems").default(0).notNull(),
    readyItems: integer("readyItems").default(0).notNull(),
    errorItems: integer("errorItems").default(0).notNull(),
    importedItems: integer("importedItems").default(0).notNull(),
    mapping: jsonb("mapping"),
    startedAt: timestamp("startedAt", { precision: 3, mode: "date" }),
    completedAt: timestamp("completedAt", { precision: 3, mode: "date" }),
    failedAt: timestamp("failedAt", { precision: 3, mode: "date" }),
    errorMessage: text("errorMessage"),
    createdById: text("createdById").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("import_job_id_workspaceId_key").on(
      table.id,
      table.workspaceId
    ),
    index("import_job_workspaceId_status_idx").on(
      table.workspaceId,
      table.status
    ),
    index("import_job_workspaceId_createdAt_idx").on(
      table.workspaceId,
      table.createdAt
    ),
  ]
);

export const importItem = pgTable(
  "import_item",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    importJobId: text("importJobId").notNull(),
    workspaceId: text("workspaceId")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    status: importItemStatusEnum("status").default("pending").notNull(),
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
    foreignKey({
      columns: [table.importJobId, table.workspaceId],
      foreignColumns: [importJob.id, importJob.workspaceId],
      name: "import_item_importJobId_workspaceId_fkey",
    }).onDelete("cascade"),
    index("import_item_importJobId_status_idx").on(
      table.importJobId,
      table.status
    ),
    index("import_item_workspaceId_idx").on(table.workspaceId),
  ]
);

/** Alias for Better Auth / CMS code that still says Organization */
export const organization = workspace;
