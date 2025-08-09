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
import { PRICING_PLANS } from "@/lib/constants";
import { useWorkspace } from "@/providers/workspace";
import { ButtonLoader } from "../ui/loader";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [checkoutLoading, setCheckoutLoading] = useState<"pro" | "team" | null>(
    null
  );
  const { activeWorkspace } = useWorkspace();

  const currentPlan = activeWorkspace?.subscription?.plan;

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

  const renderPlanButton = (plan: "pro" | "team") => {
    const isCurrentPlan = currentPlan === plan;

    if (isCurrentPlan) {
      return (
        <Button className="w-full" disabled variant="default">
          Current plan
        </Button>
      );
    }

    return (
      <Button
        className="w-full"
        disabled={!!checkoutLoading}
        onClick={() => handleCheckout(plan)}
      >
        {checkoutLoading === plan ? <ButtonLoader /> : "Upgrade"}
      </Button>
    );
  };

  return (
    <Dialog onOpenChange={onClose} open={isOpen}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>Upgrade Plan</DialogTitle>
          <DialogDescription>
            Upgrade your workspace to the pro plan.
          </DialogDescription>
        </DialogHeader>
        <section>
          <ul>
            {PRICING_PLANS.map((plan) => (
              <li
                className=" mt-4 flex h-full min-h-96 w-full flex-col gap-5 rounded-xl border border-dashed px-4 py-6"
                key={plan.title}
              >
                <div className="flex flex-col gap-4">
                  <h4 className="text-2xl text-medium">{plan.title}</h4>
                  <div>
                    <p>
                      <span className="font-bold text-2xl">
                        {plan.price.monthly}
                      </span>{" "}
                      <span>per month.</span>
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {plan.description}
                    </p>
                  </div>
                </div>
                <div className="border-y border-dashed py-4">
                  {renderPlanButton(plan.title.toLowerCase() as "pro" | "team")}
                </div>
                <ul className="flex flex-col gap-2 text-sm">
                  {plan.features.map((feature) => (
                    <li className="flex items-center gap-2" key={feature}>
                      <Check className="size-4 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      </DialogContent>
    </Dialog>
  );
}
