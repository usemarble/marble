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
import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { WorkspacePageWrapper } from "@/components/layout/workspace-wrapper";
import { DeleteWorkspaceModal } from "@/components/settings/delete-workspace-modal";
import { uploadWorkspaceLogoAction } from "@/lib/actions/media";
import {
  checkWorkspaceSlug,
  updateWorkspaceAction,
} from "@/lib/actions/workspace";
import { useWorkspace } from "@/providers/workspace";

const nameSchema = z.object({
  name: z.string().min(1),
});

const slugSchema = z.object({
  slug: z.string().min(1),
});

function PageClient() {
  const router = useRouter();
  const { activeWorkspace } = useWorkspace();
  const [isNameChanged, setIsNameChanged] = useState(false);
  const [isSlugChanged, setIsSlugChanged] = useState(false);
  const [idCopied, setIdCopied] = useState(false);
  const [logoCopied, setLogoCopied] = useState(false);
  const [logoUrl, setLogoUrl] = useState(activeWorkspace?.logo);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { updateActiveWorkspace } = useWorkspace();

  const nameForm = useForm<z.infer<typeof nameSchema>>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: activeWorkspace?.name || "" },
  });

  const slugForm = useForm<z.infer<typeof slugSchema>>({
    resolver: zodResolver(slugSchema),
    defaultValues: { slug: activeWorkspace?.slug || "" },
  });

  useEffect(() => {
    const nameSubscription = nameForm.watch((value) => {
      setIsNameChanged(value.name !== activeWorkspace?.name);
    });
    const slugSubscription = slugForm.watch((value) => {
      setIsSlugChanged(value.slug !== activeWorkspace?.slug);
    });

    return () => {
      nameSubscription.unsubscribe();
      slugSubscription.unsubscribe();
    };
  }, [
    nameForm.watch,
    slugForm.watch,
    activeWorkspace?.name,
    activeWorkspace?.slug,
  ]);

  const onNameSubmit = async (data: z.infer<typeof nameSchema>) => {
    try {
      if (!activeWorkspace?.id) return;
      await updateWorkspaceAction(activeWorkspace?.id, {
        ...data,
        slug: activeWorkspace?.slug,
      });
      toast.success("Workspace name updated.", { position: "bottom-center" });
      router.refresh();
      setIsNameChanged(false);
    } catch (error) {
      toast.error("Failed to update.", { position: "bottom-center" });
    }
  };

  const onSlugSubmit = async (data: z.infer<typeof slugSchema>) => {
    if (!activeWorkspace?.id) return;

    try {
      const slugExists = await checkWorkspaceSlug(
        data.slug,
        activeWorkspace?.id,
      );
      if (slugExists) {
        slugForm.setError("slug", { message: "Slug is already taken" });
        return;
      }

      const updatedWorkspace = await updateWorkspaceAction(
        activeWorkspace?.id,
        {
          ...data,
          name: activeWorkspace?.name,
        },
      );
      toast.success("Workspace slug updated.", { position: "bottom-center" });
      router.replace(`/${updatedWorkspace.slug}/settings`);
      router.refresh();
      setIsSlugChanged(false);
    } catch (error) {
      toast.error("Failed to update.", { position: "bottom-center" });
    }
  };

  const copyWorkspaceId = () => {
    if (!activeWorkspace?.id) return;
    setIdCopied(true);
    navigator.clipboard.writeText(activeWorkspace?.id);
    toast.success("ID copied to clipboard.");
    setTimeout(() => {
      setIdCopied(false);
    }, 1000);
  };

  const copyWorkspaceLogo = () => {
    if (!logoUrl) return;
    setLogoCopied(true);
    navigator.clipboard.writeText(logoUrl);
    toast.success("Logo URL copied to clipboard.");
    setTimeout(() => {
      setLogoCopied(false);
    }, 1000);
  };

  const handleLogoUpload = async () => {
    if (!file) return;

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/compress", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Compression failed");
      }

      const compressedBlob = await response.blob();
      const compressedFile = new File(
        [compressedBlob],
        file.name.replace(/\.[^/.]+$/, ".webp"),
        {
          type: "image/webp",
        },
      );

      const result = await uploadWorkspaceLogoAction(compressedFile);

      setLogoUrl(result.logoUrl);
      updateActiveWorkspace(activeWorkspace?.slug!, { logo: result.logoUrl });

      setIsUploading(false);
      toast.success("Uploaded complete", {
        id: "uploading",
      });

      setFile(null);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image",
        {
          id: "uploading",
        },
      );
      setIsUploading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (file) {
      handleLogoUpload();
    }
  }, [file]);

  return (
    <WorkspacePageWrapper className="flex flex-col gap-8 py-12">
      <Card>
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
                />
              </div>
              <Button
                disabled={!isNameChanged || nameForm.formState.isSubmitting}
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

      <Card>
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
                />
              </div>
              <Button
                disabled={!isSlugChanged || slugForm.formState.isSubmitting}
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

      <Card>
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
                  isUploading && "pointer-events-none",
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
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && !isUploading) {
                      setFile(file);
                      handleLogoUpload();
                    }
                  }}
                  className="sr-only"
                />
                <div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center transition-opacity duration-300 bg-background/50 backdrop-blur-sm size-full",
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
              <Input defaultValue={logoUrl || undefined} readOnly />
              <Button
                variant="outline"
                type="submit"
                size="icon"
                onClick={copyWorkspaceLogo}
                className="px-3"
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

      <Card>
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
              <Input id="link" defaultValue={activeWorkspace?.id} readOnly />
            </div>
            <Button
              variant="outline"
              type="submit"
              size="icon"
              onClick={copyWorkspaceId}
              className="px-3"
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

      <Card>
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
          <DeleteWorkspaceModal id={activeWorkspace?.id!} />
        </CardFooter>
      </Card>
    </WorkspacePageWrapper>
  );
}

export default PageClient;
