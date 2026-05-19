import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/notifications";

async function getNotificationPreferences(
  userId: string,
  organizationId?: string | null
) {
  const preferences = await db.userNotificationPreferences.findUnique({
    where: { userId },
    select: {
      marketing: true,
      product: true,
    },
  });

  let workspacePreferences: {
    usageAlerts: boolean;
    subscriptions: boolean;
  } | null = null;

  if (organizationId) {
    const member = await db.member.findFirst({
      where: { userId, organizationId },
      select: {
        notificationPreferences: {
          select: {
            usageAlerts: true,
            subscriptions: true,
          },
        },
      },
    });
    workspacePreferences = member?.notificationPreferences ?? null;
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

  const { member, sessionData, workspaceId } = accessData;

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

      const data: Record<string, unknown> = { [key]: value };

      if (key === "marketing") {
        if (value) {
          data.marketingConsentedAt = new Date();
          data.marketingConsentSource = "settings";
          data.marketingUnsubscribedAt = null;
        } else {
          data.marketingUnsubscribedAt = new Date();
        }
      }

      await db.userNotificationPreferences.upsert({
        where: { userId: sessionData.user.id },
        create: {
          userId: sessionData.user.id,
          ...data,
        },
        update: data,
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

      await db.workspaceNotificationPreferences.upsert({
        where: { memberId: member.id },
        create: {
          memberId: member.id,
          [key]: value,
        },
        update: { [key]: value },
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
