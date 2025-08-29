"use client";

import { Button } from "@marble/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { UpgradeModal } from "@/components/billing/upgrade-modal";
import { usePlan } from "@/hooks/use-plan";

interface InviteButtonProps {
  onInvite: () => void;
}

export function InviteButton({ onInvite }: InviteButtonProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { canInvite, remainingSlots, isFreePlan, planLimits } = usePlan();

  const handleInviteClick = () => {
    if (canInvite) {
      onInvite();
    } else {
      setShowUpgradeModal(true);
    }
  };

  const getTooltipContent = () => {
    if (remainingSlots === 0) {
      return `You've reached your member limit (${planLimits.maxMembers}). Upgrade to invite more members.`;
    }
    return `You can invite ${remainingSlots} more member${remainingSlots === 1 ? "" : "s"}`;
  };

  if (!canInvite) {
    return (
      <>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              onClick={handleInviteClick}
              variant={isFreePlan ? "default" : "outline"}
              className={isFreePlan ? "" : "opacity-50"}
            >
              <PlusIcon className="size-4" />
              Invite
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{getTooltipContent()}</p>
          </TooltipContent>
        </Tooltip>

        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
      </>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button onClick={onInvite}>
            <PlusIcon className="size-4" />
            <span>Invite</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{getTooltipContent()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
