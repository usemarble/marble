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
import { ImageDropzone } from "@/components/shared/dropzone";
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

  const handleFilesAccepted = (files: File[]) => {
    const file = files[0];
    if (file) {
      setFile(file);
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
                {/* biome-ignore lint/performance/noImgElement: <> */}
                <img
                  src={URL.createObjectURL(file)}
                  alt="cover preview"
                  className="w-full h-full object-cover rounded-md"
                />
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
            <ImageDropzone
              onFilesAccepted={handleFilesAccepted}
              className="w-full h-64 rounded-md border border-dashed bg-background flex items-center justify-center cursor-pointer"
              multiple={false}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
