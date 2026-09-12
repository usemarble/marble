import type {
  PlanType as DrizzlePlanType,
  SubscriptionRecurringInterval as DrizzleSubscriptionRecurringInterval,
  SubscriptionStatus as DrizzleSubscriptionStatus,
} from "@marble/db";

export type {
  PlanType,
  SubscriptionRecurringInterval,
  SubscriptionStatus,
} from "@marble/db";

export function isStalePolarEvent(
  lastPolarEventAt: Date | null | undefined,
  eventTimestamp: Date
): boolean {
  return !!lastPolarEventAt && lastPolarEventAt > eventTimestamp;
}

export function getPlanType(productName: string): DrizzlePlanType | null {
  const plan = productName.toLowerCase();
  if (/^pro($|[ _-])/.test(plan)) {
    return "pro";
  }
  if (/^hobby($|[ _-])/.test(plan)) {
    return "hobby";
  }
  return null;
}

export function getSubscriptionStatus(
  polarStatus: string
): DrizzleSubscriptionStatus | null {
  switch (polarStatus) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "canceled":
      return "canceled";
    case "past_due":
    case "incomplete":
    case "unpaid":
      return "past_due";
    case "incomplete_expired":
      return "expired";
    default:
      return null;
  }
}

export function getRecurringInterval(
  polarInterval: string | null | undefined
): DrizzleSubscriptionRecurringInterval {
  if (!polarInterval) {
    return "month";
  }
  const normalized = polarInterval.toLowerCase();
  if (
    normalized === "day" ||
    normalized === "week" ||
    normalized === "month" ||
    normalized === "year"
  ) {
    return normalized;
  }
  return "month";
}
