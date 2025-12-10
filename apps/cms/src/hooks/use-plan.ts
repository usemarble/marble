import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  canInviteMoreMembers,
  canPerformAction,
  getPlanLimits,
  getRemainingMemberSlots,
  getWorkspacePlan,
  isOverLimit,
  type PlanLimits,
  type PlanType,
} from "@/lib/plans";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { useWorkspace } from "@/providers/workspace";
import type { UsageDashboardData } from "@/types/dashboard";

type BillingUsage = {
  media: number;
};

export function usePlan() {
  const { activeWorkspace } = useWorkspace();

  const currentPlan: PlanType = useMemo(
    () => getWorkspacePlan(activeWorkspace?.subscription),
    [activeWorkspace?.subscription]
  );

  const currentMemberCount = useMemo(
    () => activeWorkspace?.members?.length || 0,
    [activeWorkspace?.members]
  );

  const planLimits: PlanLimits = useMemo(
    () => getPlanLimits(currentPlan),
    [currentPlan]
  );

  const canInvite = useMemo(
    () => canInviteMoreMembers(currentPlan, currentMemberCount),
    [currentPlan, currentMemberCount]
  );

  const remainingSlots = useMemo(
    () => getRemainingMemberSlots(currentPlan, currentMemberCount),
    [currentPlan, currentMemberCount]
  );

  const canUseFeature = (feature: keyof PlanLimits["features"]) =>
    canPerformAction(currentPlan, feature);

  const checkLimits = (usage: Parameters<typeof isOverLimit>[1]) =>
    isOverLimit(currentPlan, usage);

  const workspaceId = activeWorkspace?.id;

  const { data } = useQuery({
    queryKey: workspaceId
      ? QUERY_KEYS.USAGE_DASHBOARD(workspaceId)
      : ["usage-dashboard", "disabled"],
    queryFn: async (): Promise<UsageDashboardData> => {
      const response = await fetch("/api/metrics/usage");
      if (!response.ok) {
        throw new Error("Failed to fetch usage metrics");
      }
      return response.json();
    },
    enabled: Boolean(workspaceId),
    staleTime: 1000 * 60 * 10,
  });

  const isFreePlan = currentPlan === "free";
  const isProPlan = currentPlan === "pro";
  const isTeamPlan = currentPlan === "team";

  return {
    currentPlan,
    planLimits,
    currentMemberCount,
    canInvite,
    remainingSlots,
    canUseFeature,
    checkLimits,
    isFreePlan,
    isProPlan,
    isTeamPlan,
    currentMediaUsage: data?.media.total ?? 0,
    currentApiRequests: data?.api.totals.total ?? 0,
  };
}
