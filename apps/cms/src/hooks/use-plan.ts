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
import { useWorkspace } from "@/providers/workspace";

export function usePlan() {
  const { activeWorkspace } = useWorkspace();

  const currentPlan: PlanType = useMemo(() => {
    return getWorkspacePlan(activeWorkspace?.subscription);
  }, [activeWorkspace?.subscription]);

  const currentMemberCount = useMemo(() => {
    return activeWorkspace?.members?.length || 0;
  }, [activeWorkspace?.members]);

  const planLimits: PlanLimits = useMemo(() => {
    return getPlanLimits(currentPlan);
  }, [currentPlan]);

  const canInvite = useMemo(() => {
    return canInviteMoreMembers(currentPlan, currentMemberCount);
  }, [currentPlan, currentMemberCount]);

  const remainingSlots = useMemo(() => {
    return getRemainingMemberSlots(currentPlan, currentMemberCount);
  }, [currentPlan, currentMemberCount]);

  const canUseFeature = (feature: keyof PlanLimits["features"]) => {
    return canPerformAction(currentPlan, feature);
  };

  const checkLimits = (usage: Parameters<typeof isOverLimit>[1]) => {
    return isOverLimit(currentPlan, usage);
  };

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
  };
}
