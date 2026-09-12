import { member, subscription, usageEvent, workspace } from "@marble/db/schema";
import { sendUsageLimitEmail } from "@marble/email";
import { getWorkspacePlan, PLAN_LIMITS, type PlanType } from "@marble/utils";
import { Redis } from "@upstash/redis/cloudflare";
import { and, count, desc, eq, gte, inArray, lt } from "drizzle-orm";
import { Resend } from "resend";
import type { DbClient } from "@/lib/db";

const USAGE_KEY_PREFIX = "usage:api";
const USAGE_META_PREFIX = "usage:meta";

const META_TTL = 300;

interface UsageMeta {
  limit: number;
  plan: PlanType;
  periodEnd: string;
}

interface BillingPeriod {
  start: Date;
  end: Date;
}

async function getBillingPeriod(
  db: DbClient,
  workspaceId: string
): Promise<BillingPeriod> {
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
  const isValid =
    activeSubscription &&
    (activeSubscription.status === "active" ||
      activeSubscription.status === "trialing" ||
      (activeSubscription.status === "canceled" &&
        activeSubscription.cancelAtPeriodEnd &&
        activeSubscription.currentPeriodEnd &&
        activeSubscription.currentPeriodEnd > new Date()));

  if (
    isValid &&
    activeSubscription.currentPeriodStart &&
    activeSubscription.currentPeriodEnd
  ) {
    return {
      start: activeSubscription.currentPeriodStart,
      end: activeSubscription.currentPeriodEnd,
    };
  }

  const dayOfMonth = foundWorkspace.createdAt.getDate();
  const now = new Date();

  const getValidDate = (year: number, month: number, day: number) => {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return new Date(year, month, Math.min(day, lastDay));
  };

  let periodStart = getValidDate(now.getFullYear(), now.getMonth(), dayOfMonth);
  if (periodStart > now) {
    periodStart = getValidDate(
      now.getFullYear(),
      now.getMonth() - 1,
      dayOfMonth
    );
  }

  const periodEnd = getValidDate(
    periodStart.getFullYear(),
    periodStart.getMonth() + 1,
    dayOfMonth
  );

  return { start: periodStart, end: periodEnd };
}

export interface UsageCheckResult {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  percentage: number;
  plan: PlanType;
  thresholdCrossed?: 75 | 90 | 100;
}

async function getUsageMeta(
  redis: Redis,
  db: DbClient,
  workspaceId: string
): Promise<UsageMeta> {
  const metaKey = `${USAGE_META_PREFIX}:${workspaceId}`;
  const cached = await redis.get<UsageMeta>(metaKey);
  if (cached) {
    return cached;
  }

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

  const activeSubscription = foundWorkspace?.subscriptions[0];
  const plan = getWorkspacePlan(activeSubscription);
  const limit = PLAN_LIMITS[plan].maxApiRequests;
  const period = await getBillingPeriod(db, workspaceId);

  const meta: UsageMeta = {
    limit,
    plan,
    periodEnd: period.end.toISOString(),
  };

  await redis.set(metaKey, meta, { ex: META_TTL });
  return meta;
}

async function seedUsageCounterIfMissing(
  redis: Redis,
  db: DbClient,
  workspaceId: string,
  periodEnd: Date
): Promise<void> {
  const period = await getBillingPeriod(db, workspaceId);
  const [countResult] = await db
    .select({ count: count() })
    .from(usageEvent)
    .where(
      and(
        eq(usageEvent.workspaceId, workspaceId),
        eq(usageEvent.type, "api_request"),
        gte(usageEvent.createdAt, period.start),
        lt(usageEvent.createdAt, period.end)
      )
    );

  const counterKey = `${USAGE_KEY_PREFIX}:${workspaceId}`;
  const ttl = Math.max(
    1,
    Math.floor((periodEnd.getTime() - Date.now()) / 1000)
  );
  await redis.set(counterKey, countResult?.count ?? 0, { ex: ttl, nx: true });
}

