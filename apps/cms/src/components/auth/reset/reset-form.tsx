"use client";

import { Input } from "@marble/ui/components/input";
import { toast } from "@marble/ui/components/sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import Container from "../../shared/container";
import { AsyncButton } from "../../ui/async-button";

interface ResetFormProps {
  callbackUrl: string;
  token: string;
}

export function ResetForm({ callbackUrl, token }: ResetFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleResetPassword = async () => {
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await authClient.resetPassword({
        token,
        newPassword: password,
      });

      toast.success("Password has been reset");
      router.push(callbackUrl);
    } catch (error) {
      console.error("Password reset failed:", error);
      toast.error("Password reset failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="flex flex-col items-center justify-between py-24">
      <section className="flex w-full flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-lg font-semibold leading-7">
            Reset your password
          </h1>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-sm">
          <Input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <AsyncButton
          onClick={handleResetPassword}
          disabled={!password || !confirmPassword}
          className="flex items-center justify-center min-w-48"
          isLoading={isLoading}
        >
          Reset password
        </AsyncButton>
      </section>
    </Container>
  );
}
