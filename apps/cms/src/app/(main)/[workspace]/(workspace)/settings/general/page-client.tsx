"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@marble/ui/components/avatar";
import { Button } from "@marble/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@marble/ui/components/card";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/components/sonner";
import { cn } from "@marble/ui/lib/utils";
import { Image, UploadSimple } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { WorkspacePageWrapper } from "@/components/layout/workspace-wrapper";
import { CopyButton } from "@/components/ui/copy-button";

const DeleteWorkspaceModal = dynamic(() =>
  import("@/components/settings/delete-workspace-modal").then(
    (mod) => mod.DeleteWorkspaceModal,
  ),
);

import { TimezoneSelector } from "@/components/ui/timezone-selector";
import { updateWorkspaceAction } from "@/lib/actions/workspace";
import { organization } from "@/lib/auth/client";
import { timezones } from "@/lib/constants";
import { uploadFile } from "@/lib/media/upload";
import {
  type NameValues,
  nameSchema,
  type SlugValues,
  slugSchema,
  type TimezoneValues,
  timezoneSchema,
} from "@/lib/validations/workspace";
import { useWorkspace } from "@/providers/workspace";

function PageClient() {
  const router = useRouter();
  const { activeWorkspace, isOwner, updateActiveWorkspace } = useWorkspace();
  const [isNameChanged, setIsNameChanged] = useState(false);
  const [isSlugChanged, setIsSlugChanged] = useState(false);
  const [isTimezoneChanged, setIsTimezoneChanged] = useState(false);
  const [logoUrl, setLogoUrl] = useState(activeWorkspace?.logo);
  const [file, setFile] = useState<File | null>(null);

  const { mutate: uploadLogo, isPending: isUploading } = useMutation({
    mutationFn: (file: File) => {
      return uploadFile({ file, type: "logo" });
    },
    onSuccess: (data) => {
      setLogoUrl(data.logoUrl);
      updateActiveWorkspace({
        logo: data.logoUrl,
      });
      toast.success("Uploaded complete");
      setFile(null);
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast.error(error.message);
    },
  });

  const nameForm = useForm<NameValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: activeWorkspace?.name || "" },
  });

  const slugForm = useForm<SlugValues>({
    resolver: zodResolver(slugSchema),
    defaultValues: { slug: activeWorkspace?.slug || "" },
  });

  const timezoneForm = useForm<TimezoneValues>({
    resolver: zodResolver(timezoneSchema),
    defaultValues: { timezone: activeWorkspace?.timezone || "UTC" },
  });

  useEffect(() => {
    if (activeWorkspace?.timezone) {
      timezoneForm.reset({ timezone: activeWorkspace.timezone });
    }
  }, [activeWorkspace?.timezone, timezoneForm]);

  useEffect(() => {
    const nameSubscription = nameForm.watch((value) => {
      setIsNameChanged(value.name !== activeWorkspace?.name);
    });
    const slugSubscription = slugForm.watch((value) => {
      setIsSlugChanged(value.slug !== activeWorkspace?.slug);
    });
    const timezoneSubscription = timezoneForm.watch((value) => {
      setIsTimezoneChanged(value.timezone !== activeWorkspace?.timezone);
    });

    return () => {
      nameSubscription.unsubscribe();
      slugSubscription.unsubscribe();
      timezoneSubscription.unsubscribe();
    };
  }, [
    nameForm.watch,
    slugForm.watch,
    timezoneForm.watch,
    activeWorkspace?.name,
    activeWorkspace?.slug,
    activeWorkspace?.timezone,
  ]);

  const onNameSubmit = async (data: NameValues) => {
    if (!isOwner) return;

    try {
      if (!activeWorkspace?.id) return;
      await updateWorkspaceAction(activeWorkspace?.id, {
        ...data,
        slug: activeWorkspace?.slug,
      });
      toast.success("Workspace name updated");
      setIsNameChanged(false);
      router.refresh();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update";
      toast.error(errorMessage);
    }
  };

  const onSlugSubmit = async (payload: SlugValues) => {
    if (!isOwner || !activeWorkspace?.id) return;

    try {
      const { data, error } = await organization.checkSlug({
        slug: payload.slug,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      if (!data.status) {
        slugForm.setError("slug", { message: "Slug is already taken" });
        return;
      }

      const updatedWorkspace = await updateWorkspaceAction(
        activeWorkspace?.id,
        {
          ...payload,
          name: activeWorkspace?.name,
        },
      );
      toast.success("Workspace slug updated");
      setIsSlugChanged(false);
      router.replace(`/${updatedWorkspace.slug}/settings`);
      router.refresh();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update";
      toast.error(errorMessage);
    }
  };

  const handleLogoUpload = async () => {
    if (!file || !isOwner) return;

    uploadLogo(file);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: Retrigger the effect when the file changes
  useEffect(() => {
    if (file) {
      handleLogoUpload();
    }
  }, [file]);

  const onTimezoneSubmit = async (data: z.infer<typeof timezoneSchema>) => {
    if (!isOwner || !activeWorkspace?.id) return;

    try {
      await updateWorkspaceAction(activeWorkspace?.id, {
        name: activeWorkspace?.name,
        slug: activeWorkspace?.slug,
        timezone: data.timezone,
      });
      toast.success("Workspace timezone updated");
      setIsTimezoneChanged(false);
      router.refresh();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update timezone";
      toast.error(errorMessage);
    }
  };

  return (
    <WorkspacePageWrapper className="flex flex-col gap-8 py-12">
      <Card className="p-6">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Workspace Name</CardTitle>
          <CardDescription>The name of your workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={nameForm.handleSubmit(onNameSubmit)}
            className="flex flex-col gap-2 w-full"
          >
            <div className="flex gap-2 items-center">
              <div className="flex flex-col gap-2 flex-1">
                <Label htmlFor="name" className="sr-only">
                  Name
                </Label>
                <Input
                  id="name"
                  {...nameForm.register("name")}
                  placeholder="Technology"
                  disabled={!isOwner}
                />
              </div>
              <Button
                disabled={
                  !isOwner || !isNameChanged || nameForm.formState.isSubmitting
                }
                className={cn("w-20 self-end flex gap-2 items-center")}
              >
                {nameForm.formState.isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
            {nameForm.formState.errors.name && (
              <p className="text-xs text-destructive">
                {nameForm.formState.errors.name.message}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="p-6">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Workspace Slug</CardTitle>
          <CardDescription>Your unique workspace slug.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={slugForm.handleSubmit(onSlugSubmit)}
            className="flex flex-col gap-2 w-full"
          >
            <div className="flex gap-2 items-center">
              <div className="flex flex-col gap-2 flex-1">
                <Label htmlFor="slug" className="sr-only">
                  Slug
                </Label>
                <Input
                  id="slug"
                  {...slugForm.register("slug")}
                  placeholder="workspace"
                  disabled={!isOwner}
                />
              </div>
              <Button
                disabled={
                  !isOwner || !isSlugChanged || slugForm.formState.isSubmitting
                }
                className={cn("w-20 self-end flex gap-2 items-center")}
              >
                {slugForm.formState.isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
            {slugForm.formState.errors.slug && (
              <p className="text-xs text-destructive">
                {slugForm.formState.errors.slug.message}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="p-6">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Workspace Logo.</CardTitle>
          <CardDescription>
            Upload a logo for your workspace. (Square image recommended.
            Accepted file types: .png, .jpg)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-5">
              <Label
                htmlFor="logo"
                className={cn(
                  "cursor-pointer relative overflow-hidden rounded-full size-16 group",
                  (isUploading || !isOwner) && "pointer-events-none",
                  !isOwner && "opacity-50",
                )}
              >
                <Avatar className="size-16">
                  <AvatarImage src={logoUrl || undefined} />
                  <AvatarFallback>
                    <Image className="size-4" />
                  </AvatarFallback>
                </Avatar>
                <input
                  title="Upload logo"
                  type="file"
                  id="logo"
                  accept="image/*"
                  disabled={!isOwner}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && !isUploading && isOwner) {
                      setFile(file);
                    }
                  }}
                  className="sr-only"
                />
                <div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center transition-opacity duration-300 bg-background/50 backdrop-blur-xs size-full",
                    isUploading
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100",
                  )}
                >
                  {isUploading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <UploadSimple className="size-4" />
                  )}
                </div>
              </Label>
            </div>
            <div className="flex items-center gap-2 w-full">
              <Input value={logoUrl || ""} readOnly />
              <CopyButton
                textToCopy={logoUrl || ""}
                toastMessage="Logo URL copied to clipboard."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="p-6">
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            Workspace Timezone
          </CardTitle>
          <CardDescription>
            The timezone of your workspace. (Used for scheduled posts and the
            display of dates)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={timezoneForm.handleSubmit(onTimezoneSubmit)}
            className="flex flex-col gap-2 w-full"
          >
            <div className="flex gap-2 items-center">
              <div className="flex flex-col gap-2 flex-1">
                <Label htmlFor="timezone" className="sr-only">
                  Timezone
                </Label>
                <TimezoneSelector
                  value={timezoneForm.watch("timezone")}
                  onValueChange={(value) => {
                    timezoneForm.setValue("timezone", value);
                    timezoneForm.trigger("timezone");
                  }}
                  disabled={!isOwner}
                  placeholder="Select timezone..."
                  timezones={timezones}
                />
              </div>
              <Button
                disabled={
                  !isOwner ||
                  !isTimezoneChanged ||
                  timezoneForm.formState.isSubmitting
                }
                className={cn("w-20 self-end flex gap-2 items-center")}
              >
                {timezoneForm.formState.isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
            {timezoneForm.formState.errors.timezone && (
              <p className="text-xs text-destructive">
                {timezoneForm.formState.errors.timezone.message}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="p-6">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Workspace ID.</CardTitle>
          <CardDescription>
            Unique identifier of your workspace on marble.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">
                Link
              </Label>
              <Input id="link" value={activeWorkspace?.id || ""} readOnly />
            </div>
            <CopyButton
              textToCopy={activeWorkspace?.id || ""}
              toastMessage="ID copied to clipboard."
            />
          </div>
        </CardContent>
      </Card>

      {isOwner && (
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-lg font-medium">
              Delete workspace.
            </CardTitle>
            <CardDescription>
              Permanently delete your workspace and all associated data within.
              This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-end">
            <DeleteWorkspaceModal id={activeWorkspace?.id as string} />
          </CardFooter>
        </Card>
      )}
    </WorkspacePageWrapper>
  );
}

export default PageClient;
