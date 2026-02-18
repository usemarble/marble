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
    <div className="grid h-screen place-items-center bg-surface dark:bg-background">
      <Card className="rounded-[20px] border-none bg-surface p-2 sm:w-[450px]">
        <div className="flex flex-col gap-6 rounded-[12px] bg-background p-6 shadow-xs">
          <CardHeader className="mb-0 items-center gap-0 text-center">
            <CardTitle className="font-medium text-2xl">
              New workspace
            </CardTitle>
            <CardDescription className="text-center">
              {hasWorkspaces
                ? "Set up your new workspace."
                : "You'll need a workspace to proceed."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <form
              className="flex flex-col gap-10"
              onSubmit={handleSubmit(onSubmit)}
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label className="sr-only" htmlFor="name">
                    Name
                  </Label>

                  <Input
                    id="name"
                    placeholder="Name"
                    {...register("name", {
                      onChange: (e) => {
                        setValue("slug", generateSlug(e.target.value));
                      },
                    })}
                  />
                  {errors.name && (
                    <ErrorMessage>{errors.name.message}</ErrorMessage>
                  )}
                </div>
                <div className="grid flex-1 gap-2">
                  <Label className="sr-only" htmlFor="slug">
                    Slug
                  </Label>
                  <div className="flex w-full overflow-hidden rounded-md border border-input bg-transparent text-base shadow-xs transition-[color,box-shadow] placeholder:text-muted-foreground focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30">
                    <span className="border-r bg-muted p-2">
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
                <AsyncButton
                  className="flex w-full cursor-pointer gap-2"
                  isLoading={isSubmitting}
                  type="submit"
                >
                  Create
                </AsyncButton>
                {hasWorkspaces && (
                  <Link
                    className={cn(
                      buttonVariants({ variant: "ghost" }),
                      "w-full"
                    )}
                    href="/"
                  >
                    Back to dashboard
                  </Link>
                )}
              </div>
            </form>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}

export default PageClient;
