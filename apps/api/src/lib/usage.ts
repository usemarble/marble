import type { createClient } from "@marble/db/workers";
import { sendUsageLimitEmail } from "@marble/email";
import { Redis } from "@upstash/redis/cloudflare";
import { Resend } from "resend";

type DbClient = ReturnType<typeof createClient>;

type PlanType = "pro" | "hobby";

const PLAN_LIMITS: Record<PlanType, { maxApiRequests: number }> = {
  hobby: { maxApiRequests: 10_000 },
  pro: { maxApiRequests: 50_000 },
};

const USAGE_KEY_PREFIX = "usage:api";
const USAGE_META_PREFIX = "usage:meta";

const META_TTL = 300;

interface UsageMeta {
  limit: number;
  plan: PlanType;
  periodEnd: string;
}

function getWorkspacePlan(
  subscription?: {
    plan?: string;
    status?: string;
    cancelAtPeriodEnd?: boolean;
    currentPeriodEnd?: Date | null;
  } | null
): PlanType {
  if (!subscription?.plan) {
    return "hobby";
  }

  const isActive =
    subscription.status === "active" ||
    subscription.status === "trialing" ||
    (subscription.status === "canceled" &&
      subscription.cancelAtPeriodEnd &&
      subscription.currentPeriodEnd &&
      subscription.currentPeriodEnd > new Date());

  if (!isActive) {
    return "hobby";
  }

  return subscription.plan.toLowerCase() === "pro" ? "pro" : "hobby";
}

interface BillingPeriod {
  start: Date;
  end: Date;
}

async function getBillingPeriod(
  db: DbClient,
  workspaceId: string
): Promise<BillingPeriod> {
  const workspace = await db.organization.findUnique({
    where: { id: workspaceId },
    select: {
      createdAt: true,
      subscriptions: {
        where: { status: { in: ["active", "trialing"] } },
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
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    };
  }

  const subscription = workspace.subscriptions[0];
  if (subscription?.currentPeriodStart && subscription?.currentPeriodEnd) {
    return {
      start: subscription.currentPeriodStart,
      end: subscription.currentPeriodEnd,
    };
  }

  const dayOfMonth = workspace.createdAt.getDate();
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

  const subscription = workspace?.subscriptions[0];
  const plan = getWorkspacePlan(subscription);
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

async function seedUsageCounter(
  redis: Redis,
  db: DbClient,
  workspaceId: string,
  periodEnd: Date
): Promise<number> {
  const period = await getBillingPeriod(db, workspaceId);
  const count = await db.usageEvent.count({
    where: {
      workspaceId,
      type: "api_request",
      createdAt: { gte: period.start, lt: period.end },
    },
  });

  const counterKey = `${USAGE_KEY_PREFIX}:${workspaceId}`;
  const ttl = Math.max(
    1,
    Math.floor((periodEnd.getTime() - Date.now()) / 1000)
  );
  await redis.set(counterKey, count, { ex: ttl });

  return count;
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
      currentUsage = await seedUsageCounter(
        redis,
        db,
        workspaceId,
        new Date(meta.periodEnd)
      );
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

  const subscription = workspace?.subscriptions[0];
  const plan = getWorkspacePlan(subscription);
  const limit = PLAN_LIMITS[plan].maxApiRequests;

  const period = await getBillingPeriod(db, workspaceId);
  const currentUsage = await db.usageEvent.count({
    where: {
      workspaceId,
      type: "api_request",
      createdAt: { gte: period.start, lt: period.end },
    },
  });

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
  const owner = await db.member.findFirst({
    where: { organizationId: workspaceId, role: "owner" },
    select: {
      user: { select: { email: true, name: true } },
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
      `[ApiUsage] Sent ${threshold}% threshold email to ${owner.user.email}`
    );
  } catch (error) {
    console.error("[ApiUsage] Failed to send threshold notification:", error);
  }
}
