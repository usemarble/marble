"use client";

import { ShoppingCart02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@marble/ui/components/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogX,
} from "@marble/ui/components/dialog";
import { PRICING_PLANS } from "@marble/utils";
import Link from "next/link";
import { AsyncButton } from "@/components/ui/async-button";
import { useBilling } from "@/hooks/use-billing";
import { useWorkspace } from "@/providers/workspace";

type FeatureType =
  | "authors"
  | "share-drafts"
  | "team-members"
  | "storage"
  | "ai-readability";

type UpgradePlan = "hobby" | "pro";

/**
 * `plan` is the plan this upsell sells, stated per feature rather than derived,
 * so changing a plan's limits never silently re-points an existing upsell.
 */
const FEATURE_CONTENT: Record<
  FeatureType,
  { title: string; description: string; plan: UpgradePlan }
> = {
  authors: {
    title: "Add more authors",
    description: "Upgrade to add unlimited authors and grow your content team.",
    plan: "pro",
  },
  "share-drafts": {
    title: "Share draft links",
    description:
      "Upgrade to share draft links with others for feedback before publishing.",
    plan: "pro",
  },
  "team-members": {
    title: "Invite team members",
    description:
      "Upgrade to invite more team members to collaborate on your workspace.",
    plan: "pro",
  },
  storage: {
    title: "Get more storage",
    description:
      "Upgrade to get 10GB of media storage for your images and files.",
    plan: "pro",
  },
  "ai-readability": {
    title: "AI suggestions",
    description: "Upgrade your plan for AI suggestions.",
    plan: "hobby",
  },
};

interface UpgradeModalProps {
  feature: FeatureType;
  isOpen: boolean;
  onClose: () => void;
  /**
   * Open billing in a new tab instead of navigating. Set where a client-side
   * navigation would discard unsaved work - the editor's `beforeunload` guard
   * does not fire on Next.js route changes. Checkout itself is a full page
   * load, so it stays guarded either way.
   */
  openPricingInNewTab?: boolean;
}

export function UpgradeModal({
  feature,
  isOpen,
  onClose,
  openPricingInNewTab = false,
}: UpgradeModalProps) {
  const {
    openBilling,
    loadingPlan,
    isLoading,
    hasSubscription,
    canManageBilling,
  } = useBilling();
  const { activeWorkspace } = useWorkspace();

  const content = FEATURE_CONTENT[feature];
  const pricing = PRICING_PLANS.find((plan) => plan.id === content.plan);

  const handleUpgrade = async (interval: "monthly" | "yearly") => {
    const opened = await openBilling(
      interval === "monthly" ? content.plan : `${content.plan}-yearly`
    );
    if (opened) {
      onClose();
    }
  };

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
      open={isOpen}
    >
      <DialogContent className="sm:max-w-md" variant="card">
        <DialogHeader className="flex-row items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              className="text-muted-foreground"
              icon={ShoppingCart02Icon}
              size={18}
              strokeWidth={2}
            />
            <DialogTitle className="font-medium text-muted-foreground text-sm">
              Upgrade to {pricing?.title ?? "a paid plan"}
            </DialogTitle>
          </div>
          <DialogX />
        </DialogHeader>
        <DialogBody>
          <DialogDescription className="text-balance">
            {content.description}
          </DialogDescription>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            {hasSubscription ? (
              <AsyncButton
                className="w-full"
                disabled={!canManageBilling}
                isLoading={isLoading}
                onClick={() => openBilling()}
                size="sm"
              >
                Manage Billing
              </AsyncButton>
            ) : (
              <>
                <Button
                  className="w-full"
                  disabled={isLoading || !canManageBilling}
                  onClick={() => handleUpgrade("monthly")}
                  size="sm"
                  variant="outline"
                >
                  {loadingPlan === content.plan
                    ? "Loading..."
                    : pricing
                      ? `${pricing.price.monthly}/month`
                      : "Monthly"}
                </Button>
                <AsyncButton
                  className="w-full"
                  disabled={isLoading || !canManageBilling}
                  isLoading={loadingPlan === `${content.plan}-yearly`}
                  onClick={() => handleUpgrade("yearly")}
                  size="sm"
                >
                  {pricing ? `${pricing.price.yearly}/year` : "Yearly"}
                </AsyncButton>
              </>
            )}
          </DialogFooter>
          <Link
            className="text-center text-muted-foreground text-xs underline hover:text-foreground"
            href={`/${activeWorkspace?.slug}/settings/billing`}
            onClick={openPricingInNewTab ? undefined : onClose}
            rel={openPricingInNewTab ? "noopener noreferrer" : undefined}
            target={openPricingInNewTab ? "_blank" : undefined}
          >
            View pricing
          </Link>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

export type { FeatureType };
