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
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { ErrorMessage } from "@/components/auth/error-message";
import { ButtonLoader } from "@/components/ui/loader";
import { TimezoneSelector } from "@/components/ui/timezone-selector";
import { organization, useSession } from "@/lib/auth/client";
import { timezones } from "@/lib/constants";
import {
  type CreateWorkspaceValues,
  workspaceSchema,
} from "@/lib/validations/workspace";
import { generateSlug } from "@/utils/string";

function PageClient({ hasWorkspaces }: { hasWorkspaces: boolean }) {
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
  const { name } = watch();
  const { data: session } = useSession();
  console.log("session at create workspace page", session);

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
      const { data, error: err } = await organization.create({
        name: payload.name,
        slug: payload.slug,
        timezone: payload.timezone,
        logo: `https://api.dicebear.com/9.x/glass/svg?seed=${payload.name}`,
      });
      if (err) {
        toast.error(err.message);
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
    } catch (err) {
      console.error("Failed to create workspace", err);
      toast.error("Failed to create workspace");
    }
  }
  return (
    <div className="grid h-screen place-items-center bg-sidebar dark:bg-background">
      <Card className="rounded-[24px] px-5 py-7 sm:min-w-[500px] dark:bg-sidebar">
        <CardHeader className="mb-5 items-center text-center">
          <Image
            alt="MarbleCMS"
            className="mb-4"
            height={40}
            src="/icon.svg"
            width={40}
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
                <Label className="sr-only" htmlFor="name">
                  Name
                </Label>
                <Input id="name" placeholder="Name" {...register("name")} />
                {errors.name && (
                  <ErrorMessage>{errors.name.message}</ErrorMessage>
                )}
              </div>
              <div className="grid flex-1 gap-2">
                <Label className="sr-only" htmlFor="slug">
                  Slug
                </Label>
                <div className="flex w-full overflow-hidden rounded-md border border-input bg-background text-base placeholder:text-muted-foreground focus-within:border-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm">
                  <span className="border-r bg-sidebar px-2 py-2.5">
                    {process.env.NEXT_PUBLIC_APP_URL?.split("//")[1]}/
                  </span>
                  <input
                    id="slug"
                    placeholder="Slug"
                    {...register("slug")}
                    autoComplete="off"
                    className="w-full bg-transparent px-2 py-2 outline-none ring-0"
                  />
                </div>
                {errors.slug && (
                  <ErrorMessage>{errors.slug.message}</ErrorMessage>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label className="sr-only" htmlFor="timezone">
                  Timezone
                </Label>
                <Controller
                  control={control}
                  name="timezone"
                  render={({ field }) => (
                    <TimezoneSelector
                      onValueChange={field.onChange}
                      placeholder="Select timezone..."
                      timezones={timezones}
                      value={field.value}
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
                className="flex w-full gap-2"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? <ButtonLoader /> : "Create"}
              </Button>
              {hasWorkspaces && (
                <Link
                  className={cn(buttonVariants({ variant: "ghost" }), "w-full")}
                  href="/"
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
