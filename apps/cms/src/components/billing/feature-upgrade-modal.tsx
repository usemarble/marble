"use client";

import { ShoppingCart02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@marble/ui/components/dialog";
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
    description:
      "Upgrade to Pro to add unlimited authors and grow your content team.",
  },
  "share-drafts": {
    title: "Share draft links",
    description:
      "Upgrade to Pro to share draft links with others for feedback before publishing.",
  },
  "team-members": {
    title: "Invite team members",
    description:
      "Upgrade to Pro to invite up to 5 team members to collaborate on your workspace.",
  },
  storage: {
    title: "Get more storage",
    description:
      "Upgrade to Pro to get 10GB of media storage for your images and files.",
  },
};

interface FeatureUpgradeModalProps {
  feature: FeatureType;
  isOpen: boolean;
  onClose: () => void;
}

export function FeatureUpgradeModal({
  feature,
  isOpen,
  onClose,
}: FeatureUpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { activeWorkspace } = useWorkspace();

  const content = FEATURE_CONTENT[feature];

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
        <DialogHeader className="flex-row items-center gap-2 px-4 py-2">
          <HugeiconsIcon
            className="text-muted-foreground"
            icon={ShoppingCart02Icon}
            size={18}
            strokeWidth={2}
          />
          <DialogTitle className="font-medium text-muted-foreground text-sm">
            Upgrade to Pro
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogDescription className="text-balance">
            {content.description}
          </DialogDescription>
          <DialogFooter>
            <DialogClose size="sm">Cancel</DialogClose>
            <AsyncButton
              isLoading={isLoading}
              onClick={handleUpgrade}
              size="sm"
            >
              Upgrade to Pro
            </AsyncButton>
          </DialogFooter>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
