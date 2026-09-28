import { createId } from "@paralleldrive/cuid2";
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
import { session, user } from "./auth";

// Tables for Better Auth's jwt(), oauthProvider()/mcp() and cimd() plugins.
// @better-auth/mcp and @better-auth/oauth-provider share this schema.

export const jwks = pgTable("jwks", {
  id: text("id").primaryKey().$defaultFn(createId).notNull(),
  publicKey: text("publicKey").notNull(),
  privateKey: text("privateKey").notNull(),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" }).notNull(),
  expiresAt: timestamp("expiresAt", { precision: 3, mode: "date" }),
  alg: text("alg"),
  crv: text("crv"),
});

export const oauthClient = pgTable(
  "oauthClient",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    clientId: text("clientId").notNull().unique("oauthClient_clientId_key"),
    clientSecret: text("clientSecret"),
    clientDiscoveryId: text("clientDiscoveryId"),
    disabled: boolean("disabled").default(false),
    skipConsent: boolean("skipConsent"),
    enableEndSession: boolean("enableEndSession"),
    subjectType: text("subjectType"),
    scopes: text("scopes").array(),
    clientCredentialsScopes: text("clientCredentialsScopes")
      .array()
      .default([]),
    userId: text("userId"),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" }),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" }),
    name: text("name"),
    uri: text("uri"),
    icon: text("icon"),
    contacts: text("contacts").array(),
    tos: text("tos"),
    policy: text("policy"),
    softwareId: text("softwareId"),
    softwareVersion: text("softwareVersion"),
    softwareStatement: text("softwareStatement"),
    redirectUris: text("redirectUris").array().notNull(),
    postLogoutRedirectUris: text("postLogoutRedirectUris").array(),
    backchannelLogoutUri: text("backchannelLogoutUri"),
    backchannelLogoutSessionRequired: boolean(
      "backchannelLogoutSessionRequired"
    ),
    tokenEndpointAuthMethod: text("tokenEndpointAuthMethod"),
    applicationType: text("applicationType"),
    jwks: text("jwks"),
    jwksUri: text("jwksUri"),
    grantTypes: text("grantTypes").array(),
    responseTypes: text("responseTypes").array(),
    requirePKCE: boolean("requirePKCE"),
    dpopBoundAccessTokens: boolean("dpopBoundAccessTokens").default(false),
    referenceId: text("referenceId"),
    metadata: jsonb("metadata"),
  },
  (table) => [
    index("oauthClient_userId_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "oauthClient_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const oauthResource = pgTable("oauthResource", {
  id: text("id").primaryKey().$defaultFn(createId).notNull(),
  identifier: text("identifier")
    .notNull()
    .unique("oauthResource_identifier_key"),
  name: text("name").notNull(),
  accessTokenTtl: integer("accessTokenTtl"),
  refreshTokenTtl: integer("refreshTokenTtl"),
  signingAlgorithm: text("signingAlgorithm"),
  signingKeyId: text("signingKeyId"),
  allowedScopes: text("allowedScopes").array(),
  customClaims: jsonb("customClaims"),
  dpopBoundAccessTokensRequired: boolean(
    "dpopBoundAccessTokensRequired"
  ).default(false),
  disabled: boolean("disabled").default(false),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" }),
  updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" }),
  policyVersion: integer("policyVersion").default(1),
  metadata: jsonb("metadata"),
});

export const oauthClientResource = pgTable(
  "oauthClientResource",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    clientId: text("clientId").notNull(),
    resourceId: text("resourceId").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" }),
  },
  (table) => [
    index("oauthClientResource_clientId_idx").using(
      "btree",
      table.clientId.asc().nullsLast().op("text_ops")
    ),
    index("oauthClientResource_resourceId_idx").using(
      "btree",
      table.resourceId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.clientId],
      foreignColumns: [oauthClient.clientId],
      name: "oauthClientResource_clientId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.resourceId],
      foreignColumns: [oauthResource.identifier],
      name: "oauthClientResource_resourceId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const oauthRefreshToken = pgTable(
  "oauthRefreshToken",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    token: text("token").notNull(),
    clientId: text("clientId").notNull(),
    sessionId: text("sessionId"),
    userId: text("userId").notNull(),
    referenceId: text("referenceId"),
    authorizationCodeId: text("authorizationCodeId"),
    resources: text("resources").array(),
    requestedUserInfoClaims: text("requestedUserInfoClaims").array(),
    expiresAt: timestamp("expiresAt", { precision: 3, mode: "date" }).notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" }).notNull(),
    revoked: timestamp("revoked", { precision: 3, mode: "date" }),
    rotatedAt: timestamp("rotatedAt", { precision: 3, mode: "date" }),
    rotationReplayResponse: text("rotationReplayResponse"),
    rotationReplayExpiresAt: timestamp("rotationReplayExpiresAt", {
      precision: 3,
      mode: "date",
    }),
    authTime: timestamp("authTime", { precision: 3, mode: "date" }),
    confirmation: jsonb("confirmation"),
    scopes: text("scopes").array().notNull(),
  },
  (table) => [
    uniqueIndex("oauthRefreshToken_token_key").using(
      "btree",
      table.token.asc().nullsLast().op("text_ops")
    ),
    index("oauthRefreshToken_clientId_idx").using(
      "btree",
      table.clientId.asc().nullsLast().op("text_ops")
    ),
    index("oauthRefreshToken_sessionId_idx").using(
      "btree",
      table.sessionId.asc().nullsLast().op("text_ops")
    ),
    index("oauthRefreshToken_userId_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops")
    ),
    index("oauthRefreshToken_authorizationCodeId_idx").using(
      "btree",
      table.authorizationCodeId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.clientId],
      foreignColumns: [oauthClient.clientId],
      name: "oauthRefreshToken_clientId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.sessionId],
      foreignColumns: [session.id],
      name: "oauthRefreshToken_sessionId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "oauthRefreshToken_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const oauthAccessToken = pgTable(
  "oauthAccessToken",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    token: text("token").notNull(),
    clientId: text("clientId").notNull(),
    sessionId: text("sessionId"),
    userId: text("userId"),
    referenceId: text("referenceId"),
    authorizationCodeId: text("authorizationCodeId"),
    resources: text("resources").array(),
    requestedUserInfoClaims: text("requestedUserInfoClaims").array(),
    refreshId: text("refreshId"),
    expiresAt: timestamp("expiresAt", { precision: 3, mode: "date" }).notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" }).notNull(),
    revoked: timestamp("revoked", { precision: 3, mode: "date" }),
    confirmation: jsonb("confirmation"),
    scopes: text("scopes").array().notNull(),
  },
  (table) => [
    uniqueIndex("oauthAccessToken_token_key").using(
      "btree",
      table.token.asc().nullsLast().op("text_ops")
    ),
    index("oauthAccessToken_clientId_idx").using(
      "btree",
      table.clientId.asc().nullsLast().op("text_ops")
    ),
    index("oauthAccessToken_sessionId_idx").using(
      "btree",
      table.sessionId.asc().nullsLast().op("text_ops")
    ),
    index("oauthAccessToken_userId_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops")
    ),
    index("oauthAccessToken_authorizationCodeId_idx").using(
      "btree",
      table.authorizationCodeId.asc().nullsLast().op("text_ops")
    ),
    index("oauthAccessToken_refreshId_idx").using(
      "btree",
      table.refreshId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.clientId],
      foreignColumns: [oauthClient.clientId],
      name: "oauthAccessToken_clientId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.sessionId],
      foreignColumns: [session.id],
      name: "oauthAccessToken_sessionId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "oauthAccessToken_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.refreshId],
      foreignColumns: [oauthRefreshToken.id],
      name: "oauthAccessToken_refreshId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const oauthConsent = pgTable(
  "oauthConsent",
  {
    id: text("id").primaryKey().$defaultFn(createId).notNull(),
    clientId: text("clientId").notNull(),
    userId: text("userId"),
    referenceId: text("referenceId"),
    resources: text("resources").array(),
    requestedUserInfoClaims: text("requestedUserInfoClaims").array(),
    scopes: text("scopes").array().notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" }).notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" }).notNull(),
  },
  (table) => [
    index("oauthConsent_clientId_idx").using(
      "btree",
      table.clientId.asc().nullsLast().op("text_ops")
    ),
    index("oauthConsent_userId_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.clientId],
      foreignColumns: [oauthClient.clientId],
      name: "oauthConsent_clientId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "oauthConsent_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

// Replay guard for private_key_jwt assertions; the id is a hash of the JTI.
export const oauthClientAssertion = pgTable("oauthClientAssertion", {
  id: text("id").primaryKey().notNull(),
  expiresAt: timestamp("expiresAt", { precision: 3, mode: "date" }).notNull(),
});
