"use client";

import { Button } from "@marble/ui/components/button";
import { useSidebar } from "@marble/ui/components/sidebar";
import { motion } from "motion/react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { usePlan } from "@/hooks/use-plan";
import { useWorkspace } from "@/providers/workspace";

const UpgradeModal = dynamic(() =>
  import("@/components/billing/upgrade-modal").then((mod) => mod.UpgradeModal)
);

export function UpgradeCard() {
  const { state } = useSidebar();
  const { isHobbyPlan } = usePlan();
  const { isOwner } = useWorkspace();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const isCollapsed = state === "collapsed";

  const wasCollapsed = useRef(isCollapsed);
  const shouldAnimate = wasCollapsed.current && !isCollapsed;

  useEffect(() => {
    wasCollapsed.current = isCollapsed;
  }, [isCollapsed]);

  if (!isHobbyPlan || !isOwner || isCollapsed) {
    return null;
  }

  return (
    <>
      <motion.div
        animate={{ opacity: 1, x: 0 }}
        className="p-2"
        initial={shouldAnimate ? { opacity: 0, x: "-100%" } : false}
        transition={{ duration: 0.4 }}
      >
        <div className="group relative w-full overflow-hidden rounded-xl border bg-background p-3 text-left shadow-xs">
          <div className="relative z-10 flex flex-col gap-3">
            <div className="space-y-2.5">
              <h4 className="font-semibold text-xs leading-none tracking-tight">
                Upgrade to Pro
              </h4>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Unlock higher limits, invite team members, and get more storage.
              </p>
            </div>
            <Button
              className="rounded-[2px]"
              onClick={() => setShowUpgradeModal(true)}
              size="xs"
            >
              Start 7 day free trial
            </Button>
          </div>
        </div>
      </motion.div>
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
}
