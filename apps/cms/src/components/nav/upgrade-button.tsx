"use client";

import { Button } from "@marble/ui/components/button";
import { useSidebar } from "@marble/ui/components/sidebar";
import dynamic from "next/dynamic";
import { useState } from "react";
import { usePlan } from "@/hooks/use-plan";
import { useWorkspace } from "@/providers/workspace";

const UpgradeModal = dynamic(() =>
  import("@/components/billing/upgrade-modal").then((mod) => mod.UpgradeModal)
);

export function UpgradeButton() {
  const { state } = useSidebar();
  const { isFreePlan } = usePlan();
  const { isOwner } = useWorkspace();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const isCollapsed = state === "collapsed";

  if (!isFreePlan || !isOwner || isCollapsed) {
    return null;
  }

  const handleUpgradeClick = () => {
    setShowUpgradeModal(true);
  };

  return (
    <>
      <div className="px-2 pb-2">
        <Button
          className="w-full cursor-pointer"
          onClick={handleUpgradeClick}
          size="sm"
          type="button"
          variant="outline"
        >
          Upgrade To Pro
        </Button>
      </div>
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
}
