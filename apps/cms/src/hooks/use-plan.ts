import {
  canInviteMoreMembers,
  canPerformAction,
  getPlanLimits,
  getRemainingMemberSlots,
  getWorkspacePlan,
  isOverLimit,
  type PlanLimits,
  type PlanType,
} from "@marble/utils";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { orpc } from "@/lib/orpc";
import { useWorkspace } from "@/providers/workspace";

export function usePlan() {
  const { activeWorkspace } = useWorkspace();

  const currentPlan: PlanType = useMemo(
    () => getWorkspacePlan(activeWorkspace?.subscription),
    [activeWorkspace?.subscription]
  );

  const currentMemberCount = activeWorkspace?.memberCount ?? 0;

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

  const workspaceId = useWorkspaceId();

  const { data } = useQuery(
    orpc.workspaces.metrics.usage.queryOptions({
      input: { workspaceId: workspaceId ?? "" },
      enabled: Boolean(workspaceId),
      staleTime: 1000 * 60 * 10,
    })
  );

  const isFreePlan = currentPlan === "free";
  const isHobbyPlan = currentPlan === "hobby";
  const isProPlan = currentPlan === "pro";

  return {
    currentPlan,
    planLimits,
    currentMemberCount,
    canInvite,
    remainingSlots,
    canUseFeature,
    checkLimits,
    isFreePlan,
    isHobbyPlan,
    isProPlan,
    currentMediaUsage: data?.media.total ?? 0,
    currentApiRequests: data?.api.totals.total ?? 0,
  };
}
