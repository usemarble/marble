import { createRecordId } from "@marble/drizzle/id";
import { isPgUniqueViolation } from "@marble/drizzle/pg-errors";
import {
  member,
  subscription,
  usageAlert,
  usageEvent,
  user,
  workspace,
  workspaceNotificationPreferences,
} from "@marble/drizzle/schema";
import { sendUsageLimitEmail } from "@marble/email";
import { getWorkspacePlan, PLAN_LIMITS } from "@marble/utils";
import { and, count, desc, eq, gte, inArray, isNull, lt, or } from "drizzle-orm";
import { Resend } from "resend";
import { USAGE_ALERT_THRESHOLDS } from "@/lib/constants";
import type { DbClient } from "@/lib/db";

type UsageAlertKind = keyof typeof USAGE_ALERT_THRESHOLDS;

interface UsagePeriod {
  start: Date;
  end: Date;
}

interface WebhookUsageCheck {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  period: UsagePeriod;
  alertKind?: UsageAlertKind;
}

const USAGE_ALERT_UNIQUE =
  "usage_alert_workspaceId_type_kind_periodStart_periodEnd_key";

function getValidDate(year: number, month: number, day: number) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, lastDay));
}

async function getBillingPeriod(
  db: DbClient,
  workspaceId: string
): Promise<UsagePeriod> {
  const foundWorkspace = await db.query.workspace.findFirst({
    where: eq(workspace.id, workspaceId),
    columns: {
      createdAt: true,
    },
    with: {
      subscriptions: {
        where: inArray(subscription.status, ["active", "trialing", "canceled"]),
        orderBy: desc(subscription.createdAt),
        limit: 1,
        columns: {
          status: true,
          cancelAtPeriodEnd: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
        },
      },
    },
  });

  if (!foundWorkspace) {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    };
  }

  const activeSubscription = foundWorkspace.subscriptions[0];
  const isActive =
    activeSubscription?.status === "active" ||
    activeSubscription?.status === "trialing" ||
    (activeSubscription?.status === "canceled" &&
      activeSubscription.cancelAtPeriodEnd &&
      activeSubscription.currentPeriodEnd &&
      activeSubscription.currentPeriodEnd > new Date());

  if (
    isActive &&
    activeSubscription.currentPeriodStart &&
    activeSubscription.currentPeriodEnd
  ) {
    return {
      start: activeSubscription.currentPeriodStart,
      end: activeSubscription.currentPeriodEnd,
    };
  }

  const now = new Date();
  const dayOfMonth = foundWorkspace.createdAt.getDate();
  let start = getValidDate(now.getFullYear(), now.getMonth(), dayOfMonth);

  if (start > now) {
    start = getValidDate(now.getFullYear(), now.getMonth() - 1, dayOfMonth);
  }

  return {
    start,
    end: getValidDate(start.getFullYear(), start.getMonth() + 1, dayOfMonth),
  };
}

function getCrossedAlertKind(
  currentUsage: number,
  nextUsage: number,
  limit: number
): UsageAlertKind | undefined {
  if (limit <= 0) {
    return;
  }

  const currentPercentage = (currentUsage / limit) * 100;
  const nextPercentage = (nextUsage / limit) * 100;

  if (
    nextPercentage >= USAGE_ALERT_THRESHOLDS.exhausted &&
    currentPercentage < USAGE_ALERT_THRESHOLDS.exhausted
  ) {
    return "exhausted";
  }

  if (
    nextPercentage >= USAGE_ALERT_THRESHOLDS.critical &&
    currentPercentage < USAGE_ALERT_THRESHOLDS.critical
  ) {
    return "critical";
  }

  if (
    nextPercentage >= USAGE_ALERT_THRESHOLDS.warning &&
    currentPercentage < USAGE_ALERT_THRESHOLDS.warning
  ) {
    return "warning";
  }
}

