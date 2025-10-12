"use client";

import { Button } from "@marble/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@marble/ui/components/dialog";
import {
  ImageCrop,
  ImageCropApply,
  ImageCropContent,
  ImageCropReset,
} from "@marble/ui/components/kibo-ui/image-crop";
import { XIcon } from "@phosphor-icons/react";
import { useCallback } from "react";
import { MAX_AVATAR_FILE_SIZE } from "@/lib/constants";

type Props = {
  open: boolean;
  reset: () => void;
  onOpenChange: (open: boolean) => void;
  onCropped: (file: File) => void;
  aspect?: number;
  title?: string;
  maxImageSize?: number;
  file: File | null;
};

export function CropImageModal({
  open,
  reset,
  onOpenChange,
  onCropped,
  aspect = 1,
  title = "Crop Avatar",
  maxImageSize = MAX_AVATAR_FILE_SIZE,
  file,
}: Props) {
  const handleClose = useCallback(
    (next: boolean) => {
      if (!next) {
        reset();
      }
      onOpenChange(next);
    },
    [onOpenChange, reset]
  );

  const handleCropped = useCallback(
    (dataUrl: string) => {
      const output = dataUrlToFile(dataUrl, file?.name || "avatar.png");
      onCropped(output);
      handleClose(false);
    },
    [file?.name, onCropped, handleClose]
  );

  return (
    <Dialog onOpenChange={handleClose} open={open}>
      <DialogContent className="sm:max-w-[520px]">
        <Button
          className="absolute top-4 right-4 z-50"
          onClick={() => handleClose(false)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <XIcon className="h-4 w-4" />
        </Button>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          {file ? (
            <div className="space-y-3">
              <ImageCrop
                aspect={aspect}
                file={file}
                maxImageSize={maxImageSize}
                onCrop={handleCropped}
              >
                <div className="group relative inline-block max-w-full">
                  <ImageCropContent className="max-w-full" />
                  <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <div className="pointer-events-auto mb-3 flex items-center gap-2">
                      <ImageCropReset asChild>
                        <Button size="sm" type="button" variant="secondary">
                          Reset
                        </Button>
                      </ImageCropReset>
                      <ImageCropApply asChild>
                        <Button size="sm" type="button" variant="default">
                          Apply
                        </Button>
                      </ImageCropApply>
                    </div>
                  </div>
                </div>
              </ImageCrop>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const DATA_URL_REGEX = /^data:(.+?);base64,(.*)$/;

function dataUrlToFile(dataUrl: string, filename: string): File {
  const match = dataUrl.match(DATA_URL_REGEX);
  const mime = match?.[1] ?? "image/png";

  const base64 = match?.[2] ?? "";
  if (!base64) {
    return new File([], filename, { type: mime });
  }
  const bin = atob(base64);
  const len = bin.length;
  const buf = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    buf[i] = bin.charCodeAt(i);
  }

  return new File([buf], filename, { type: mime });
}
