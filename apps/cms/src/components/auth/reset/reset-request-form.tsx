"use client";

import { Button } from "@marble/ui/components/button";
import { Input } from "@marble/ui/components/input";
import { toast } from "@marble/ui/components/sonner";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export default function ResetRequestForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
      setIsLoading(false);
    }
  };

  return (
    <section className="flex w-full max-w-sm flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-lg font-semibold">Forgot your password?</h1>
        <p className="text-muted-foreground text-sm">
          Enter your email address and we’ll send you a reset link.
        </p>
      </div>

      <Input
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <Button
        onClick={handleRequest}
        disabled={!email}
        className="flex items-center justify-center min-w-48"
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          "Send reset link"
        )}
      </Button>
    </section>
  );
}
