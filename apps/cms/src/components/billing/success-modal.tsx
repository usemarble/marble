"use client";

import { Button } from "@marble/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@marble/ui/components/dialog";
import { CheckCircle } from "@phosphor-icons/react";
import confetti from "canvas-confetti";
import { useEffect, useState } from "react";

type PaymentSuccessModalProps = {
  isOpen: boolean;
  onClose: () => void;
  planName?: string;
};

export function PaymentSuccessModal({
  isOpen,
  onClose,
  planName = "Pro",
}: PaymentSuccessModalProps) {
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

  useEffect(() => {
    if (isOpen && !hasTriggeredConfetti) {
      // Trigger confetti animation
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 1000,
      };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      setHasTriggeredConfetti(true);

      return () => clearInterval(interval);
    }
  }, [isOpen, hasTriggeredConfetti]);

  const handleClose = () => {
    setHasTriggeredConfetti(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle
              className="h-8 w-8 text-green-600 dark:text-green-400"
              weight="fill"
            />
          </div>
          <DialogTitle className="font-semibold text-xl">
            🎉 Payment Successful!
          </DialogTitle>
          <DialogDescription className="text-base">
            Welcome to the {planName} plan! Your subscription is now active and
            you have access to all {planName.toLowerCase()} features.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="mb-2 font-medium">What's next?</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" weight="fill" />
                Explore your new features in the dashboard
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" weight="fill" />
                Invite team members to collaborate
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" weight="fill" />
                Check out the billing section for invoice history
              </li>
            </ul>
          </div>

          <Button onClick={handleClose} className="w-full">
            Get Started
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
