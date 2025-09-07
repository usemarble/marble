"use client";

import { Input } from "@marble/ui/components/input";
import { toast } from "@marble/ui/components/sonner";
import { cn } from "@marble/ui/lib/utils";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";
import { AsyncButton } from "../../ui/async-button";

export default function ResetRequestForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRequestSuccess, setIsRequestSuccess] = useState(false);
  const [waitingSeconds, setWaitingSeconds] = useState(0);

  useEffect(() => {
    if (waitingSeconds > 0) {
      const timeout = setTimeout(() => {
        setWaitingSeconds(waitingSeconds - 1);
      }, 1000);
      return () => clearTimeout(timeout);
    }
    if (waitingSeconds === 0 && isRequestSuccess) {
      // Reset success state when countdown ends
      setIsRequestSuccess(false);
    }
  }, [waitingSeconds, isRequestSuccess]);

  const handleRequest = async () => {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setIsLoading(true);
    try {
      await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset",
      });
      toast.success("Password reset link sent to your inbox");
    } catch (err) {
      console.error(err);
      toast.error("Failed to request reset");
    } finally {
      setWaitingSeconds(60);
      setIsLoading(false);
      setIsRequestSuccess(true);
    }
  };

  return (
    <section className="flex w-full max-w-sm flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-lg font-semibold">Forgot your password?</h1>
        <p className="text-muted-foreground text-sm">
          Enter your email address and we&apos;ll send you a reset link.
        </p>
      </div>

      <Input
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <AsyncButton
        onClick={handleRequest}
        disabled={!email || isLoading || waitingSeconds > 0}
        className={cn(
          "flex items-center justify-center min-w-48",
          isLoading || (waitingSeconds > 0 && "cursor-not-allowed"),
        )}
        isLoading={isLoading}
      >
        <div>
          Send reset link{" "}
          {waitingSeconds > 0 && <span>({waitingSeconds}s)</span>}
        </div>
      </AsyncButton>
    </section>
  );
}
