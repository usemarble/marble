"use client";

import { Input } from "@marble/ui/components/input";
import { toast } from "@marble/ui/components/sonner";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { AsyncButton } from "../../ui/async-button";

interface ResetFormProps {
  callbackUrl: string;
  token: string;
}

export function ResetForm({ callbackUrl, token }: ResetFormProps) {
  const safeCallbackUrl = safeRedirectPath(callbackUrl, "/login");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
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
      const { error } = await authClient.resetPassword({
        token,
        newPassword: password,
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success("Password has been reset");
      router.push(safeCallbackUrl);
    } catch (error) {
      console.error("Password reset failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Password reset failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flex w-full max-w-sm flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-semibold text-lg">Reset your password</h1>
        <p className="text-muted-foreground text-sm">
          Choose a new password for your account.
        </p>
      </div>
      <div className="flex w-full flex-col gap-4">
        <div className="relative">
          <Input
            autoComplete="new-password"
            className="pr-9"
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            type={isPasswordVisible ? "text" : "password"}
            value={password}
          />
          <button
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            className="-translate-y-1/2 absolute top-1/2 right-4 text-muted-foreground"
            onClick={() => setIsPasswordVisible((prev) => !prev)}
            type="button"
          >
            {isPasswordVisible ? (
              <EyeIcon className="size-4" />
            ) : (
              <EyeSlashIcon className="size-4" />
            )}
          </button>
        </div>
        <Input
          autoComplete="new-password"
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          type={isPasswordVisible ? "text" : "password"}
          value={confirmPassword}
        />
        <AsyncButton
          className="flex items-center justify-center"
          disabled={!password || !confirmPassword}
          isLoading={isLoading}
          onClick={handleResetPassword}
        >
          Reset password
        </AsyncButton>
      </div>
    </section>
  );
}
