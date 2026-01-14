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
import Link from "next/link";
import { useState } from "react";
import { AsyncButton } from "@/components/ui/async-button";
import { checkout } from "@/lib/auth/client";
import { useWorkspace } from "@/providers/workspace";

type FeatureType = "authors" | "share-drafts" | "team-members" | "storage";

const FEATURE_CONTENT: Record<
  FeatureType,
  { title: string; description: string }
> = {
  authors: {
    title: "Add more authors",
    description: "Upgrade to add unlimited authors and grow your content team.",
  },
  "share-drafts": {
    title: "Share draft links",
    description:
      "Upgrade to share draft links with others for feedback before publishing.",
  },
  "team-members": {
    title: "Invite team members",
    description:
      "Upgrade to invite up to 5 team members to collaborate on your workspace.",
  },
  storage: {
    title: "Get more storage",
    description:
      "Upgrade to get 10GB of media storage for your images and files.",
  },
};

interface UpgradeModalProps {
  feature: FeatureType;
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ feature, isOpen, onClose }: UpgradeModalProps) {
  const [loadingPlan, setLoadingPlan] = useState<"monthly" | "yearly" | null>(
    null
  );
  const { activeWorkspace } = useWorkspace();

  const content = FEATURE_CONTENT[feature];

  const handleUpgrade = async (plan: "monthly" | "yearly") => {
    if (!activeWorkspace?.id) {
      return;
    }

    setLoadingPlan(plan);

    try {
      await checkout({
        slug: plan === "monthly" ? "pro" : "pro-yearly",
        referenceId: activeWorkspace.id,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingPlan(null);
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
              Upgrade to Pro
            </DialogTitle>
          </div>
          <DialogX />
        </DialogHeader>
        <DialogBody>
          <DialogDescription className="text-balance">
            {content.description}
          </DialogDescription>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <AsyncButton
              className="w-full"
              disabled={loadingPlan !== null}
              isLoading={loadingPlan === "yearly"}
              onClick={() => handleUpgrade("yearly")}
              size="sm"
            >
              $192/year
              <span className="text-primary-foreground/80 text-xs">
                (save 20%)
              </span>
            </AsyncButton>
            <Button
              className="w-full"
              disabled={loadingPlan !== null}
              onClick={() => handleUpgrade("monthly")}
              size="sm"
              variant="outline"
            >
              {loadingPlan === "monthly" ? "Loading..." : "$20/month"}
            </Button>
          </DialogFooter>
          <Link
            className="text-center text-muted-foreground text-xs underline hover:text-foreground"
            href={`/${activeWorkspace?.slug}/settings/billing`}
            onClick={onClose}
          >
            View pricing
          </Link>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

export type { FeatureType };
