import { createRecordId } from "@marble/db/id";
import {
  member,
  userNotificationPreferences,
  workspaceNotificationPreferences,
} from "@marble/db/schema";
import { and, eq } from "drizzle-orm";
import type { ServiceContext } from "../context";
import { transact } from "../lib/transaction";

export class NotificationError extends Error {
  readonly status: 400 | 403 | 500;
  constructor(status: 400 | 403 | 500, message: string) {
    super(message);
    this.status = status;
  }
}

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  user: { marketing: false, product: true },
  workspace: { usageAlerts: true, subscriptions: true },
};

const USER_KEYS = ["marketing", "product"];
const WORKSPACE_KEYS = ["usageAlerts", "subscriptions"];

/** The caller's personal preferences and their preferences in one workspace. */
export async function getNotificationPreferences(
  ctx: ServiceContext,
  userId: string,
  workspaceId: string
) {
  const preferences = await ctx.db.query.userNotificationPreferences.findFirst({
    where: eq(userNotificationPreferences.userId, userId),
    columns: { marketing: true, product: true },
  });

  const foundMember = await ctx.db.query.member.findFirst({
    where: and(
      eq(member.userId, userId),
      eq(member.organizationId, workspaceId)
    ),
    with: {
      notificationPreferences: {
        columns: { usageAlerts: true, subscriptions: true },
      },
    },
  });

  return {
    user: preferences ?? DEFAULT_NOTIFICATION_PREFERENCES.user,
    workspace:
      foundMember?.notificationPreferences ??
      DEFAULT_NOTIFICATION_PREFERENCES.workspace,
  };
}

export async function updateNotificationPreference(
  ctx: ServiceContext,
  userId: string,
  workspaceId: string,
  input: { scope: "user" | "workspace"; key: string; value: boolean }
) {
  const { scope, key, value } = input;
  if (!(scope === "user" ? USER_KEYS : WORKSPACE_KEYS).includes(key)) {
    throw new NotificationError(400, "Invalid key");
  }

  try {
    const now = new Date();

    if (scope === "user") {
      const data =
        key === "marketing"
          ? value
            ? {
                marketing: value,
                updatedAt: now,
                marketingConsentedAt: now,
                marketingConsentSource: "settings" as const,
                marketingUnsubscribedAt: null,
              }
            : {
                marketing: value,
                updatedAt: now,
                marketingUnsubscribedAt: now,
              }
          : {
              product: value,
              updatedAt: now,
            };

      await transact(ctx, ({ tx }) =>
        tx
          .insert(userNotificationPreferences)
          .values({
            id: createRecordId(),
            userId,
            marketing: key === "marketing" ? value : false,
            product: key === "product" ? value : true,
            ...(key === "marketing" && value
              ? {
                  marketingConsentedAt: now,
                  marketingConsentSource: "settings",
                }
              : {}),
            ...(key === "marketing" && !value
              ? { marketingUnsubscribedAt: now }
              : {}),
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: userNotificationPreferences.userId,
            set: data,
          })
      );
    } else {
      const foundMember = await ctx.db.query.member.findFirst({
        where: and(
          eq(member.userId, userId),
          eq(member.organizationId, workspaceId)
        ),
        columns: { id: true },
      });
      if (!foundMember) {
        throw new NotificationError(
          403,
          "You no longer have access to this workspace"
        );
      }

      await transact(ctx, ({ tx }) =>
        tx
          .insert(workspaceNotificationPreferences)
          .values({
            id: createRecordId(),
            memberId: foundMember.id,
            usageAlerts: key === "usageAlerts" ? value : true,
            subscriptions: key === "subscriptions" ? value : true,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: workspaceNotificationPreferences.memberId,
            set: {
              ...(key === "usageAlerts"
                ? { usageAlerts: value }
                : { subscriptions: value }),
              updatedAt: now,
            },
          })
      );
    }
  } catch (error) {
    if (error instanceof NotificationError) {
      throw error;
    }
    ctx.log.error(error instanceof Error ? error : new Error(String(error)));
    throw new NotificationError(500, "Failed to update preferences");
  }

  return getNotificationPreferences(ctx, userId, workspaceId);
}
