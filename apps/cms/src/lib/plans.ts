export type PlanType = "pro" | "hobby";

export type PlanLimits = {
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
};

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  hobby: {
    maxMembers: 1,
    maxMediaStorage: 1024,
    maxApiRequests: 10_000,
    maxWebhookEvents: 0,
    features: {
      inviteMembers: true,
      advancedReadability: false,
      keywordOptimization: false,
      unlimitedPosts: true,
    },
  },
  pro: {
    maxMembers: 5,
    maxMediaStorage: 2048,
    maxApiRequests: 50_000,
    maxWebhookEvents: 50,
    features: {
      inviteMembers: true,
      advancedReadability: true,
      keywordOptimization: false,
      unlimitedPosts: true,
    },
  },
};

/**
 * Check if a subscription is currently active
 */
function isSubscriptionActive(
  subscription?: {
    status?: string;
    cancelAtPeriodEnd?: boolean;
    currentPeriodEnd?: string | Date;
  } | null
): boolean {
  if (!subscription) {
    return false;
  }

  // Active or trialing subscriptions are always active
  if (subscription.status === "active" || subscription.status === "trialing") {
    return true;
  }

  // Canceled subscriptions are active until period end
  if (
    subscription.status === "canceled" &&
    subscription.cancelAtPeriodEnd &&
    subscription.currentPeriodEnd
  ) {
    const now = new Date();
    const periodEnd =
      subscription.currentPeriodEnd instanceof Date
        ? subscription.currentPeriodEnd
        : new Date(subscription.currentPeriodEnd);
    return periodEnd > now;
  }

  return false;
}

/**
 * Get the plan type from workspace subscription
 * Only returns the plan if the subscription is actually active
 */
export function getWorkspacePlan(
  subscription?: {
    plan?: string;
    status?: string;
    cancelAtPeriodEnd?: boolean;
    currentPeriodEnd?: string | Date;
  } | null
): PlanType {
  // If subscription doesn't exist or is not active, return free
  if (!subscription?.plan || !isSubscriptionActive(subscription)) {
    return "hobby";
  }

  const plan = subscription.plan.toLowerCase();
  if (plan === "pro") {
    return "pro";
  }
  return "hobby";
}

/**
 * Check if a workspace can perform a specific action based on their plan
 */
export function canPerformAction(
  plan: PlanType,
  action: keyof PlanLimits["features"]
): boolean {
  return PLAN_LIMITS[plan].features[action];
}

/**
 * Check if a workspace is within their member limit
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
 * Get remaining member slots for a workspace
 */
export function getRemainingMemberSlots(
  plan: PlanType,
  currentMemberCount: number
): number {
  const maxMembers = PLAN_LIMITS[plan].maxMembers;
  return Math.max(0, maxMembers - currentMemberCount);
}

/**
 * Get plan limits for a specific plan
 */
export function getPlanLimits(plan: PlanType): PlanLimits {
  return PLAN_LIMITS[plan];
}

/**
 * Check if current usage exceeds plan limits
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
