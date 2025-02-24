"use client";

import { authClient } from "@/lib/auth/client";
import { Button } from "@marble/ui/components/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@marble/ui/components/input-otp";
import { toast } from "@marble/ui/components/sonner";
import { cn } from "@marble/ui/lib/utils";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
      const interval = setInterval(
        () => setWaitingSeconds(waitingSeconds - 1),
        1000,
      );
      return () => clearInterval(interval);
    }
  }, [waitingSeconds]);

  const handleResendCode = async () => {
    setIsResendLoading(true);
    try {
      await authClient.emailOtp.sendVerificationOtp({
        email: email,
        type: "email-verification",
      });
    } catch (error) {
      toast.error("Failed to resend code");
    } finally {
      setWaitingSeconds(30);
      setIsResendLoading(false);
      setIsResendSuccess(true);
    }
  };

  const handleVerifyOtp = async () => {
    setIsLoading(true);
    try {
      await authClient.emailOtp.verifyEmail({
        email: email,
        otp: otp,
      });
      router.push(`${callbackUrl}`);
    } catch (error) {
      console.error("Login Failed:", error);
      toast.error("Login Failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="flex flex-col items-center justify-between py-24">
      <section className="flex w-full flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-lg font-semibold leading-7">Verify your email</h1>
          <p className="leading-6">
            We sent a verification code to
            <span className="block font-medium">{email}</span>
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
        <Button
          onClick={handleVerifyOtp}
          disabled={otp.length !== 6}
          className={cn(
            "flex items-center justify-center min-w-48",
            otp.length !== 6 && "cursor-not-allowed",
          )}
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <span className="w-full text-center">Verify email</span>
          )}
        </Button>
      </section>
      {/*  */}
      <section className="flex w-full flex-col items-center gap-4">
        <p className="text-muted-foreground text-sm">
          Didn&apos;t receive the code?
        </p>
        <Button
          variant="outline"
          onClick={handleResendCode}
          disabled={isResendLoading || isResendSuccess || waitingSeconds > 0}
          className={cn(
            "text-muted-foreground min-w-48",
            isResendLoading || waitingSeconds > 0 && "cursor-not-allowed",
          )}
        >
          {isResendLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <div>
              Resend code {waitingSeconds > 0 && <span>{waitingSeconds}s</span>}
            </div>
          )}
        </Button>
        {/* <div>
          <Button
            variant="outline"
            type="button"
            className="mt-4 cursor-pointer"
            onClick={() => router.back()}
          >
            Back
          </Button>
        </div> */}
      </section>
    </Container>
  );
}
