"use client";

import { Button } from "@marble/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@marble/ui/components/dialog";
import { toast } from "@marble/ui/components/sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
          queryKey: QUERY_KEYS.MEDIA(workspaceId),
        });
      }
      toast.success("Uploaded successfully!");
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
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setFile(undefined);
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Media</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          {file ? (
            <div className="flex flex-col gap-4">
              <div className="relative w-full h-[400px] flex items-center justify-center rounded-md overflow-hidden">
                {file.type.startsWith("image/") ? (
                  // biome-ignore lint/performance/noImgElement: <>
                  <img
                    src={URL.createObjectURL(file)}
                    alt="cover preview"
                    className="w-full h-full object-contain rounded-md"
                  />
                ) : (
                  // biome-ignore lint/a11y/useMediaCaption: <>
                  <video
                    src={URL.createObjectURL(file)}
                    className="w-full h-full object-contain rounded-md"
                    controls
                  />
                )}
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setFile(undefined)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <AsyncButton onClick={handleUpload} isLoading={isUploading}>
                  Upload
                </AsyncButton>
              </div>
            </div>
          ) : (
            <MediaDropzone
              onFilesAccepted={(files: File[]) => setFile(files[0])}
              className="w-full h-64 rounded-md border border-dashed bg-background flex items-center justify-center cursor-pointer"
              multiple={false}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
