"use client";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@marble/ui/components/input-otp";
import { toast } from "@marble/ui/components/sonner";
import { cn } from "@marble/ui/lib/utils";
import { REGEXP_ONLY_DIGITS } from "input-otp";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AsyncButton } from "@/components/ui/async-button";
import { authClient } from "@/lib/auth/client";
import Container from "../shared/container";

interface VerifyFormProps {
  email: string;
  callbackUrl: string;
}

export function VerifyForm({ email, callbackUrl }: VerifyFormProps) {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResendLoading, setIsResendLoading] = useState(false);
  const [isResendSuccess, setIsResendSuccess] = useState(false);
  const [waitingSeconds, setWaitingSeconds] = useState(30);
  const router = useRouter();

  useEffect(() => {
    if (waitingSeconds > 0) {
      const timeout = setTimeout(() => {
        setWaitingSeconds(waitingSeconds - 1);
      }, 1000);
      return () => clearTimeout(timeout);
    }
    if (waitingSeconds === 0 && isResendSuccess) {
      // Reset success state when countdown ends
      setIsResendSuccess(false);
    }
  }, [waitingSeconds, isResendSuccess]);

  const handleResendCode = async () => {
    setIsResendLoading(true);
    try {
      await authClient.emailOtp.sendVerificationOtp({
        email: email,
        type: "email-verification",
      });
      toast.success("Verification code sent!");
    } catch {
      toast.error("Failed to resend code. Please try again.");
    } finally {
      setWaitingSeconds(30);
      setIsResendLoading(false);
      setIsResendSuccess(true);
    }
  };

  const handleVerifyOtp = async () => {
    setIsLoading(true);
    try {
      const result = await authClient.emailOtp.verifyEmail({
        email: email,
        otp: otp,
      });

      if (result.data) {
        toast.success("Email verified successfully!");
        router.push(callbackUrl);
      } else {
        toast.error("Invalid verification code");
      }
    } catch {
      toast.error("Invalid verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="min-h-screen flex items-center justify-center py-12">
      <div className="flex max-w-sm w-full flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-lg font-semibold leading-7">Verify your email</h1>
          <p className="leading-6 text-muted-foreground">
            We sent a verification code to
            <span className="block font-medium text-foreground">{email}</span>
          </p>
        </div>

        <InputOTP
          maxLength={6}
          value={otp}
          pattern={REGEXP_ONLY_DIGITS}
          onChange={(value: string) => setOtp(value)}
        >
          <InputOTPGroup className="flex items-center gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <InputOTPSlot key={crypto.randomUUID()} index={index} />
            ))}
          </InputOTPGroup>
        </InputOTP>

        <div className="flex flex-col items-center gap-4 w-full">
          <AsyncButton
            onClick={handleVerifyOtp}
            isLoading={isLoading}
            disabled={otp.length !== 6}
            className={cn(
              "flex items-center justify-center w-full",
              otp.length !== 6 && "cursor-not-allowed",
            )}
          >
            Verify email
          </AsyncButton>

          <div className="flex flex-col items-center gap-3">
            <p className="text-muted-foreground text-sm">
              Didn&apos;t receive the code?
            </p>
            <AsyncButton
              variant="outline"
              onClick={handleResendCode}
              isLoading={isResendLoading}
              disabled={waitingSeconds > 0}
              className={cn(
                "text-muted-foreground",
                isResendLoading || (waitingSeconds > 0 && "cursor-not-allowed"),
              )}
            >
              {isResendLoading
                ? "Sending..."
                : waitingSeconds > 0
                  ? `Resend code (${waitingSeconds}s)`
                  : "Resend code"}
            </AsyncButton>
          </div>
        </div>
      </div>
    </Container>
  );
}
