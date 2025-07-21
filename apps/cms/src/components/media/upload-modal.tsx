"use client";

import { Button } from "@marble/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@marble/ui/components/dialog";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/components/sonner";
import { CloudUpload, ImageIcon, Trash2 } from "lucide-react";
import { useState } from "react";
import { uploadMediaAction } from "@/lib/actions/media";

interface Media {
  id: string;
  name: string;
  url: string;
}

interface MediaUploadModalProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onUploadComplete?: (url: string, media?: Media) => void;
}

export function MediaUploadModal({
  isOpen,
  setIsOpen,
  onUploadComplete,
}: MediaUploadModalProps) {
  const [file, setFile] = useState<File | undefined>();
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    try {
      setIsUploading(true);
      toast.loading("Compressing...", {
        id: "uploading",
      });

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

      toast.loading("Uploading...", {
        id: "uploading",
      });

      const result = await uploadMediaAction(compressedFile);

      setIsUploading(false);
      toast.success("Uploaded successfully!", {
        id: "uploading",
      });

      if (onUploadComplete) {
        const mediaData = result.media
          ? {
              id: result.media.id,
              name: result.media.name,
              url: result.media.url,
            }
          : undefined;
        onUploadComplete(result.url, mediaData);
      }

      setIsOpen(false);
      setFile(undefined);
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg max-h-96">
        <DialogHeader className="text-center flex items-center justify-center">
          <DialogTitle>Upload Media</DialogTitle>
          <DialogDescription className="sr-only">
            Upload an image from your computer.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-52">
          {file ? (
            <div className="flex flex-col gap-4">
              <div className="relative w-full h-full">
                {/* biome-ignore lint/performance/noImgElement: <> */}
                <img
                  src={URL.createObjectURL(file)}
                  alt="cover"
                  className="w-full h-full max-h-52 object-cover rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <Button
                  variant="destructive"
                  onClick={() => setFile(undefined)}
                  disabled={isUploading}
                  className=""
                >
                  <Trash2 className="size-4" />
                  <span>Remove</span>
                </Button>
                <Button disabled={isUploading} onClick={handleUpload}>
                  <CloudUpload className="size-4" />
                  <span>Upload</span>
                </Button>
              </div>
            </div>
          ) : (
            <Label
              htmlFor="image"
              className="w-full h-full min-h-52 rounded-md border border-dashed flex items-center justify-center cursor-pointer hover:border-primary"
            >
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImageIcon className="size-4" />
                <div className="flex flex-col items-center">
                  <p className="text-sm font-medium">Upload Image</p>
                </div>
              </div>
              <Input
                onChange={(e) => setFile(e.target.files?.[0])}
                id="image"
                type="file"
                accept="image/*"
                className="sr-only"
              />
            </Label>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
