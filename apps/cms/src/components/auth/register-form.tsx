"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { buttonVariants } from "@marble/ui/components/button";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/hooks/use-toast";
import { cn } from "@marble/ui/lib/utils";
import { EyeIcon, EyeSlashIcon, SpinnerIcon } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { ButtonLoadingSpinner } from "@/components/ui/loading-spinner";
import { useLocalStorage } from "@/hooks/use-localstorage";
import { authClient } from "@/lib/auth/client";
import { type CredentialData, credentialSchema } from "@/lib/validations/auth";
import type { AuthMethod } from "@/types/misc";
import { Github, Google } from "../icons/social";
import { AsyncButton } from "../ui/async-button";
import { LastUsedBadge } from "../ui/last-used-badge";

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
  const [lastUsedAuthMethod, setLastUsedAuthMethod] =
    useLocalStorage<AuthMethod | null>("lastUsedAuthMethod", null);
  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("from") || "/";
  const router = useRouter();
  const [isRedirecting, startTransition] = useTransition();

  const initiateEmailVerification = async (email: string) => {
    // at this point user is already registered
    // so we can redirect to verify even if sending fails
    // they can initiate another verification email from the verify page
    await authClient.emailOtp
      .sendVerificationOtp({
        email,
        type: "email-verification",
      })
      .then((_res) => {
        startTransition(() => {
          router.push(
            `/verify?email=${encodeURIComponent(email)}&from=${callbackURL}`
          );
        });
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
        },
        {
          onSuccess: () => {
            setLastUsedAuthMethod("email");
            initiateEmailVerification(formData.email);
          },
          onError: (ctx) => {
            toast.error(ctx.error.message);
          },
        }
      );
    } catch (_error) {
      toast.error("Sign in failed. Please try again.");
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
      return toast("Your sign in request failed. Please try again.");
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
            "relative gap-2"
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
            <ButtonLoadingSpinner />
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
              placeholder="name@example.com"
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
                placeholder="Your password"
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
            disabled={isGoogleLoading || isGithubLoading || isRedirecting}
            isLoading={isCredentialsLoading || isRedirecting}
            type="submit"
          >
            Continue
          </AsyncButton>
        </div>
      </form>
    </div>
  );
}
