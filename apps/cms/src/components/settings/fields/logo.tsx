"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@marble/ui/components/avatar";
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
import { ImageIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useId, useState } from "react";
import { CopyButton } from "@/components/ui/copy-button";
import { organization } from "@/lib/auth/client";
import { uploadFile } from "@/lib/media/upload";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { useWorkspace } from "@/providers/workspace";

export function Logo() {
  const { activeWorkspace, isOwner } = useWorkspace();
  const fileId = useId();
  const queryClient = useQueryClient();
  const [logoUrl, setLogoUrl] = useState(activeWorkspace?.logo);

  const { mutate: updateLogo } = useMutation({
    mutationFn: async ({
      organizationId,
      logoUrl,
    }: {
      organizationId: string;
      logoUrl: string;
    }) => {
      return await organization.update({
        organizationId,
        data: {
          logo: logoUrl,
        },
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.WORKSPACE(variables.organizationId),
      });
      toast.success("Logo updated");
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update workspace logo";
      toast.error(errorMessage);
      console.error("Failed to update workspace logo:", error);
    },
  });

  const { mutate: uploadLogo, isPending: isUpdatingLogo } = useMutation({
    mutationFn: (file: File) => {
      return uploadFile({ file, type: "logo" });
    },
    onSuccess: (data) => {
      const { logoUrl } = data;
      if (!logoUrl || !activeWorkspace?.id) return;

      setLogoUrl(logoUrl);
      toast.success("Upload complete");
      updateLogo({
        organizationId: activeWorkspace.id,
        logoUrl,
      });
    },
    onError: (error: unknown) => {
      console.error("Upload error:", error);
      if (error instanceof Error) {
        toast.error(error.message);
        return;
      }
      toast.error("An unknown error occurred while uploading the logo.");
    },
  });

  return (
    <Card>
      <CardHeader className="px-6">
        <CardTitle className="text-lg font-medium">Workspace Logo.</CardTitle>
        <CardDescription>
          Upload a logo for your workspace. (Accepted file types are .png, .jpg,
          .jpeg, .webp)
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-5">
            <Label
              htmlFor={fileId}
              className={cn(
                "cursor-pointer relative overflow-hidden rounded-full size-16 group",
                (isUpdatingLogo || !isOwner) && "pointer-events-none",
                !isOwner && "opacity-50"
              )}
            >
              <Avatar className="size-16">
                <AvatarImage src={logoUrl || undefined} />
                <AvatarFallback>
                  <ImageIcon className="size-4" />
                </AvatarFallback>
              </Avatar>
              <input
                title="Upload logo"
                type="file"
                id={fileId}
                accept="image/*"
                disabled={!isOwner}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && !isUpdatingLogo && isOwner) {
                    uploadLogo(file);
                  }
                }}
                className="sr-only"
              />
              <div
                className={cn(
                  "absolute inset-0 flex items-center justify-center transition-opacity duration-300 bg-background/50 backdrop-blur-xs size-full",
                  isUpdatingLogo
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                )}
              >
                {isUpdatingLogo ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UploadSimpleIcon className="size-4" />
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
      <CardFooter className="border-t">
        <p className="text-sm text-muted-foreground">
          Square images work best for logos
        </p>
      </CardFooter>
    </Card>
  );
}
