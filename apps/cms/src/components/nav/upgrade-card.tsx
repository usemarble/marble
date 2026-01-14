"use client";

import { Button } from "@marble/ui/components/button";
import { useSidebar } from "@marble/ui/components/sidebar";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AsyncButton } from "@/components/ui/async-button";
import { usePlan } from "@/hooks/use-plan";
import { checkout } from "@/lib/auth/client";
import { useWorkspace } from "@/providers/workspace";

export function UpgradeCard() {
  const { state } = useSidebar();
  const { isHobbyPlan } = usePlan();
  const { isOwner, activeWorkspace } = useWorkspace();
  const [isLoading, setIsLoading] = useState(false);
  const isCollapsed = state === "collapsed";
  const shouldReduceMotion = useReducedMotion();

  const wasCollapsed = useRef(isCollapsed);
  const shouldAnimate =
    !shouldReduceMotion && wasCollapsed.current && !isCollapsed;

  useEffect(() => {
    wasCollapsed.current = isCollapsed;
  }, [isCollapsed]);

  if (!isHobbyPlan || !isOwner || isCollapsed) {
    return null;
  }

  const handleUpgrade = async () => {
    if (!activeWorkspace?.id) {
      return;
    }

    setIsLoading(true);

    try {
      await checkout({
        slug: "pro",
        referenceId: activeWorkspace.id,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
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
              Upgrade to Pro
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
            Start 3 day free trial
          </AsyncButton>
        </div>
      </div>
    </motion.div>
  );
}
