"use client";

import { Button } from "@marble/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@marble/ui/components/dialog";
import { Check } from "@phosphor-icons/react";
import { useState } from "react";
import { checkout } from "@/lib/auth/client";
import { useWorkspace } from "@/providers/workspace";
import { ButtonLoader } from "../ui/loader";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [checkoutLoading, setCheckoutLoading] = useState<"pro" | "team" | null>(
    null,
  );
  const { activeWorkspace } = useWorkspace();

  const handleCheckout = async (plan: "pro" | "team") => {
    setCheckoutLoading(plan);
    console.log(activeWorkspace);

    try {
      await checkout({
        slug: plan,
        referenceId: activeWorkspace?.id,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setCheckoutLoading(null);
      onClose();
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-screen-md">
        <DialogHeader>
          <DialogTitle>Upgrade Plan</DialogTitle>
          <DialogDescription>
            Choose a plan that fits your needs.
          </DialogDescription>
        </DialogHeader>
        <section>
          <ul className="grid sm:grid-cols-2 border border-dashed divide-x divide-dashed rounded-xl overflow-hidden">
            <li className=" flex flex-col gap-5 min-h-96 h-full w-full px-4 py-6">
              <div className="flex flex-col gap-4">
                <h4 className="text-medium text-2xl">Pro</h4>
                <div className="">
                  <p>
                    <span className="font-bold text-2xl">$10</span>{" "}
                    <span>per month.</span>
                  </p>
                  <p className="text-muted-foreground text-sm">
                    For small teams
                  </p>
                </div>
              </div>
              <div className="border-y border-dashed py-4">
                <Button
                  disabled={!!checkoutLoading}
                  className="w-full"
                  onClick={() => handleCheckout("pro")}
                >
                  {checkoutLoading === "pro" ? <ButtonLoader /> : "Upgrade"}
                </Button>
              </div>
              <ul className="flex flex-col gap-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary" />
                  <span>Unlimited posts.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary" />
                  <span>2 GB media storage.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary" />
                  <span>Up to 10 team members.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary" />
                  <span>50k API requests per month.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary" />
                  <span>50 Webhook events per month.</span>
                </li>
              </ul>
            </li>
            <li className=" flex flex-col gap-5 min-h-96 h-full w-full px-4 py-6">
              <div className="flex flex-col gap-4">
                <h4 className="text-medium text-2xl">Team</h4>
                <div className="">
                  <p>
                    <span className="font-bold text-2xl">$15</span>{" "}
                    <span>per month.</span>
                  </p>
                  <p className="text-muted-foreground text-sm">
                    For growing teams
                  </p>
                </div>
              </div>
              <div className="border-y border-dashed py-4">
                <Button
                  disabled={!!checkoutLoading}
                  className="w-full"
                  onClick={() => handleCheckout("team")}
                >
                  {checkoutLoading === "team" ? <ButtonLoader /> : "Upgrade"}
                </Button>
              </div>
              <ul className="flex flex-col gap-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary" />
                  <span>Unlimited posts.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary" />
                  <span>5 GB media storage.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary" />
                  <span>Up to 10 team members.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary" />
                  <span>Unlimited API requests.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary" />
                  <span>100 Webhook events per month.</span>
                </li>
              </ul>
            </li>
          </ul>
        </section>
      </DialogContent>
    </Dialog>
  );
}
