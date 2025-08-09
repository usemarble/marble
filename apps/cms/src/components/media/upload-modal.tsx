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
import { ButtonLoader } from "../ui/loader";

interface Media {
  id: string;
  url: string;
  name: string;
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

  const { mutate: uploadMedia, isPending: isUploading } = useMutation({
    mutationFn: async (formFile: File) => {
      const formData = new FormData();
      formData.append("file", formFile);

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
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Media</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          {file ? (
            <div className="flex flex-col gap-4">
              <div className="relative h-64 w-full">
                {/* biome-ignore lint/performance/noImgElement: <> */}
                <img
                  alt="cover preview"
                  className="h-full w-full rounded-md object-cover"
                  src={URL.createObjectURL(file)}
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  disabled={isUploading}
                  onClick={() => setFile(undefined)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button disabled={isUploading} onClick={handleUpload}>
                  {isUploading ? <ButtonLoader /> : "Upload"}
                </Button>
              </div>
            </div>
          ) : (
            <Label
              className="flex h-64 w-full cursor-pointer items-center justify-center rounded-md border border-dashed bg-background"
              htmlFor="media-file-input"
            >
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="size-8" />
                <div className="flex flex-col items-center">
                  <p className="font-medium text-sm">Click to browse</p>
                  <p className="font-medium text-xs">or drag and drop</p>
                </div>
              </div>
              <Input
                accept="image/*"
                className="sr-only"
                id="media-file-input"
                onChange={(e) => setFile(e.target.files?.[0])}
                type="file"
              />
            </Label>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
