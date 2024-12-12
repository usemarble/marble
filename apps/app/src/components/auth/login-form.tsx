"use client";

import { Github, Google } from "@/components/shared/icons";
import { type LoginData, loginSchema } from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, buttonVariants } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { toast } from "@repo/ui/components/sonner";
import { cn } from "@repo/ui/lib/utils";
import { Loader } from "lucide-react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isCredentialsLoading, setIsCredentialsLoading] = useState(false);
  const searchParams = useSearchParams();

  async function onSubmit(data: LoginData) {
    setIsCredentialsLoading(true);

    const signInResult = await signIn("credentials", {
      email: data.email.toLowerCase(),
      redirect: false,
      callbackUrl: searchParams?.get("from") || "/app",
    });

    setIsCredentialsLoading(false);

    if (!signInResult?.ok) {
      return toast("Your sign in request failed. Please try again.");
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);

    const signInResult = await signIn("google", {
      redirect: false,
      callbackUrl: searchParams?.get("from") || "/app",
    });

    setIsGoogleLoading(false);

    if (!signInResult?.ok) {
      return toast("Your sign in request failed. Please try again.");
    }
  };

  const handleGithubSignIn = async () => {
    setIsGithubLoading(true);

    const signInResult = await signIn("apple", {
      redirect: false,
      callbackUrl: searchParams?.get("from") || "/app",
    });

    setIsGithubLoading(false);

    if (!signInResult?.ok) {
      return toast("Your sign in request failed. Please try again.");
    }
  };

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className={cn(buttonVariants({ variant: "outline" }))}
          onClick={handleGoogleSignIn}
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
          className={cn(buttonVariants({ variant: "outline" }))}
          onClick={handleGithubSignIn}
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
            <Input
              id="password"
              placeholder="your password"
              type="password"
              autoCapitalize="none"
              autoCorrect="off"
              disabled={
                isCredentialsLoading || isGoogleLoading || isGithubLoading
              }
              {...register("password")}
            />
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
