import { Button } from "@marble/ui/components/button";
import { cn } from "@marble/ui/lib/utils";
import {
  ImageIcon,
  SpinnerIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react";
import type { ChangeEvent } from "react";
import { useCallback } from "react";
import { useDropZone, useFileUpload, useUploader } from "./hooks";

export const ImageUploader = ({
  onUpload,
}: {
  onUpload: (url: string) => void;
}) => {
  const { loading, uploadImage } = useUploader({ onUpload });
  const { handleUploadClick, ref } = useFileUpload();
  const { draggedInside, onDrop, onDragEnter, onDragLeave, onDragOver } =
    useDropZone({
      uploader: uploadImage,
    });

  const onFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        uploadImage(file);
      }
    },
    [uploadImage]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-md border border-muted bg-muted/50 p-12">
        <div className="flex flex-col items-center gap-2">
          <SpinnerIcon className="size-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground text-sm">Uploading image...</p>
        </div>
      </div>
    );
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: Drag-and-drop zone requires div element for proper event handling
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-md border border-dashed p-12 transition-colors",
        draggedInside
          ? "border-primary bg-primary/5"
          : "border-muted bg-muted/50"
      )}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      role="button"
      tabIndex={0}
    >
      <ImageIcon
        className={cn(
          "size-12 transition-colors",
          draggedInside ? "text-primary" : "text-muted-foreground"
        )}
      />
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="text-center font-medium text-sm">
          {draggedInside ? "Drop image here" : "Drag and drop or"}
        </div>
        <Button
          onClick={handleUploadClick}
          size="sm"
          type="button"
          variant="outline"
        >
          <UploadSimpleIcon className="size-4" />
          Upload an image
        </Button>
      </div>
      <input
        accept="image/*"
        className="size-0 overflow-hidden opacity-0"
        onChange={onFileChange}
        ref={ref}
        type="file"
      />
    </div>
  );
};
