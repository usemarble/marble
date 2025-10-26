"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { buttonVariants } from "@marble/ui/components/button";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/components/sonner";
import { cn } from "@marble/ui/lib/utils";
import { EyeIcon, EyeSlashIcon, SpinnerIcon } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocalStorage } from "@/hooks/use-localstorage";
import { authClient } from "@/lib/auth/client";
import { type CredentialData, credentialSchema } from "@/lib/validations/auth";
import type { AuthMethod } from "@/types/misc";
import { Github, Google } from "../icons/social";
import { AsyncButton, LoadingSpinner } from "../ui/async-button";
import { LastUsedBadge } from "../ui/last-used-badge";

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
  const [lastUsedAuthMethod, setLastUsedAuthMethod] =
    useLocalStorage<AuthMethod | null>("lastUsedAuthMethod", null);
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
            setLastUsedAuthMethod("email");
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
      return toast("Login failed. Please try again.");
    } finally {
      setIsCredentialsLoading(false);
    }
  }

  const handleSocialSignIn = async (provider: "google" | "github") => {
    if (provider === "google") {
      setIsGoogleLoading(true);
    } else {
      setIsGithubLoading(true);
    }

    try {
      await authClient.signIn.social({
        provider,
        callbackURL,
      });
    } catch (_error) {
      return toast("Sign in failed. Please try again.");
    } finally {
      setLastUsedAuthMethod(provider);
      if (provider === "google") {
        setIsGoogleLoading(false);
      } else {
        setIsGithubLoading(false);
      }
    }
  };

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-4">
        <button
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "relative"
          )}
          disabled={isCredentialsLoading || isGoogleLoading || isGithubLoading}
          onClick={async () => handleSocialSignIn("google")}
          type="button"
        >
          <LastUsedBadge
            show={lastUsedAuthMethod === "google"}
            variant="info"
          />
          {isGoogleLoading ? (
            <SpinnerIcon className="mr-2 size-4 animate-spin" />
          ) : (
            <Google className="mr-2 size-4" />
          )}{" "}
          Google
        </button>
        <button
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "relative"
          )}
          disabled={isCredentialsLoading || isGoogleLoading || isGithubLoading}
          onClick={async () => handleSocialSignIn("github")}
          type="button"
        >
          <LastUsedBadge
            show={lastUsedAuthMethod === "github"}
            variant="info"
          />
          {isGithubLoading ? (
            <LoadingSpinner variant="outline" />
          ) : (
            <Github className="size-4" />
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
              <p className="px-1 font-medium text-destructive text-xs">
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
            {errors?.password && (
              <p className="px-1 font-medium text-destructive text-xs">
                {errors.password.message}
              </p>
            )}
          </div>
          <AsyncButton
            className={cn("mt-4", "relative")}
            disabled={
              isCredentialsLoading || isGoogleLoading || isGithubLoading
            }
            isLoading={isCredentialsLoading}
          >
            <LastUsedBadge
              className="border-input"
              show={lastUsedAuthMethod === "email"}
              variant="secondary"
            />
            Continue
          </AsyncButton>
        </div>
      </form>
    </div>
  );
}
