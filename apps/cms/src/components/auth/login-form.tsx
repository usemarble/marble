"use client";

import { Github, Google } from "@/components/shared/icons";
import { authClient } from "@/lib/auth/client";
import { type CredentialData, credentialSchema } from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, buttonVariants } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { toast } from "@repo/ui/components/sonner";
import { EyeClosedIcon, EyeIcon, Loader } from "@repo/ui/lib/icons";
import { cn } from "@repo/ui/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

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

  async function onSubmit(data: CredentialData) {
    setIsCredentialsLoading(true);

    const res = await authClient.signIn.email(
      {
        email: data.email.toLowerCase(),
        password: data.password,
      },
      {
        onSuccess: (ctx) => {
          router.push("/");
        },
      },
    );

    setIsCredentialsLoading(false);

    if (res.error) {
      return toast("Your sign in request failed. Please try again.");
    }
    return toast("Sign in successful");
  }

  const handleSocialSignIn = async (provider: "google" | "github") => {
    provider === "google" ? setIsGoogleLoading(true) : setIsGithubLoading(true);

    try {
      const signInResult = await authClient.signIn.social({
        provider,
        callbackURL: searchParams?.get("from") || "/",
      });
      if (signInResult.data) {
        return toast("Sign in successful");
      }
    } catch (error) {
      return toast("Your sign in request failed. Please try again.");
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
          type="button"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          onClick={async () => handleSocialSignIn("google")}
          disabled={isCredentialsLoading || isGoogleLoading || isGithubLoading}
        >
          {isGoogleLoading ? (
            <Loader className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Google className="mr-2 size-4" />
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
            <Github className="mr-2 size-4" />
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
              placeholder="Your email"
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
                className="absolute right-4 top-3"
                onClick={() => setIsPasswordVisible((prev) => !prev)}
              >
                {isPasswordVisible ? <EyeIcon className="size-4"/> : <EyeClosedIcon className="size-4"/>}
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