export async function checkWebhookUsage(
  db: DbClient,
  workspaceId: string
): Promise<WebhookUsageCheck> {
  const foundWorkspace = await db.query.workspace.findFirst({
    where: eq(workspace.id, workspaceId),
    with: {
      subscriptions: {
        where: inArray(subscription.status, ["active", "trialing", "canceled"]),
        orderBy: desc(subscription.createdAt),
        limit: 1,
        columns: {
          plan: true,
          status: true,
          cancelAtPeriodEnd: true,
          currentPeriodEnd: true,
        },
      },
    },
  });

  const plan = getWorkspacePlan(foundWorkspace?.subscriptions[0]);
  const limit = PLAN_LIMITS[plan].maxWebhookEvents;
  const period = await getBillingPeriod(db, workspaceId);

  const [countResult] = await db
    .select({ count: count() })
    .from(usageEvent)
    .where(
      and(
        eq(usageEvent.workspaceId, workspaceId),
        eq(usageEvent.type, "webhook_delivery"),
        gte(usageEvent.createdAt, period.start),
        lt(usageEvent.createdAt, period.end)
      )
    );

  const currentUsage = countResult?.count ?? 0;

  return {
    allowed: currentUsage < limit,
    currentUsage,
    limit,
    period,
    alertKind: getCrossedAlertKind(currentUsage, currentUsage + 1, limit),
  };
}

export async function recordWebhookUsage(
  db: DbClient,
  workspaceId: string,
  endpoint: string
) {
  await db.insert(usageEvent).values({
    id: createRecordId(),
    type: "webhook_delivery",
    workspaceId,
    endpoint,
  });
}

export async function sendWebhookUsageAlert(
  db: DbClient,
  {
    resendApiKey,
    workspaceId,
    kind,
    usageAmount,
    limitAmount,
    period,
  }: {
    resendApiKey?: string;
    workspaceId: string;
    kind: UsageAlertKind;
    usageAmount: number;
    limitAmount: number;
    period: UsagePeriod;
  }
) {
  if (!resendApiKey) {
    console.warn(
      "[WebhookUsage] RESEND_API_KEY not configured, skipping alert"
    );
    return;
  }

  const [owner] = await db
    .select({
      email: user.email,
      name: user.name,
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .leftJoin(
      workspaceNotificationPreferences,
      eq(workspaceNotificationPreferences.memberId, member.id)
    )
    .where(
      and(
        eq(member.organizationId, workspaceId),
        eq(member.role, "owner"),
        or(
          isNull(workspaceNotificationPreferences.id),
          eq(workspaceNotificationPreferences.usageAlerts, true)
        )
      )
    )
    .limit(1);

  if (!owner?.email) {
    console.warn(
      `[WebhookUsage] No alertable owner found for workspace ${workspaceId}`
    );
    return;
  }

  let alert: { id: string };

  try {
    const [created] = await db
      .insert(usageAlert)
      .values({
        id: createRecordId(),
        workspaceId,
        type: "webhook_delivery",
        kind,
        periodStart: period.start,
        periodEnd: period.end,
        emailSentTo: owner.email,
      })
      .returning({ id: usageAlert.id });

    if (!created) {
      console.error("[WebhookUsage] Failed to reserve usage alert");
      return;
    }

    alert = created;
  } catch (error) {
    if (isPgUniqueViolation(error, USAGE_ALERT_UNIQUE)) {
      return;
    }
    console.error("[WebhookUsage] Failed to reserve usage alert:", error);
    return;
  }

  try {
    const resend = new Resend(resendApiKey);
    await sendUsageLimitEmail(resend, {
      userEmail: owner.email,
      userName: owner.name,
      featureName: "Webhook Events",
      usageAmount,
      limitAmount,
      workspaceId,
    });
    console.log(
      `[WebhookUsage] Sent ${kind} usage email for workspace ${workspaceId}`
    );
  } catch (error) {
    await db
      .delete(usageAlert)
      .where(eq(usageAlert.id, alert.id))
      .catch((deleteError) => {
        console.error(
          "[WebhookUsage] Failed to clear usage alert reservation:",
          deleteError
        );
      });

    console.error("[WebhookUsage] Failed to send threshold email:", error);
  }
}
