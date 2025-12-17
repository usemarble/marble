import {
  PlanType,
  type SubscriptionRecurringInterval,
  SubscriptionStatus,
} from "@prisma/client";

export function getPlanType(productName: string): PlanType | null {
  const plan = productName.toLowerCase();
  if (plan === "pro") {
    return PlanType.pro;
  }
  if (plan === "hobby") {
    return PlanType.hobby;
  }
  return null;
}

export function getSubscriptionStatus(
  polarStatus: string
): SubscriptionStatus | null {
  switch (polarStatus) {
    case "active":
      return SubscriptionStatus.active;
    case "trialing":
      return SubscriptionStatus.trialing;
    case "canceled":
      return SubscriptionStatus.canceled;
    case "past_due":
    case "incomplete":
    case "unpaid":
      return SubscriptionStatus.past_due;
    case "incomplete_expired":
      return SubscriptionStatus.expired;
    default:
      return null;
  }
}

export function getRecurringInterval(
  polarInterval: string | null | undefined
): SubscriptionRecurringInterval {
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
