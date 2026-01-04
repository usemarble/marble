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
  const { canInvite, remainingSlots, isHobbyPlan, planLimits } = usePlan();

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
        <Tooltip>
          <TooltipTrigger
            delay={0}
            render={
              <Button
                className={isHobbyPlan ? "" : "opacity-50"}
                onClick={handleInviteClick}
                variant={isHobbyPlan ? "default" : "outline"}
              >
                <PlusIcon className="size-4" />
                Invite
              </Button>
            }
          />
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
      <Tooltip delay={0}>
        <TooltipTrigger
          render={
            <Button onClick={onInvite}>
              <PlusIcon className="size-4" />
              <span>Invite</span>
            </Button>
          }
        />
        <TooltipContent>
          <p className="text-xs">{getTooltipContent()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
