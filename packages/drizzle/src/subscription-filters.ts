import { and, eq, gt, or } from "drizzle-orm";
import { subscription } from "./schema/tables";

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
