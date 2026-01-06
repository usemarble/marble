"use client";

import { Image01Icon } from "@hugeicons/core-free-icons";
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
import {
  ImageCrop,
  ImageCropApply,
  ImageCropContent,
  ImageCropReset,
} from "@marble/ui/components/kibo-ui/image-crop";
import { useCallback } from "react";
import { MAX_AVATAR_FILE_SIZE } from "@/lib/constants";

interface Props {
  open: boolean;
  reset: () => void;
  onOpenChange: (open: boolean) => void;
  onCropped: (file: File) => void;
  aspect?: number;
  title?: string;
  maxImageSize?: number;
  file: File | null;
}

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
      <DialogContent className="sm:max-w-xl" variant="card">
        <DialogHeader className="flex-row items-center justify-between px-4 py-2">
          <div className="flex flex-1 items-center gap-2">
            <HugeiconsIcon
              className="text-muted-foreground"
              icon={Image01Icon}
              size={18}
              strokeWidth={2}
            />
            <DialogTitle className="font-medium text-muted-foreground text-sm">
              {title}
            </DialogTitle>
          </div>
          <DialogX />
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col items-center gap-4">
            {file ? (
              <div className="space-y-3">
                <ImageCrop
                  aspect={aspect}
                  file={file}
                  maxImageSize={maxImageSize}
                  onCrop={handleCropped}
                >
                  <div className="flex flex-col items-center gap-4">
                    <ImageCropContent className="max-w-full rounded-md shadow-sm" />
                    <div className="flex items-center gap-2">
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
                </ImageCrop>
              </div>
            ) : null}
          </div>
        </DialogBody>
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

  for (let i = 0; i < len; i += 1) {
    buf[i] = bin.charCodeAt(i);
  }

  return new File([buf], filename, { type: mime });
}
