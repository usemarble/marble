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
import { Copy, Image, UploadSimple } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { WorkspacePageWrapper } from "@/components/layout/workspace-wrapper";
import { DeleteWorkspaceModal } from "@/components/settings/delete-workspace-modal";
import { TimezoneSelector } from "@/components/ui/timezone-selector";
import { updateWorkspaceAction } from "@/lib/actions/workspace";
import { organization } from "@/lib/auth/client";
import { timezones } from "@/lib/constants";
import {
  type NameValues,
  nameSchema,
  type SlugValues,
  slugSchema,
  type TimezoneValues,
  timezoneSchema,
} from "@/lib/validations/workspace";
import { useWorkspace } from "@/providers/workspace";

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Not true
function PageClient() {
  const router = useRouter();
  const { activeWorkspace, isOwner, updateActiveWorkspace } = useWorkspace();
  const [isNameChanged, setIsNameChanged] = useState(false);
  const [isSlugChanged, setIsSlugChanged] = useState(false);
  const [isTimezoneChanged, setIsTimezoneChanged] = useState(false);
  const [idCopied, setIdCopied] = useState(false);
  const [logoCopied, setLogoCopied] = useState(false);
  const [logoUrl, setLogoUrl] = useState(activeWorkspace?.logo);
  const [file, setFile] = useState<File | null>(null);

  const { mutate: uploadLogo, isPending: isUploading } = useMutation({
    mutationFn: async (formFile: File) => {
      const formData = new FormData();
      formData.append("file", formFile);

      const response = await fetch("/api/uploads/logo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload logo");
      }

      return response.json();
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
    if (!isOwner) {
      return;
    }

    try {
      if (!activeWorkspace?.id) {
        return;
      }
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
    if (!(isOwner && activeWorkspace?.id)) {
      return;
    }

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
        }
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

  const copyWorkspaceId = () => {
    if (!activeWorkspace?.id) {
      return;
    }
    setIdCopied(true);
    navigator.clipboard.writeText(activeWorkspace?.id);
    toast.success("ID copied to clipboard.");
    setTimeout(() => {
      setIdCopied(false);
    }, 1000);
  };

  const copyWorkspaceLogo = () => {
    if (!logoUrl) {
      return;
    }
    setLogoCopied(true);
    navigator.clipboard.writeText(logoUrl);
    toast.success("Logo URL copied to clipboard.");
    setTimeout(() => {
      setLogoCopied(false);
    }, 1000);
  };

  const handleLogoUpload = () => {
    if (!(file && isOwner)) {
      return;
    }

    uploadLogo(file);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: Retrigger the effect when the file changes
  useEffect(() => {
    if (file) {
      handleLogoUpload();
    }
  }, [file]);

  const onTimezoneSubmit = async (data: z.infer<typeof timezoneSchema>) => {
    if (!(isOwner && activeWorkspace?.id)) {
      return;
    }

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
          <CardTitle className="font-medium text-lg">Workspace Name</CardTitle>
          <CardDescription>The name of your workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex w-full flex-col gap-2"
            onSubmit={nameForm.handleSubmit(onNameSubmit)}
          >
            <div className="flex items-center gap-2">
              <div className="flex flex-1 flex-col gap-2">
                <Label className="sr-only" htmlFor="name">
                  Name
                </Label>
                <Input
                  id="name"
                  {...nameForm.register("name")}
                  disabled={!isOwner}
                  placeholder="Technology"
                />
              </div>
              <Button
                className={cn("flex w-20 items-center gap-2 self-end")}
                disabled={
                  !(isOwner && isNameChanged) || nameForm.formState.isSubmitting
                }
              >
                {nameForm.formState.isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
            {nameForm.formState.errors.name && (
              <p className="text-destructive text-xs">
                {nameForm.formState.errors.name.message}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="p-6">
        <CardHeader>
          <CardTitle className="font-medium text-lg">Workspace Slug</CardTitle>
          <CardDescription>Your unique workspace slug.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex w-full flex-col gap-2"
            onSubmit={slugForm.handleSubmit(onSlugSubmit)}
          >
            <div className="flex items-center gap-2">
              <div className="flex flex-1 flex-col gap-2">
                <Label className="sr-only" htmlFor="slug">
                  Slug
                </Label>
                <Input
                  id="slug"
                  {...slugForm.register("slug")}
                  disabled={!isOwner}
                  placeholder="workspace"
                />
              </div>
              <Button
                className={cn("flex w-20 items-center gap-2 self-end")}
                disabled={
                  !(isOwner && isSlugChanged) || slugForm.formState.isSubmitting
                }
              >
                {slugForm.formState.isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
            {slugForm.formState.errors.slug && (
              <p className="text-destructive text-xs">
                {slugForm.formState.errors.slug.message}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="p-6">
        <CardHeader>
          <CardTitle className="font-medium text-lg">Workspace Logo.</CardTitle>
          <CardDescription>
            Upload a logo for your workspace. (Square image recommended.
            Accepted file types: .png, .jpg)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-5">
              <Label
                className={cn(
                  "group relative size-16 cursor-pointer overflow-hidden rounded-full",
                  (isUploading || !isOwner) && "pointer-events-none",
                  !isOwner && "opacity-50"
                )}
                htmlFor="logo"
              >
                <Avatar className="size-16">
                  <AvatarImage src={logoUrl || undefined} />
                  <AvatarFallback>
                    <Image className="size-4" />
                  </AvatarFallback>
                </Avatar>
                <input
                  accept="image/*"
                  className="sr-only"
                  disabled={!isOwner}
                  id="logo"
                  onChange={(e) => {
                    const eventFile = e.target.files?.[0];
                    if (eventFile && !isUploading && isOwner) {
                      setFile(eventFile);
                    }
                  }}
                  title="Upload logo"
                  type="file"
                />
                <div
                  className={cn(
                    "absolute inset-0 flex size-full items-center justify-center bg-background/50 backdrop-blur-sm transition-opacity duration-300",
                    isUploading
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
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
            <div className="flex w-full items-center gap-2">
              <Input defaultValue={logoUrl || undefined} readOnly />
              <Button
                className="px-3"
                onClick={copyWorkspaceLogo}
                size="icon"
                type="submit"
                variant="outline"
              >
                <span className="sr-only">Copy</span>
                {logoCopied ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="p-6">
        <CardHeader>
          <CardTitle className="font-medium text-lg">
            Workspace Timezone
          </CardTitle>
          <CardDescription>
            The timezone of your workspace. (Used for scheduled posts and the
            display of dates)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex w-full flex-col gap-2"
            onSubmit={timezoneForm.handleSubmit(onTimezoneSubmit)}
          >
            <div className="flex items-center gap-2">
              <div className="flex flex-1 flex-col gap-2">
                <Label className="sr-only" htmlFor="timezone">
                  Timezone
                </Label>
                <TimezoneSelector
                  disabled={!isOwner}
                  onValueChange={(value) => {
                    timezoneForm.setValue("timezone", value);
                    timezoneForm.trigger("timezone");
                  }}
                  placeholder="Select timezone..."
                  timezones={timezones}
                  value={timezoneForm.watch("timezone")}
                />
              </div>
              <Button
                className={cn("flex w-20 items-center gap-2 self-end")}
                disabled={
                  !(isOwner && isTimezoneChanged) ||
                  timezoneForm.formState.isSubmitting
                }
              >
                {timezoneForm.formState.isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
            {timezoneForm.formState.errors.timezone && (
              <p className="text-destructive text-xs">
                {timezoneForm.formState.errors.timezone.message}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="p-6">
        <CardHeader>
          <CardTitle className="font-medium text-lg">Workspace ID.</CardTitle>
          <CardDescription>
            Unique identifier of your workspace on marble.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label className="sr-only" htmlFor="link">
                Link
              </Label>
              <Input defaultValue={activeWorkspace?.id} id="link" readOnly />
            </div>
            <Button
              className="px-3"
              onClick={copyWorkspaceId}
              size="icon"
              type="submit"
              variant="outline"
            >
              <span className="sr-only">Copy</span>
              {idCopied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isOwner && (
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="font-medium text-lg">
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
