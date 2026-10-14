"use client";

import { Button } from "@marble/ui/components/button";
import { useSidebar } from "@marble/ui/components/sidebar";
import { getPlanTrialCopy, PRICING_PLANS } from "@marble/utils";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { AsyncButton } from "@/components/ui/async-button";
import { useBilling } from "@/hooks/use-billing";
import { usePlan } from "@/hooks/use-plan";
import { useWorkspace } from "@/providers/workspace";

export function UpgradeCard() {
  const { state } = useSidebar();
  const { isFreePlan, isHobbyPlan } = usePlan();
  const { isOwner, activeWorkspace } = useWorkspace();
  const { openBilling, isLoading, hasSubscription } = useBilling();
  const isCollapsed = state === "collapsed";
  const shouldReduceMotion = useReducedMotion();
  const hobbyPlan = PRICING_PLANS.find((plan) => plan.id === "hobby");
  const freeUpgradeLabel = hobbyPlan
    ? `Upgrade for ${hobbyPlan.price.monthly}/month`
    : "Upgrade";
  const proTrialCopy = getPlanTrialCopy("pro");
  const proUpgradeLabel = proTrialCopy
    ? `Start ${proTrialCopy}`
    : "Upgrade to Pro";

  const wasCollapsed = useRef(isCollapsed);
  const shouldAnimate =
    !shouldReduceMotion && wasCollapsed.current && !isCollapsed;

  useEffect(() => {
    wasCollapsed.current = isCollapsed;
  }, [isCollapsed]);

  if (
    !activeWorkspace ||
    (!isFreePlan && !isHobbyPlan) ||
    !isOwner ||
    isCollapsed
  ) {
    return null;
  }

  const handleUpgrade = async () => {
    await openBilling(isFreePlan ? "hobby" : "pro");
  };

  return (
    <motion.div
      animate={{ opacity: 1, x: 0 }}
      className="p-2"
      initial={shouldAnimate ? { opacity: 0, x: "-100%" } : false}
      transition={{ duration: 0.4 }}
    >
      <div className="group relative w-full overflow-hidden rounded-xl border bg-background p-3 text-left shadow-xs">
        <div className="relative z-10 flex flex-col gap-3">
          <div className="space-y-2.5">
            <h4 className="font-medium text-sm leading-none tracking-tight">
              Upgrade to {isFreePlan ? "Hobby" : "Pro"}
            </h4>
            <p className="text-muted-foreground text-xs leading-tight">
              Unlock higher limits, invite team members, and get more storage.
            </p>
          </div>
          <AsyncButton
            className="rounded-[2px]"
            isLoading={isLoading}
            onClick={handleUpgrade}
            size="xs"
          >
            {hasSubscription
              ? "Manage Billing"
              : isFreePlan
                ? freeUpgradeLabel
                : proUpgradeLabel}
          </AsyncButton>
        </div>
      </div>
    </motion.div>
  );
}
