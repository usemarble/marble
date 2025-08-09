"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, buttonVariants } from "@marble/ui/components/button";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/components/sonner";
import { cn } from "@marble/ui/lib/utils";
import { Eye, EyeClosed, Spinner } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { authClient } from "@/lib/auth/client";
import { type CredentialData, credentialSchema } from "@/lib/validations/auth";
import { Github, Google } from "../icons/social";

export function LoginForm() {
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
  const callbackURL = searchParams?.get("from") || "/";

  async function onSubmit(data: CredentialData) {
    setIsCredentialsLoading(true);

    try {
      await authClient.signIn.email(
        {
          email: data.email.toLowerCase(),
          password: data.password,
        },
        {
          onSuccess: (_ctx) => {
            toast.success("Welcome!");
            router.push(callbackURL);
          },
          onError: (ctx) => {
            if (ctx.error.status === 403) {
              toast.error("Please verify your email address");
            }
          },
        }
      );
    } catch (_error) {
      return toast("Request failed. Please try again.");
    } finally {
      setIsCredentialsLoading(false);
    }
  }

  const handleSocialSignIn = async (provider: "google" | "github") => {
    provider === "google" ? setIsGoogleLoading(true) : setIsGithubLoading(true);

    try {
      await authClient.signIn.social({
        provider,
        callbackURL,
      });
    } catch (_error) {
      return toast("Sign in failed. Please try again.");
    } finally {
      provider === "google"
        ? setIsGoogleLoading(false)
        : setIsGithubLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-4">
        <button
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          disabled={isCredentialsLoading || isGoogleLoading || isGithubLoading}
          onClick={async () => handleSocialSignIn("google")}
          type="button"
        >
          {isGoogleLoading ? (
            <Spinner className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Google className="mr-2 size-4" />
          )}{" "}
          Google
        </button>
        <button
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          disabled={isCredentialsLoading || isGoogleLoading || isGithubLoading}
          onClick={async () => handleSocialSignIn("github")}
          type="button"
        >
          {isGithubLoading ? (
            <Spinner className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Github className="mr-2 size-4" />
          )}{" "}
          GitHub
        </button>
      </div>
      <div className="relative flex items-center">
        <span className="inline-block h-px w-full border-t bg-border" />
        <span className="shrink-0 px-2 text-muted-foreground text-xs uppercase">
          Or
        </span>
        <span className="inline-block h-px w-full border-t bg-border" />
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="email">
              Email
            </Label>
            <Input
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={
                isCredentialsLoading || isGoogleLoading || isGithubLoading
              }
              id="email"
              placeholder="Email"
              type="email"
              {...register("email")}
            />
            {errors?.email && (
              <p className="px-1 font-medium text-destructive text-sm">
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
                autoCapitalize="none"
                autoCorrect="off"
                className="pr-9"
                disabled={
                  isCredentialsLoading || isGoogleLoading || isGithubLoading
                }
                id="password"
                placeholder="Password"
                type={isPasswordVisible ? "text" : "password"}
                {...register("password")}
              />
              <button
                className="absolute top-3 right-4 text-muted-foreground"
                onClick={() => setIsPasswordVisible((prev) => !prev)}
                type="button"
              >
                {isPasswordVisible ? (
                  <Eye className="size-4" />
                ) : (
                  <EyeClosed className="size-4" />
                )}
              </button>
            </div>
            {errors?.password && (
              <p className="px-1 font-medium text-destructive text-sm">
                {errors.password.message}
              </p>
            )}
          </div>
          <Button
            className="mt-4"
            disabled={
              isCredentialsLoading || isGoogleLoading || isGithubLoading
            }
          >
            {isCredentialsLoading && (
              <Spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
}
