import { db } from "@marble/db";
import { UsageEventType } from "@prisma/client";
import { sendUsageLimitEmailAction } from "../actions/email";
import { getWorkspacePlan, PLAN_LIMITS } from "../plans";
import { createPolarClient } from "../polar/client";

interface TrackWebhookUsageArgs {
  workspaceId: string | null | undefined;
  endpoint: string;
  event: string;
  webhookId: string;
  format: string;
  status?: "success" | "failure";
}

interface BillingPeriod {
  start: Date;
  end: Date;
}

interface UsageCheckResult {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  percentage: number;
  plan: "hobby" | "pro";
  thresholdCrossed?: 75 | 90 | 100;
}

/**
 * Calculate the billing period for a workspace.
 * - Free users: Based on workspace creation date
 * - Paid users: Based on subscription period from Polar
 */
export async function getBillingPeriod(
  workspaceId: string
): Promise<BillingPeriod> {
  const workspace = await db.organization.findUnique({
    where: { id: workspaceId },
    select: {
      createdAt: true,
      subscriptions: {
        where: {
          status: { in: ["active", "trialing"] },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          currentPeriodStart: true,
          currentPeriodEnd: true,
        },
      },
    },
  });

  if (!workspace) {
    // Fallback to current month
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { start, end };
  }

  // If there's an active subscription, use its billing period
  const subscription = workspace.subscriptions[0];
  if (subscription?.currentPeriodStart && subscription?.currentPeriodEnd) {
    return {
      start: subscription.currentPeriodStart,
      end: subscription.currentPeriodEnd,
    };
  }

  // For free users, calculate period based on workspace creation date
  const createdAt = workspace.createdAt;
  const now = new Date();
  const dayOfMonth = createdAt.getDate();

  const getValidDate = (year: number, month: number, day: number) => {
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    return new Date(year, month, Math.min(day, lastDayOfMonth));
  };

  // Find the current period start
  let periodStart = getValidDate(now.getFullYear(), now.getMonth(), dayOfMonth);

  // If we haven't reached this month's anniversary yet, use last month's
  if (periodStart > now) {
    periodStart = getValidDate(
      now.getFullYear(),
      now.getMonth() - 1,
      dayOfMonth
    );
  }

  // Period end is one month after start
  const periodEnd = getValidDate(
    periodStart.getFullYear(),
    periodStart.getMonth() + 1,
    dayOfMonth
  );

  return { start: periodStart, end: periodEnd };
}

/**
 * Get current webhook usage for a workspace in their billing period
 */
export async function getWebhookUsage(workspaceId: string): Promise<number> {
  const period = await getBillingPeriod(workspaceId);

  const count = await db.usageEvent.count({
    where: {
      workspaceId,
      type: UsageEventType.webhook_delivery,
      createdAt: {
        gte: period.start,
        lt: period.end,
      },
    },
  });

  return count;
}

/**
 * Check if a webhook can be sent based on usage limits
 *
 * TODO: Performance optimization - At scale (thousands of daily webhooks across
 * many workspaces), consider caching the usage count in Redis with a short TTL
 * (e.g., 60s). Currently this does 2-3 DB reads per dispatch which is fine for
 * typical usage (~3-33 webhooks/day per workspace).
 */
export async function checkWebhookUsage(
  workspaceId: string
): Promise<UsageCheckResult> {
  // Get workspace with subscription
  const workspace = await db.organization.findUnique({
    where: { id: workspaceId },
    select: {
      subscriptions: {
        where: {
          status: { in: ["active", "trialing", "canceled"] },
        },
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

  const subscription = workspace?.subscriptions[0];
  const plan = getWorkspacePlan(subscription);
  const limit = PLAN_LIMITS[plan].maxWebhookEvents;
  const currentUsage = await getWebhookUsage(workspaceId);
  const percentage = limit > 0 ? (currentUsage / limit) * 100 : 0;

  // Determine if a threshold was just crossed
  let thresholdCrossed: 75 | 90 | 100 | undefined;
  const nextUsage = currentUsage + 1;
  const nextPercentage = limit > 0 ? (nextUsage / limit) * 100 : 0;

  if (nextPercentage >= 100 && percentage < 100) {
    thresholdCrossed = 100;
  } else if (nextPercentage >= 90 && percentage < 90) {
    thresholdCrossed = 90;
  } else if (nextPercentage >= 75 && percentage < 75) {
    thresholdCrossed = 75;
  }

  return {
    allowed: currentUsage < limit,
    currentUsage,
    limit,
    percentage,
    plan,
    thresholdCrossed,
  };
}

/**
 * Get workspace owner's email for notifications
 */
async function getWorkspaceOwnerEmail(
  workspaceId: string
): Promise<{ email: string; name: string } | null> {
  const owner = await db.member.findFirst({
    where: {
      organizationId: workspaceId,
      role: "owner",
    },
    select: {
      user: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  if (!owner?.user) {
    return null;
  }

  return {
    email: owner.user.email,
    name: owner.user.name,
  };
}

/**
 * Send usage threshold notification email to workspace owner
 */
export async function notifyUsageThreshold(
  workspaceId: string,
  threshold: 75 | 90 | 100,
  currentUsage: number,
  limit: number,
  _plan: "hobby" | "pro"
): Promise<void> {
  const owner = await getWorkspaceOwnerEmail(workspaceId);
  if (!owner) {
    console.warn(
      `[WebhookUsage] No owner found for workspace ${workspaceId}, skipping notification`
    );
    return;
  }

  try {
    await sendUsageLimitEmailAction({
      userEmail: owner.email,
      userName: owner.name,
      featureName: "Webhooks",
      usageAmount: currentUsage,
      limitAmount: limit,
      workspaceId,
    });

    console.log(
      `[WebhookUsage] Sent ${threshold}% threshold email to ${owner.email}`
    );
  } catch (error) {
    console.error(
      "[WebhookUsage] Failed to send threshold notification:",
      error
    );
  }
}

/**
 * Track webhook usage and enforce limits
 */
export async function trackWebhookUsage({
  workspaceId,
  endpoint,
  event,
  webhookId,
  format,
}: TrackWebhookUsageArgs): Promise<{ tracked: boolean }> {
  if (!workspaceId) {
    return { tracked: false };
  }

  const polarClient = createPolarClient();

  try {
    await db.usageEvent.create({
      data: {
        type: "webhook_delivery",
        workspaceId,
        endpoint,
      },
    });
  } catch (error) {
    console.error("[WebhookUsage] Failed to store usage event:", error);
  }

  let customerId = workspaceId;

  try {
    const organization = await db.organization.findFirst({
      where: {
        id: workspaceId,
      },
      select: {
        members: {
          where: {
            role: "owner",
          },
          select: {
            userId: true,
          },
        },
      },
    });
    if (organization?.members[0]?.userId) {
      customerId = organization.members[0].userId;
    }
  } catch (error) {
    console.error("[WebhookUsage] Failed to get customer ID:", error);
  }

  if (polarClient) {
    try {
      await polarClient.events.ingest({
        events: [
          {
            name: "webhook_delivery",
            externalCustomerId: customerId,
            metadata: {
              workspaceId,
              endpoint,
              event,
              webhookId,
              format,
            },
          },
        ],
      });
    } catch (error) {
      console.error("[WebhookUsage] Failed to ingest Polar event:", error);
    }
  }

  return { tracked: true };
}
