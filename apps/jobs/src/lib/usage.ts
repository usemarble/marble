import { sendUsageLimitEmail } from "@marble/email";
import { getWorkspacePlan, PLAN_LIMITS } from "@marble/utils";
import { Resend } from "resend";
import type { DbClient } from "./db";

type UsageThreshold = 75 | 90 | 100;
type UsageAlertKind = "warning" | "critical" | "exhausted";

const USAGE_ALERT_THRESHOLDS = {
  warning: 75,
  critical: 90,
  exhausted: 100,
} as const satisfies Record<UsageAlertKind, UsageThreshold>;

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

/**
 * Detects Prisma unique constraint errors without importing Prisma runtime types
 * into the worker bundle.
 */
function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

/**
 * Returns a calendar-safe date for monthly fallback billing cycles, clamping
 * days like the 31st to the last day of shorter months.
 */
function getValidDate(year: number, month: number, day: number) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, lastDay));
}

/**
 * Resolves the billing window used for monthly usage enforcement.
 *
 * Active paid subscriptions use the provider's current period. Workspaces
 * without an active subscription fall back to a monthly cycle anchored to their
 * creation day.
 */
async function getBillingPeriod(
  db: DbClient,
  workspaceId: string
): Promise<UsagePeriod> {
  const workspace = await db.organization.findUnique({
    where: { id: workspaceId },
    select: {
      createdAt: true,
      subscriptions: {
        where: { status: { in: ["active", "trialing", "canceled"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          status: true,
          cancelAtPeriodEnd: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
        },
      },
    },
  });

  if (!workspace) {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    };
  }

  const subscription = workspace.subscriptions[0];
  const isActive =
    subscription?.status === "active" ||
    subscription?.status === "trialing" ||
    (subscription?.status === "canceled" &&
      subscription.cancelAtPeriodEnd &&
      subscription.currentPeriodEnd &&
      subscription.currentPeriodEnd > new Date());

  if (
    isActive &&
    subscription.currentPeriodStart &&
    subscription.currentPeriodEnd
  ) {
    return {
      start: subscription.currentPeriodStart,
      end: subscription.currentPeriodEnd,
    };
  }

  const now = new Date();
  const dayOfMonth = workspace.createdAt.getDate();
  let start = getValidDate(now.getFullYear(), now.getMonth(), dayOfMonth);

  if (start > now) {
    start = getValidDate(now.getFullYear(), now.getMonth() - 1, dayOfMonth);
  }

  return {
    start,
    end: getValidDate(start.getFullYear(), start.getMonth() + 1, dayOfMonth),
  };
}

/**
 * Returns the first configured threshold crossed by moving from current usage
 * to the next counted usage value.
 */
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

/**
 * Checks the current billing-period webhook delivery count, plan limit, and
 * whether sending one more delivery would cross an alert threshold.
 */
export async function checkWebhookUsage(
  db: DbClient,
  workspaceId: string
): Promise<WebhookUsageCheck> {
  const workspace = await db.organization.findUnique({
    where: { id: workspaceId },
    select: {
      subscriptions: {
        where: { status: { in: ["active", "trialing", "canceled"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          plan: true,
          status: true,
          cancelAtPeriodEnd: true,
          currentPeriodEnd: true,
        },
      },
    },
  });

  const plan = getWorkspacePlan(workspace?.subscriptions[0]);
  const limit = PLAN_LIMITS[plan].maxWebhookEvents;
  const period = await getBillingPeriod(db, workspaceId);
  const currentUsage = await db.usageEvent.count({
    where: {
      workspaceId,
      type: "webhook_delivery",
      createdAt: { gte: period.start, lt: period.end },
    },
  });

  return {
    allowed: currentUsage < limit,
    currentUsage,
    limit,
    period,
    alertKind: getCrossedAlertKind(currentUsage, currentUsage + 1, limit),
  };
}

/**
 * Records a successful webhook delivery against the workspace's monthly usage.
 * Test deliveries intentionally skip this path in the consumer.
 */
export async function recordWebhookUsage(
  db: DbClient,
  workspaceId: string,
  endpoint: string
) {
  await db.usageEvent.create({
    data: {
      type: "webhook_delivery",
      workspaceId,
      endpoint,
    },
  });
}

/**
 * Reserves and sends a webhook usage email once per alert kind per billing
 * period. The unique `usage_alert` row is created before sending so concurrent
 * deliveries cannot send duplicate emails. If the email send fails, the
 * reservation is removed so a later delivery can retry the alert.
 */
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

  const owner = await db.member.findFirst({
    where: {
      organizationId: workspaceId,
      role: "owner",
      OR: [
        { notificationPreferences: null },
        { notificationPreferences: { usageAlerts: true } },
      ],
    },
    select: {
      user: { select: { email: true, name: true } },
    },
  });

  if (!owner?.user.email) {
    console.warn(
      `[WebhookUsage] No alertable owner found for workspace ${workspaceId}`
    );
    return;
  }

  let alert: { id: string };

  try {
    alert = await db.usageAlert.create({
      data: {
        workspaceId,
        type: "webhook_delivery",
        kind,
        periodStart: period.start,
        periodEnd: period.end,
        emailSentTo: owner.user.email,
      },
      select: {
        id: true,
      },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      console.error("[WebhookUsage] Failed to reserve usage alert:", error);
      return;
    }
    return;
  }

  try {
    const resend = new Resend(resendApiKey);
    await sendUsageLimitEmail(resend, {
      userEmail: owner.user.email,
      userName: owner.user.name,
      featureName: "Webhook Events",
      usageAmount,
      limitAmount,
      workspaceId,
    });
    console.log(
      `[WebhookUsage] Sent ${kind} usage email for workspace ${workspaceId}`
    );
  } catch (error) {
    await db.usageAlert
      .delete({
        where: { id: alert.id },
      })
      .catch((deleteError) => {
        console.error(
          "[WebhookUsage] Failed to clear usage alert reservation:",
          deleteError
        );
      });

    console.error("[WebhookUsage] Failed to send threshold email:", error);
  }
}
