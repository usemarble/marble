"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@marble/ui/components/button";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/components/sonner";
import { Spinner } from "@phosphor-icons/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { authClient } from "@/lib/auth/client";
import {
  type ForgotPasswordData,
  forgotPasswordSchema,
} from "@/lib/validations/auth";

export function ForgotPasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function onSubmit(data: ForgotPasswordData) {
    setIsLoading(true);

    try {
      await authClient.requestPasswordReset(
        {
          email: data.email.toLowerCase(),
          redirectTo: `${window.location.origin}/reset`,
        },
        {
          onSuccess: () => {
            setIsSubmitted(true);
            toast.success("Password reset email sent! Check your inbox.");
          },
          onError: (ctx) => {
            if (ctx.error.status === 404) {
              toast.error("No account found with this email address");
            } else {
              toast.error("Failed to send reset email. Please try again.");
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

  if (isSubmitted) {
    return (
      <div className="text-center space-y-4">
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
            Check your email
          </h3>
          <p className="text-sm text-green-700 dark:text-green-300">
            We've sent a password reset link to your email address. Click the
            link to reset your password.
          </p>
        </div>
        <p className="text-muted-foreground text-sm">
          Didn't receive the email? Check your spam folder or try again.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-3">
        <div className="grid gap-1">
          <Label className="sr-only" htmlFor="email">
            Email
          </Label>
          <Input
            id="email"
            placeholder="Enter your email address"
            type="email"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect="off"
            disabled={isLoading}
            {...register("email")}
          />
          {errors?.email && (
            <p className="text-sm px-1 font-medium text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>
        <Button disabled={isLoading} className="mt-4">
          {isLoading && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
          Send reset link
        </Button>
      </div>
    </form>
  );
}
