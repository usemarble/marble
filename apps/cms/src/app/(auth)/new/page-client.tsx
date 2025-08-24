"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, buttonVariants } from "@marble/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@marble/ui/components/card";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/components/sonner";
import { cn } from "@marble/ui/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { ErrorMessage } from "@/components/auth/error-message";
import { ButtonLoader } from "@/components/ui/loader";
import { TimezoneSelector } from "@/components/ui/timezone-selector";
import { organization } from "@/lib/auth/client";
import { timezones } from "@/lib/constants";
import {
  type CreateWorkspaceValues,
  workspaceSchema,
} from "@/lib/validations/workspace";
import { generateSlug } from "@/utils/string";

function PageClient() {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateWorkspaceValues>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  // Yes i know manually changing this will show the button even if false
  // but the middleware will just send you back here so it's whatever
  const hasWorkspaces = searchParams.get("workspaces") === "true";
  const { name } = watch();

  useEffect(() => {
    if (name) {
      const slug = generateSlug(name);
      setValue("slug", slug);
    }
  }, [name, setValue]);

  async function onSubmit(payload: CreateWorkspaceValues) {
    const { error } = await organization.checkSlug({
      slug: payload.slug,
    });

    if (error) {
      toast.error(error.message);
      console.log("check slug error", error);
      return;
    }

    try {
      const { data, error } = await organization.create({
        name: payload.name,
        slug: payload.slug,
        timezone: payload.timezone,
        logo: `https://api.dicebear.com/9.x/glass/svg?seed=${payload.name}`,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      if (data) {
        console.log("setting active organization", data.id);
        await organization.setActive({
          organizationId: data.id,
        });
        console.log("active organization set", data.id);
        router.push(`/${data.slug}`);
        toast.success("Workspace created");
      }
    } catch (error) {
      console.error("Failed to create workspace", error);
      toast.error("Failed to create workspace");
    }
  }
  return (
    <div className="h-screen grid place-items-center bg-sidebar dark:bg-background">
      <Card className="rounded-[24px] sm:min-w-[500px] py-7 px-5 dark:bg-sidebar">
        <CardHeader className="text-center mb-5 items-center">
          <Image
            src="/icon.svg"
            alt="MarbleCMS"
            width={40}
            height={40}
            className="mb-4"
          />
          <CardTitle className="font-medium">New workspace</CardTitle>
          <CardDescription className="max-w-sm">
            {hasWorkspaces
              ? "Set up your new workspace"
              : "You'll need a workspace to proceed."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-10"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name" className="sr-only">
                  Name
                </Label>
                <Input id="name" placeholder="Name" {...register("name")} />
                {errors.name && (
                  <ErrorMessage>{errors.name.message}</ErrorMessage>
                )}
              </div>
              <div className="grid flex-1 gap-2">
                <Label htmlFor="slug" className="sr-only">
                  Slug
                </Label>
                <div className="flex w-full rounded-md border border-input bg-background text-base placeholder:text-muted-foreground focus-within:outline-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm overflow-hidden">
                  <span className="py-2.5 px-2 bg-sidebar border-r">
                    {process.env.NEXT_PUBLIC_APP_URL?.split("//")[1]}/
                  </span>
                  <input
                    id="slug"
                    placeholder="Slug"
                    {...register("slug")}
                    autoComplete="off"
                    className="w-full bg-transparent py-2 px-2 outline-hidden ring-0"
                  />
                </div>
                {errors.slug && (
                  <ErrorMessage>{errors.slug.message}</ErrorMessage>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="timezone" className="sr-only">
                  Timezone
                </Label>
                <Controller
                  name="timezone"
                  control={control}
                  render={({ field }) => (
                    <TimezoneSelector
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select timezone..."
                      timezones={timezones}
                    />
                  )}
                />
                {errors.timezone && (
                  <ErrorMessage>{errors.timezone.message}</ErrorMessage>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full gap-2"
              >
                {isSubmitting ? <ButtonLoader /> : "Create"}
              </Button>
              {hasWorkspaces && (
                <Link
                  href="/"
                  className={cn(buttonVariants({ variant: "ghost" }), "w-full")}
                >
                  Back to dashboard
                </Link>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default PageClient;
