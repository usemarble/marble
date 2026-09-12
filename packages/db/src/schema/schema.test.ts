import { getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  account,
  apiKey,
  author,
  authorSocial,
  category,
  exportJob,
  field,
  fieldOption,
  fieldValue,
  importItem,
  importJob,
  invitation,
  media,
  member,
  post,
  postToAuthor,
  postToTag,
  schema,
  session,
  shareLink,
  subscription,
  tag,
  usageAlert,
  usageEvent,
  user,
  userNotificationPreferences,
  verification,
  webhookDelivery,
  webhookDeliveryAttempt,
  webhookEndpoint,
  workspace,
  workspaceEvent,
  workspaceNotificationPreferences,
} from "./index";

const tables = {
  account,
  apiKey,
  author,
  authorSocial,
  category,
  exportJob,
  field,
  fieldOption,
  fieldValue,
  importItem,
  importJob,
  invitation,
  media,
  member,
  post,
  postToAuthor,
  postToTag,
  session,
  shareLink,
  subscription,
  tag,
  usageAlert,
  usageEvent,
  user,
  userNotificationPreferences,
  verification,
  webhookDelivery,
  webhookDeliveryAttempt,
  webhookEndpoint,
  workspace,
  workspaceEvent,
  workspaceNotificationPreferences,
};

describe("physical table mappings", () => {
  it("preserves Better Auth table names", () => {
    expect(
      [user, session, account, verification, workspace, member, invitation].map(
        getTableName
      )
    ).toEqual([
      "user",
      "session",
      "account",
      "verification",
      "workspace",
      "member",
      "invitation",
    ]);
  });

  it("preserves the PascalCase ShareLink table name", () => {
    expect(getTableName(shareLink)).toBe("ShareLink");
  });

  it("exposes every domain table through the assembled schema", () => {
    for (const [name, table] of Object.entries(tables)) {
      expect(schema[name as keyof typeof schema]).toBe(table);
    }
  });
});
