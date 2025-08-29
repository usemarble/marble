"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { buttonVariants } from "@marble/ui/components/button";
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
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { ErrorMessage } from "@/components/auth/error-message";
import { AsyncButton } from "@/components/ui/async-button";
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
      <Card className="rounded-[24px] sm:w-[450px] py-6 px-4">
        <CardHeader className="text-center mb-5 items-center">
          <CardTitle className="font-medium">New workspace</CardTitle>
          <CardDescription className="text-center">
            {hasWorkspaces
              ? "Set up your new workspace."
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
                {/** biome-ignore lint/correctness/useUniqueElementIds: <> */}
                <Input id="name" placeholder="Name" {...register("name")} />
                {errors.name && (
                  <ErrorMessage>{errors.name.message}</ErrorMessage>
                )}
              </div>
              <div className="grid flex-1 gap-2">
                <Label htmlFor="slug" className="sr-only">
                  Slug
                </Label>
                <div className="flex w-full rounded-md border border-input bg-transparent dark:bg-input/30 text-base placeholder:text-muted-foreground shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm overflow-hidden">
                  <span className="p-2 bg-muted border-r">
                    {process.env.NEXT_PUBLIC_APP_URL?.split("//")[1]}/
                  </span>
                  {/** biome-ignore lint/correctness/useUniqueElementIds: <> */}
                  <input
                    id="slug"
                    placeholder="Slug"
                    {...register("slug")}
                    autoComplete="off"
                    className="w-full bg-transparent py-2 px-2 outline-none ring-0"
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
              <AsyncButton
                type="submit"
                size="lg"
                isLoading={isSubmitting}
                className="flex w-full gap-2 cursor-pointer"
              >
                Create
              </AsyncButton>
              {hasWorkspaces && (
                <Link
                  href="/"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "lg" }),
                    "w-full",
                  )}
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
