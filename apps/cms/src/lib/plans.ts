export type PlanType = "free" | "pro" | "team";

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
  free: {
    maxMembers: 2,
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
  team: {
    maxMembers: 10,
    maxMediaStorage: 5120, // 5GB
    maxApiRequests: -1, // unlimited
    maxWebhookEvents: 100,
    features: {
      inviteMembers: true,
      advancedReadability: true,
      keywordOptimization: true,
      unlimitedPosts: true,
    },
  },
};

/**
 * Get the plan type from workspace subscription
 */
export function getWorkspacePlan(
  subscription?: { plan: string } | null
): PlanType {
  if (!subscription?.plan) {
    return "free";
  }

  const plan = subscription.plan.toLowerCase();
  if (plan === "pro") {
    return "pro";
  }
  if (plan === "team") {
    return "team";
  }

  return "free";
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
