"use client";

import { authClient } from "@/lib/auth/client";
import { type CredentialData, credentialSchema } from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, buttonVariants } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { toast } from "@repo/ui/components/sonner";
import { EyeClosedIcon, EyeIcon, Loader, MailCheck } from "@repo/ui/lib/icons";
import { cn } from "@repo/ui/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Github, Google } from "../icons/brand";

export function RegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CredentialData>({
    resolver: zodResolver(credentialSchema),
  });
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isCredentialsLoading, setIsCredentialsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("from") || "/";
  const step = searchParams.get("step");

  const initiateEmailVerification = async (email: string) => {
    await authClient.sendVerificationEmail({
      email: email,
      callbackURL: callbackUrl,
    });
  };

  async function onSubmit(formData: CredentialData) {
    setIsCredentialsLoading(true);

    try {
      await authClient.signUp.email(
        {
          email: formData.email.toLowerCase(),
          password: formData.password,
          name: formData.email.toLowerCase().split("@")[0] || "User",
          image: `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${formData.email.toLowerCase().split("@")[0]}`,
        },
        {
          onSuccess: () => {
            initiateEmailVerification(formData.email);
          },
          onError: (ctx) => {
            toast.error(ctx.error.message);
          },
        },
      );
    } catch (error) {
      return toast("Your sign in request failed. Please try again.");
    } finally {
      setIsCredentialsLoading(false);
    }
  }

  const handleSocialSignIn = async (provider: "google" | "github") => {
    provider === "google" ? setIsGoogleLoading(true) : setIsGithubLoading(true);

    try {
      await authClient.signIn.social({
        provider,
        callbackURL: callbackUrl,
      });
    } catch (error) {
      return toast("Your sign in request failed. Please try again.");
    } finally {
      provider === "google"
        ? setIsGoogleLoading(false)
        : setIsGithubLoading(false);
    }
  };

  if (step === "verify") return <EmailNotification />;

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          onClick={async () => handleSocialSignIn("google")}
          disabled={isCredentialsLoading || isGoogleLoading || isGithubLoading}
        >
          {isGoogleLoading ? (
            <Loader className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Google className="mr-2 h-4 w-4" />
          )}{" "}
          Google
        </button>
        <button
          type="button"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          onClick={async () => handleSocialSignIn("github")}
          disabled={isCredentialsLoading || isGoogleLoading || isGithubLoading}
        >
          {isGithubLoading ? (
            <Loader className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Github className="mr-2 h-4 w-4" />
          )}{" "}
          GitHub
        </button>
      </div>
      <div className="relative flex items-center">
        <span className="bg-border inline-block h-px w-full border-t" />
        <span className="text-muted-foreground shrink-0 px-2 text-xs uppercase">
          Or
        </span>
        <span className="bg-border inline-block h-px w-full border-t" />
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="email">
              Email
            </Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={
                isCredentialsLoading || isGoogleLoading || isGithubLoading
              }
              {...register("email")}
            />
            {errors?.email && (
              <p className="text-sm px-1 font-medium text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="password">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                placeholder="Your password"
                type={isPasswordVisible ? "text" : "password"}
                autoCapitalize="none"
                autoCorrect="off"
                disabled={
                  isCredentialsLoading || isGoogleLoading || isGithubLoading
                }
                className="pr-9"
                {...register("password")}
              />
              <button
                type="button"
                className="absolute right-4 top-3 text-muted-foreground"
                onClick={() => setIsPasswordVisible((prev) => !prev)}
              >
                {isPasswordVisible ? (
                  <EyeIcon className="size-4" />
                ) : (
                  <EyeClosedIcon className="size-4" />
                )}
              </button>
            </div>
            {errors?.password && (
              <p className="text-sm px-1 font-medium text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
          <Button
            disabled={
              isCredentialsLoading || isGoogleLoading || isGithubLoading
            }
            className="mt-4"
          >
            {isCredentialsLoading && (
              <Loader className="mr-2 h-4 w-4 animate-spin" />
            )}
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
}

function EmailNotification() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center sr-only">
        <CardTitle>Verify Your Email</CardTitle>
        <CardDescription>
          Check your mail for a verification link to proceed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 pt-8 pb-4">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-blue-100 rounded-full">
            <MailCheck className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-center">
            We've sent a verification link to your mail. Please click the link
            to proceed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
