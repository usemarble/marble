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
import { useEffect, useState } from "react";
import { MediaDropzone } from "@/components/shared/dropzone";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { MAX_MEDIA_FILE_SIZE } from "@/lib/constants";
import { uploadFile } from "@/lib/media/upload";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { Media } from "@/types/media";
import { AsyncButton } from "../ui/async-button";

function MediaPreview({ file }: { file: File }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  if (!url) {
    return null;
  }
  if (file.type.startsWith("audio/")) {
    return (
      // biome-ignore lint/a11y/useMediaCaption: Audio preview uses the uploaded file; no transcript asset is available.
      <audio
        aria-label={`Preview ${file.name}`}
        className="w-full"
        controls
        preload="metadata"
        src={url}
      />
    );
  }
  if (file.type.startsWith("image/")) {
    return (
      <Image
        alt="Upload preview"
        className="h-full w-full rounded-md object-contain"
        height={600}
        src={url}
        unoptimized
        width={800}
      />
    );
  }
  return (
    <video
      className="h-full w-full rounded-md object-contain"
      controls
      src={url}
    >
      <track kind="captions" />
    </video>
  );
}

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
        workspaceId: workspaceId ?? "",
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
                  <MediaPreview file={file} />
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
                maxSize={MAX_MEDIA_FILE_SIZE}
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
