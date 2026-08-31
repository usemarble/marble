import { createRecordId, db } from "@marble/drizzle";
import {
  member,
  userNotificationPreferences,
  workspaceNotificationPreferences,
} from "@marble/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/notifications";

async function getNotificationPreferences(
  userId: string,
  organizationId?: string | null
) {
  const preferences = await db.query.userNotificationPreferences.findFirst({
    where: eq(userNotificationPreferences.userId, userId),
    columns: {
      marketing: true,
      product: true,
    },
  });

  let workspacePreferences: {
    usageAlerts: boolean;
    subscriptions: boolean;
  } | null = null;

  if (organizationId) {
    const foundMember = await db.query.member.findFirst({
      where: and(
        eq(member.userId, userId),
        eq(member.organizationId, organizationId)
      ),
      with: {
        notificationPreferences: {
          columns: {
            usageAlerts: true,
            subscriptions: true,
          },
        },
      },
    });
    workspacePreferences = foundMember?.notificationPreferences ?? null;
  }

  return {
    user: preferences ?? DEFAULT_NOTIFICATION_PREFERENCES.user,
    workspace:
      workspacePreferences ?? DEFAULT_NOTIFICATION_PREFERENCES.workspace,
  };
}

export async function GET() {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { sessionData, workspaceId } = accessData;

  return NextResponse.json(
    await getNotificationPreferences(sessionData.user.id, workspaceId)
  );
}

export async function PATCH(request: Request) {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { member: foundMember, sessionData, workspaceId } = accessData;

  try {
    const body = await request.json();
    const { scope, key, value } = body as {
      scope: "user" | "workspace";
      key: string;
      value: boolean;
    };

    if (typeof value !== "boolean") {
      return NextResponse.json(
        { error: "Value must be a boolean" },
        { status: 400 }
      );
    }

    if (scope === "user") {
      const allowedKeys = ["marketing", "product"] as const;
      type UserKey = (typeof allowedKeys)[number];

      if (!allowedKeys.includes(key as UserKey)) {
        return NextResponse.json({ error: "Invalid key" }, { status: 400 });
      }

      const now = new Date();
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

      await db
        .insert(userNotificationPreferences)
        .values({
          id: createRecordId(),
          userId: sessionData.user.id,
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
        });

      return NextResponse.json(
        await getNotificationPreferences(sessionData.user.id, workspaceId)
      );
    }

    if (scope === "workspace") {
      const allowedKeys = ["usageAlerts", "subscriptions"] as const;
      type WorkspaceKey = (typeof allowedKeys)[number];

      if (!allowedKeys.includes(key as WorkspaceKey)) {
        return NextResponse.json({ error: "Invalid key" }, { status: 400 });
      }

      const now = new Date();

      await db
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
            [key]: value,
            updatedAt: now,
          },
        });

      return NextResponse.json(
        await getNotificationPreferences(sessionData.user.id, workspaceId)
      );
    }

    return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
