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

  const { data } = useQuery({
    // biome-ignore lint/style/noNonNullAssertion: <>
    queryKey: QUERY_KEYS.BILLING_USAGE(activeWorkspace!.id),
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<BillingUsage> => {
      const res = await fetch("/api/billing/usage");
      if (!res.ok) {
        throw new Error("Failed to fetch billing usage");
      }
      return res.json();
    },
    enabled: !!activeWorkspace?.id,
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
    currentMediaUsage: data?.media ?? 0,
  };
}
