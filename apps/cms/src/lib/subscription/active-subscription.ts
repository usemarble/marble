import { db } from "@marble/drizzle";
import { subscription } from "@marble/drizzle/schema";
import { and, desc, eq, gt, or } from "drizzle-orm";

export function activeSubscriptionWhere(referenceDate = new Date()) {
  return or(
    eq(subscription.status, "active"),
    eq(subscription.status, "trialing"),
    and(
      eq(subscription.status, "canceled"),
      eq(subscription.cancelAtPeriodEnd, true),
      gt(subscription.currentPeriodEnd, referenceDate)
    )
  );
}

const activeSubscriptionColumns = {
  id: subscription.id,
  status: subscription.status,
  plan: subscription.plan,
  currentPeriodStart: subscription.currentPeriodStart,
  currentPeriodEnd: subscription.currentPeriodEnd,
  cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
  canceledAt: subscription.canceledAt,
} as const;

export async function findActiveWorkspaceSubscription(workspaceId: string) {
  const rows = await db
    .select(activeSubscriptionColumns)
    .from(subscription)
    .where(
      and(eq(subscription.workspaceId, workspaceId), activeSubscriptionWhere())
    )
    .orderBy(desc(subscription.createdAt))
    .limit(1);

  return rows[0] ?? null;
}

export async function findActiveWorkspaceSubscriptionPlanFields(
  workspaceId: string
) {
  const rows = await db
    .select({
      plan: subscription.plan,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      currentPeriodEnd: subscription.currentPeriodEnd,
    })
    .from(subscription)
    .where(
      and(eq(subscription.workspaceId, workspaceId), activeSubscriptionWhere())
    )
    .orderBy(desc(subscription.createdAt))
    .limit(1);

  return rows[0] ?? null;
}
