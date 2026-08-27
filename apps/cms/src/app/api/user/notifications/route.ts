import { db, createRecordId } from "@marble/drizzle";
import {
  member,
  userNotificationPreferences,
  workspaceNotificationPreferences,
} from "@marble/drizzle/schema";

import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/notifications";
import { notificationPreferencePatchSchema } from "@/lib/validations/notifications";

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
    const parsed = notificationPreferencePatchSchema.safeParse(
      await request.json()
    );

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const now = new Date();
    const patch = parsed.data;

    if (patch.scope === "user") {
      if (patch.key === "marketing") {
        await db
          .insert(userNotificationPreferences)
          .values({
            id: createRecordId(),
            userId: sessionData.user.id,
            marketing: patch.value,
            product: true,
            ...(patch.value
              ? {
                  marketingConsentedAt: now,
                  marketingConsentSource: "settings",
                }
              : { marketingUnsubscribedAt: now }),
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: userNotificationPreferences.userId,
            set: patch.value
              ? {
                  marketing: true,
                  marketingConsentedAt: now,
                  marketingConsentSource: "settings",
                  marketingUnsubscribedAt: null,
                  updatedAt: now,
                }
              : {
                  marketing: false,
                  marketingUnsubscribedAt: now,
                  updatedAt: now,
                },
          });
      } else {
        await db
          .insert(userNotificationPreferences)
          .values({
            id: createRecordId(),
            userId: sessionData.user.id,
            marketing: false,
            product: patch.value,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: userNotificationPreferences.userId,
            set: {
              product: patch.value,
              updatedAt: now,
            },
          });
      }

      return NextResponse.json(
        await getNotificationPreferences(sessionData.user.id, workspaceId)
      );
    }

    await db
      .insert(workspaceNotificationPreferences)
      .values({
        id: createRecordId(),
        memberId: foundMember.id,
        usageAlerts: patch.key === "usageAlerts" ? patch.value : true,
        subscriptions: patch.key === "subscriptions" ? patch.value : true,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: workspaceNotificationPreferences.memberId,
        set:
          patch.key === "usageAlerts"
            ? { usageAlerts: patch.value, updatedAt: now }
            : { subscriptions: patch.value, updatedAt: now },
      });

    return NextResponse.json(
      await getNotificationPreferences(sessionData.user.id, workspaceId)
    );
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
