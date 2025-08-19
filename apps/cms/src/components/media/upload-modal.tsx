"use client";

import { Button } from "@marble/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@marble/ui/components/dialog";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/components/sonner";
import { Upload } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { Media } from "@/types/misc";
import { ButtonLoader } from "../ui/loader";

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

  const { mutate: uploadMedia, isPending: isUploading } = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/uploads/media", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload media");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MEDIA] });
      toast.success("Uploaded successfully!");
      if (onUploadComplete && data.media) {
        onUploadComplete(data.media);
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Media</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          {file ? (
            <div className="flex flex-col gap-4">
              <div className="relative w-full h-64">
                {file.type.startsWith("image/") ? (
                  // biome-ignore lint/performance/noImgElement: <>
                  <img
                    src={URL.createObjectURL(file)}
                    alt="cover preview"
                    className="w-full h-full object-cover rounded-md"
                  />
                ) : (
                  // biome-ignore lint/a11y/useMediaCaption: <>
                  <video
                    src={URL.createObjectURL(file)}
                    className="w-full h-full object-cover rounded-md"
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
                <Button onClick={handleUpload} disabled={isUploading}>
                  {isUploading ? <ButtonLoader /> : "Upload"}
                </Button>
              </div>
            </div>
          ) : (
            <Label
              htmlFor="media-file-input"
              className="w-full h-64 rounded-md border border-dashed bg-background flex items-center justify-center cursor-pointer"
            >
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="size-8" />
                <div className="flex flex-col items-center">
                  <p className="text-sm font-medium">Click to browse</p>
                </div>
              </div>
              {/** biome-ignore lint/correctness/useUniqueElementIds: <> */}
              <Input
                onChange={(e) => setFile(e.target.files?.[0])}
                id="media-file-input"
                type="file"
                accept="image/*,video/*"
                className="sr-only"
              />
            </Label>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
