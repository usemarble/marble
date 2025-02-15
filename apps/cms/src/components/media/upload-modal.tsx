"use client";

import { CloudUpload, ImageIcon, Trash2 } from "lucide-react";

import { useUploadThing } from "@/utils/uploadthing";
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
import { useState } from "react";

interface MediaUploadModalProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function MediaUploadModal({ isOpen, setIsOpen }: MediaUploadModalProps) {
  const [file, setFile] = useState<File | undefined>();
  const [isUploading, setIsUploading] = useState(false);

  const { startUpload } = useUploadThing("posts", {
    onClientUploadComplete: (res) => {
      setIsUploading(false);
      toast.success("uploaded successfully!", {
        id: "uploading",
        position: "top-center",
      });
      setIsOpen(false);
      setFile(undefined);
    },
    onUploadError: () => {
      toast.error("Failed to upload", {
        id: "uploading",
        position: "top-center",
      });
    },
    onUploadBegin: (filename) => {
      setIsUploading(true);
      toast.loading("uploading...", {
        id: "uploading",
        position: "top-center",
      });
    },
  });

  const handleUpload = async () => {
    if (!file) return;

    try {
      setIsUploading(true);

      // Compress image using API route
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

      await startUpload([compressedFile]);
    } catch (error) {
      toast.error("Failed to compress image", {
        id: "uploading",
        position: "top-center",
      });
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center flex items-center justify-center">
          <DialogTitle>Upload Image</DialogTitle>
          <DialogDescription>
            Upload an image from your computer.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-52">
          {file ? (
            <div className="flex flex-col gap-4">
              <div className="relative w-full h-full">
                <img
                  src={URL.createObjectURL(file)}
                  alt="cover"
                  className="w-full h-full min-h-48 object-cover rounded-md"
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
                  <p className="text-xs font-medium">(Max 4mb)</p>
                </div>
              </div>
              <Input
                onChange={(e) => setFile(e.target.files?.[0])}
                id="image"
                type="file"
                accept="image*"
                className="sr-only"
              />
            </Label>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
