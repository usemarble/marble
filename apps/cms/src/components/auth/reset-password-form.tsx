"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@marble/ui/components/button";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/components/sonner";
import { Eye, EyeClosed, Spinner } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { authClient } from "@/lib/auth/client";
import {
  type ResetPasswordData,
  resetPasswordSchema,
} from "@/lib/validations/auth";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackURL = searchParams?.get("from") || "/";

  async function onSubmit(data: ResetPasswordData) {
    setIsLoading(true);

    try {
      await authClient.resetPassword(
        {
          newPassword: data.password,
          token,
        },
        {
          onSuccess: () => {
            toast.success(
              "Password reset successfully! You are now logged in.",
            );
            router.push(callbackURL);
          },
          onError: (ctx) => {
            if (ctx.error.status === 400) {
              toast.error(
                "Invalid or expired reset token. Please request a new reset link.",
              );
            } else {
              toast.error("Failed to reset password. Please try again.");
            }
          },
        },
      );
    } catch (_error) {
      toast.error("Request failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-3">
        <div className="grid gap-1">
          <Label className="sr-only" htmlFor="password">
            New Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              placeholder="New password"
              type={isPasswordVisible ? "text" : "password"}
              autoCapitalize="none"
              autoCorrect="off"
              disabled={isLoading}
              className="pr-9"
              {...register("password")}
            />
            <button
              type="button"
              className="absolute right-4 top-3 text-muted-foreground"
              onClick={() => setIsPasswordVisible((prev) => !prev)}
            >
              {isPasswordVisible ? (
                <Eye className="size-4" />
              ) : (
                <EyeClosed className="size-4" />
              )}
            </button>
          </div>
          {errors?.password && (
            <p className="text-sm px-1 font-medium text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>
        <div className="grid gap-1">
          <Label className="sr-only" htmlFor="confirmPassword">
            Confirm Password
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              placeholder="Confirm new password"
              type={isConfirmPasswordVisible ? "text" : "password"}
              autoCapitalize="none"
              autoCorrect="off"
              disabled={isLoading}
              className="pr-9"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              className="absolute right-4 top-3 text-muted-foreground"
              onClick={() => setIsConfirmPasswordVisible((prev) => !prev)}
            >
              {isConfirmPasswordVisible ? (
                <Eye className="size-4" />
              ) : (
                <EyeClosed className="size-4" />
              )}
            </button>
          </div>
          {errors?.confirmPassword && (
            <p className="text-sm px-1 font-medium text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
        <Button disabled={isLoading} className="mt-4">
          {isLoading && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
          Reset password
        </Button>
      </div>
    </form>
  );
}
