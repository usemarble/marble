"use client";

import { FileImportIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@marble/ui/components/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogX,
} from "@marble/ui/components/dialog";
import { toast } from "@marble/ui/components/sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useState } from "react";
import { MediaDropzone } from "@/components/shared/dropzone";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { uploadFile } from "@/lib/media/upload";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { Media } from "@/types/media";
import { AsyncButton } from "../ui/async-button";

interface MediaUploadModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onUploadComplete?: (media: Media) => void;
}

export function MediaUploadModal({
  isOpen,
  setIsOpen,
  onUploadComplete,
}: MediaUploadModalProps) {
  const [file, setFile] = useState<File | undefined>();
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const { mutate: uploadMedia, isPending: isUploading } = useMutation({
    mutationFn: async (file: File) => {
      const media = await uploadFile({
        file,
        type: "media",
      });
      return media;
    },
    onSuccess: (data: Media) => {
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.BILLING_USAGE(workspaceId),
        });
      }
      toast.success("Media uploaded successfully!");
      if (onUploadComplete && data) {
        onUploadComplete(data);
      }
      setFile(undefined);
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleUpload = () => {
    if (file) {
      uploadMedia(file);
    }
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setFile(undefined);
        }
      }}
      open={isOpen}
    >
      <DialogContent
        className="max-h-[90vh] max-w-4xl overflow-y-auto"
        variant="card"
      >
        <DialogHeader className="flex-row items-center justify-between px-4 py-2">
          <div className="flex flex-1 items-center gap-2">
            <HugeiconsIcon
              className="text-muted-foreground"
              icon={FileImportIcon}
              size={18}
              strokeWidth={2}
            />
            <DialogTitle className="font-medium text-muted-foreground text-sm">
              Upload Media
            </DialogTitle>
          </div>
          <DialogX />
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-4">
            {file ? (
              <div className="flex flex-col gap-4">
                <div className="relative flex h-[400px] w-full items-center justify-center overflow-hidden rounded-md">
                  {file.type.startsWith("image/") ? (
                    <Image
                      alt="cover preview"
                      className="h-full w-full rounded-md object-contain"
                      src={URL.createObjectURL(file)}
                      unoptimized
                    />
                  ) : (
                    // biome-ignore lint/a11y/useMediaCaption: <>
                    <video
                      className="h-full w-full rounded-md object-contain"
                      controls
                      src={URL.createObjectURL(file)}
                    />
                  )}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    disabled={isUploading}
                    onClick={() => setFile(undefined)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <AsyncButton isLoading={isUploading} onClick={handleUpload}>
                    Upload
                  </AsyncButton>
                </div>
              </div>
            ) : (
              <MediaDropzone
                className="flex h-64 w-full cursor-pointer items-center justify-center rounded-md border border-dashed bg-background"
                multiple={false}
                onFilesAccepted={(files: File[]) => setFile(files[0])}
              />
            )}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
