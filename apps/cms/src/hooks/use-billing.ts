"use client";

import { toast } from "@marble/ui/components/sonner";
import { useRef, useState } from "react";
import { type BillingPlanSlug, openWorkspaceBilling } from "@/lib/billing";
import { useWorkspace } from "@/providers/workspace";

export function useBilling() {
  const { activeWorkspace, isOwner } = useWorkspace();
  const busy = useRef(false);
  const [loadingPlan, setLoadingPlan] = useState<
    BillingPlanSlug | "portal" | null
  >(null);

  const openBilling = async (plan?: BillingPlanSlug) => {
    if (!activeWorkspace || !isOwner || busy.current) {
      return false;
    }
    busy.current = true;
    setLoadingPlan(plan ?? "portal");
    try {
      await openWorkspaceBilling(activeWorkspace, plan);
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to open billing"
      );
      return false;
    } finally {
      busy.current = false;
      setLoadingPlan(null);
    }
  };

  return {
    openBilling,
    loadingPlan,
    isLoading: loadingPlan !== null,
    canManageBilling: Boolean(activeWorkspace) && isOwner,
    hasSubscription: activeWorkspace?.hasSubscription ?? false,
  };
}