export async function checkApiUsage(
  db: DbClient,
  workspaceId: string,
  redisCredentials?: { url: string; token: string }
): Promise<UsageCheckResult> {
  if (!redisCredentials) {
    return checkApiUsageFromDb(db, workspaceId);
  }

  const redis = new Redis({
    url: redisCredentials.url,
    token: redisCredentials.token,
  });

  try {
    const meta = await getUsageMeta(redis, db, workspaceId);
    const counterKey = `${USAGE_KEY_PREFIX}:${workspaceId}`;

    const exists = await redis.exists(counterKey);
    let currentUsage: number;

    if (exists) {
      currentUsage = await redis.incr(counterKey);
      currentUsage -= 1;
    } else {
      await seedUsageCounterIfMissing(
        redis,
        db,
        workspaceId,
        new Date(meta.periodEnd)
      );
      currentUsage = await redis.incr(counterKey);
      currentUsage -= 1;
    }

    const percentage = meta.limit > 0 ? (currentUsage / meta.limit) * 100 : 0;

    let thresholdCrossed: 75 | 90 | 100 | undefined;
    const nextPercentage =
      meta.limit > 0 ? ((currentUsage + 1) / meta.limit) * 100 : 0;

    if (nextPercentage >= 100 && percentage < 100) {
      thresholdCrossed = 100;
    } else if (nextPercentage >= 90 && percentage < 90) {
      thresholdCrossed = 90;
    } else if (nextPercentage >= 75 && percentage < 75) {
      thresholdCrossed = 75;
    }

    return {
      allowed: currentUsage < meta.limit,
      currentUsage,
      limit: meta.limit,
      percentage,
      plan: meta.plan,
      thresholdCrossed,
    };
  } catch (err) {
    console.error("[ApiUsage] Redis error, falling back to DB:", err);
    return checkApiUsageFromDb(db, workspaceId);
  }
}

async function checkApiUsageFromDb(
  db: DbClient,
  workspaceId: string
): Promise<UsageCheckResult> {
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

  const activeSubscription = foundWorkspace?.subscriptions[0];
  const plan = getWorkspacePlan(activeSubscription);
  const limit = PLAN_LIMITS[plan].maxApiRequests;

  const period = await getBillingPeriod(db, workspaceId);
  const [countResult] = await db
    .select({ count: count() })
    .from(usageEvent)
    .where(
      and(
        eq(usageEvent.workspaceId, workspaceId),
        eq(usageEvent.type, "api_request"),
        gte(usageEvent.createdAt, period.start),
        lt(usageEvent.createdAt, period.end)
      )
    );

  const currentUsage = countResult?.count ?? 0;
  const percentage = limit > 0 ? (currentUsage / limit) * 100 : 0;

  let thresholdCrossed: 75 | 90 | 100 | undefined;
  const nextPercentage = limit > 0 ? ((currentUsage + 1) / limit) * 100 : 0;

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

export async function notifyApiUsageThreshold(
  resendApiKey: string,
  db: DbClient,
  workspaceId: string,
  threshold: 75 | 90 | 100,
  currentUsage: number,
  limit: number
): Promise<void> {
  const owner = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, workspaceId),
      eq(member.role, "owner")
    ),
    with: {
      user: {
        columns: {
          email: true,
          name: true,
        },
      },
    },
  });

  if (!owner?.user) {
    console.warn(
      `[ApiUsage] No owner found for workspace ${workspaceId}, skipping notification`
    );
    return;
  }

  try {
    const resend = new Resend(resendApiKey);
    await sendUsageLimitEmail(resend, {
      userEmail: owner.user.email,
      userName: owner.user.name,
      featureName: "API Requests",
      usageAmount: currentUsage,
      limitAmount: limit,
      workspaceId,
    });
    console.log(
      `[ApiUsage] Sent ${threshold}% threshold email for workspace ${workspaceId}`
    );
  } catch (error) {
    console.error("[ApiUsage] Failed to send threshold notification:", error);
  }
}
