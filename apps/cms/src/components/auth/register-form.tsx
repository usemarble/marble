"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { buttonVariants } from "@marble/ui/components/button";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/components/sonner";
import { cn } from "@marble/ui/lib/utils";
import { EyeIcon, EyeSlashIcon, Spinner } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { AsyncButton } from "@/components/ui/async-button";
import { useLocalStorage } from "@/hooks/use-localstorage";
import { authClient } from "@/lib/auth/client";
import { type CredentialData, credentialSchema } from "@/lib/validations/auth";
import type { AuthMethod } from "@/types/misc";
import { Github, Google } from "../icons/social";
import { LoadingSpinner } from "../ui/async-button";
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
        email: email,
        type: "email-verification",
      })
      .then((_res) => {
        startTransition(() => {
          router.push(
            `/verify?email=${encodeURIComponent(email)}&from=${callbackURL}`,
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
        },
      );
    } catch (_error) {
      toast.error("Sign in failed. Please try again.");
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
      return toast("Your sign in request failed. Please try again.");
    } finally {
      setLastUsedAuthMethod(provider);
      provider === "google"
        ? setIsGoogleLoading(false)
        : setIsGithubLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "relative",
          )}
          onClick={async () => handleSocialSignIn("google")}
          disabled={isCredentialsLoading || isGoogleLoading || isGithubLoading}
        >
          <LastUsedBadge
            show={lastUsedAuthMethod === "google"}
            variant="info"
          />
          {isGoogleLoading ? (
            <Spinner className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Google className="mr-2 h-4 w-4" />
          )}{" "}
          Google
        </button>
        <button
          type="button"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "relative gap-2",
          )}
          onClick={async () => handleSocialSignIn("github")}
          disabled={isCredentialsLoading || isGoogleLoading || isGithubLoading}
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
            {/** biome-ignore lint/correctness/useUniqueElementIds: <> */}
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
              <p className="text-xs px-1 font-medium text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="password">
              Password
            </Label>
            <div className="relative">
              {/** biome-ignore lint/correctness/useUniqueElementIds: <> */}
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
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setIsPasswordVisible((prev) => !prev)}
              >
                {isPasswordVisible ? (
                  <EyeIcon className="size-4" />
                ) : (
                  <EyeSlashIcon className="size-4" />
                )}
              </button>
            </div>
            {errors?.password && (
              <p className="text-xs px-1 font-medium text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
          <AsyncButton
            disabled={isGoogleLoading || isGithubLoading || isRedirecting}
            isLoading={isCredentialsLoading || isRedirecting}
            className={cn("mt-4", "relative")}
            type="submit"
          >
            <LastUsedBadge
              show={true}
              variant="secondary"
              className="border-input"
            />
            Continue
          </AsyncButton>
        </div>
      </form>
    </div>
  );
}
