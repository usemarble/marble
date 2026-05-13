export type PlanType = "pro" | "hobby";

export interface PlanLimits {
  maxMembers: number;
  maxMediaStorage: number;
  maxApiRequests: number;
  maxWebhookEvents: number;
  features: {
    inviteMembers: boolean;
    advancedReadability: boolean;
    keywordOptimization: boolean;
    unlimitedPosts: boolean;
  };
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  hobby: {
    maxMembers: 1,
    maxMediaStorage: 1024,
    maxApiRequests: 10_000,
    maxWebhookEvents: 100,
    features: {
      inviteMembers: true,
      advancedReadability: false,
      keywordOptimization: false,
      unlimitedPosts: true,
    },
  },
  pro: {
    maxMembers: 5,
    maxMediaStorage: 10_240,
    maxApiRequests: 50_000,
    maxWebhookEvents: 1000,
    features: {
      inviteMembers: true,
      advancedReadability: true,
      keywordOptimization: false,
      unlimitedPosts: true,
    },
  },
};

/**
 * Returns true when a subscription should grant its paid plan limits.
 */
export function isSubscriptionActive(
  subscription?: {
    status?: string;
    cancelAtPeriodEnd?: boolean;
    currentPeriodEnd?: string | Date | null;
  } | null
): boolean {
  if (!subscription) {
    return false;
  }

  if (subscription.status === "active" || subscription.status === "trialing") {
    return true;
  }

  if (
    subscription.status === "canceled" &&
    subscription.cancelAtPeriodEnd &&
    subscription.currentPeriodEnd
  ) {
    const periodEnd =
      subscription.currentPeriodEnd instanceof Date
        ? subscription.currentPeriodEnd
        : new Date(subscription.currentPeriodEnd);
    return periodEnd > new Date();
  }

  return false;
}

/**
 * Resolves the active billing plan for a workspace subscription.
 */
export function getWorkspacePlan(
  subscription?: {
    plan?: string;
    status?: string;
    cancelAtPeriodEnd?: boolean;
    currentPeriodEnd?: string | Date | null;
  } | null
): PlanType {
  if (!subscription?.plan || !isSubscriptionActive(subscription)) {
    return "hobby";
  }

  return subscription.plan.toLowerCase() === "pro" ? "pro" : "hobby";
}

/**
 * Checks whether a plan includes a named feature.
 */
export function canPerformAction(
  plan: PlanType,
  action: keyof PlanLimits["features"]
): boolean {
  return PLAN_LIMITS[plan].features[action];
}

/**
 * Checks whether another member can be invited under the plan's member limit.
 */
export function canInviteMoreMembers(
  plan: PlanType,
  currentMemberCount: number
): boolean {
  const limits = PLAN_LIMITS[plan];
  return (
    currentMemberCount < limits.maxMembers && limits.features.inviteMembers
  );
}

/**
 * Returns the number of remaining member seats for a plan.
 */
export function getRemainingMemberSlots(
  plan: PlanType,
  currentMemberCount: number
): number {
  return Math.max(0, PLAN_LIMITS[plan].maxMembers - currentMemberCount);
}

/**
 * Returns all configured limits for a plan.
 */
export function getPlanLimits(plan: PlanType): PlanLimits {
  return PLAN_LIMITS[plan];
}

/**
 * Compares workspace usage values against the limits for a plan.
 */
export function isOverLimit(
  plan: PlanType,
  usage: {
    members?: number;
    mediaStorage?: number;
    apiRequests?: number;
    webhookEvents?: number;
  }
): {
  isOver: boolean;
  violations: string[];
} {
  const limits = PLAN_LIMITS[plan];
  const violations: string[] = [];

  if (usage.members && usage.members > limits.maxMembers) {
    violations.push(
      `Member count (${usage.members}) exceeds limit (${limits.maxMembers})`
    );
  }

  if (usage.mediaStorage && usage.mediaStorage > limits.maxMediaStorage) {
    violations.push(
      `Media storage (${usage.mediaStorage}MB) exceeds limit (${limits.maxMediaStorage}MB)`
    );
  }

  if (
    usage.apiRequests &&
    limits.maxApiRequests > 0 &&
    usage.apiRequests > limits.maxApiRequests
  ) {
    violations.push(
      `API requests (${usage.apiRequests}) exceed limit (${limits.maxApiRequests})`
    );
  }

  if (usage.webhookEvents && usage.webhookEvents > limits.maxWebhookEvents) {
    violations.push(
      `Webhook events (${usage.webhookEvents}) exceed limit (${limits.maxWebhookEvents})`
    );
  }

  return {
    isOver: violations.length > 0,
    violations,
  };
}
