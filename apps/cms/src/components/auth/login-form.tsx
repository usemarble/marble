"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/components/sonner";
import { cn } from "@marble/ui/lib/utils";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocalStorage } from "@/hooks/use-localstorage";
import { authClient } from "@/lib/auth/client";
import { type CredentialData, credentialSchema } from "@/lib/validations/auth";
import type { AuthMethod } from "@/types/misc";
import { Github, Google } from "../icons/social";
import { AsyncButton } from "../ui/async-button";
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
            } else if (ctx.error.status === 401) {
              toast.error("Invalid email or password");
            } else {
              toast.error(
                ctx.error.message || "Login failed. Please try again."
              );
            }
          },
        }
      );
    } catch (_error) {
      toast("Login failed. Please try again.");
    }
    setIsCredentialsLoading(false);
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
      toast("Sign in failed. Please try again.");
    }
    setLastUsedAuthMethod(provider);
    if (provider === "google") {
      setIsGoogleLoading(false);
    } else {
      setIsGithubLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 gap-4">
        <AsyncButton
          className={cn("relative shadow-none")}
          disabled={isCredentialsLoading || isGoogleLoading || isGithubLoading}
          isLoading={isGoogleLoading}
          onClick={async () => handleSocialSignIn("google")}
          type="button"
          variant="outline"
        >
          <LastUsedBadge
            show={lastUsedAuthMethod === "google"}
            variant="info"
          />
          <Google className="size-4" />
          Google
        </AsyncButton>
        <AsyncButton
          className={cn("relative shadow-none")}
          disabled={isCredentialsLoading || isGoogleLoading || isGithubLoading}
          isLoading={isGithubLoading}
          onClick={async () => handleSocialSignIn("github")}
          type="button"
          variant="outline"
        >
          <LastUsedBadge
            show={lastUsedAuthMethod === "github"}
            variant="info"
          />
          <Github className="size-4" />
          GitHub
        </AsyncButton>
      </div>
      <div className="relative flex items-center">
        <span className="inline-block h-px w-full border-t bg-border" />
        <span className="shrink-0 px-2 text-[10px] text-muted-foreground uppercase">
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
            type="submit"
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
