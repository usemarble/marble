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
  CardHeader,
  CardTitle,
} from "@marble/ui/components/card";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/components/sonner";
import { cn } from "@marble/ui/lib/utils";
import { Image, UploadSimple } from "@phosphor-icons/react";
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

  const updateLogo = async (url: string) => {
    await organization.update({
      // biome-ignore lint/style/noNonNullAssertion: <>
      organizationId: activeWorkspace?.id!,
      data: {
        logo: url,
      },
    });
    queryClient.invalidateQueries({
      // biome-ignore lint/style/noNonNullAssertion: <>
      queryKey: QUERY_KEYS.WORKSPACE(activeWorkspace?.id!),
    });
    toast.success("Logo updated");
  };

  const { mutate: uploadLogo, isPending: isUpdatingLogo } = useMutation({
    mutationFn: (file: File) => {
      return uploadFile({ file, type: "logo" });
    },
    onSuccess: (data) => {
      setLogoUrl(data.logoUrl);
      toast.success("Upload complete");
      updateLogo(data.logoUrl);
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast.error(error.message);
    },
  });

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Workspace Logo.</CardTitle>
        <CardDescription>
          Upload a logo for your workspace. (Square image recommended. Accepted
          file types: .png, .jpg)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-5">
            <Label
              htmlFor={fileId}
              className={cn(
                "cursor-pointer relative overflow-hidden rounded-full size-16 group",
                (isUpdatingLogo || !isOwner) && "pointer-events-none",
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
                    : "opacity-0 group-hover:opacity-100",
                )}
              >
                {isUpdatingLogo ? (
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
  );
}
