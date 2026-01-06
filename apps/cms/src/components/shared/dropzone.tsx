"use client";

import { Image02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@marble/ui/lib/utils";
import { type DropzoneOptions, useDropzone } from "react-dropzone";
import { IMAGE_DROPZONE_ACCEPT, MEDIA_DROPZONE_ACCEPT } from "@/lib/constants";

interface DropzoneProps {
  onFilesAccepted: (files: File[]) => void;
  className?: string;
  multiple?: boolean;
  accept?: DropzoneOptions["accept"];
  maxSize?: number;
  children?: React.ReactNode;
  disabled?: boolean;
  placeholder?: {
    idle: string;
    active: string;
    subtitle?: string;
  };
}

export function Dropzone({
  onFilesAccepted,
  className,
  multiple = false,
  accept,
  maxSize,
  children,
  disabled = false,
  placeholder = {
    idle: "Drag & drop files here, or click to select",
    active: "Drop the files here...",
    subtitle: "Supports JPEG, PNG, GIF, WebP, AVIF",
  },
}: DropzoneProps) {
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    fileRejections,
  } = useDropzone({
    accept,
    multiple,
    maxSize,
    disabled,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFilesAccepted(acceptedFiles);
      }
    },
  });

  const hasErrors = fileRejections.length > 0;

  return (
    <div className="h-full w-full">
      <div
        {...getRootProps()}
        className={cn(
          "flex w-full cursor-pointer items-center justify-center rounded-md border border-dashed bg-background transition-colors",
          isDragActive && !isDragReject && "border-primary bg-primary/5",
          isDragReject && "border-destructive bg-destructive/10",
          hasErrors && "border-destructive bg-destructive/5",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <input {...getInputProps()} />
        {children || (
          <div className="flex flex-col items-center gap-2 p-6 text-muted-foreground">
            {/* Fetch media */}
            <HugeiconsIcon icon={Image02Icon} />
            <div className="flex flex-col items-center text-center">
              <p className="font-medium text-sm">
                {isDragReject
                  ? "Unsupported file type"
                  : isDragActive
                    ? placeholder.active
                    : placeholder.idle}
              </p>
              {placeholder.subtitle && (
                <p className="mt-1 text-muted-foreground/70 text-xs">
                  {placeholder.subtitle}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error messages */}
      {hasErrors && (
        <div className="mt-2 space-y-1 text-destructive text-sm">
          {fileRejections.map(({ file, errors }) => {
            const fileType = file.name.split(".").pop();
            const message =
              errors[0]?.code === "file-invalid-type"
                ? `File type ".${fileType}" is not supported.`
                : errors[0]?.message;

            return (
              <p key={file.name}>
                <span className="font-medium">{file.name}:</span> {message}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface MediaDropzoneProps
  extends Omit<DropzoneProps, "accept" | "placeholder"> {
  placeholder?: {
    idle?: string;
    active?: string;
    subtitle?: string;
  };
}

export function MediaDropzone({
  placeholder = {},
  ...props
}: MediaDropzoneProps) {
  return (
    <Dropzone
      accept={MEDIA_DROPZONE_ACCEPT}
      placeholder={{
        idle:
          placeholder.idle || "Drag & drop a media here, or click to select",
        active: placeholder.active || "Drop the media here...",
        subtitle:
          placeholder.subtitle || "Supports all common image and video formats",
      }}
      {...props}
    />
  );
}

export function ImageDropzone({
  placeholder = {},
  ...props
}: MediaDropzoneProps) {
  return (
    <Dropzone
      accept={{ "image/*": IMAGE_DROPZONE_ACCEPT }}
      placeholder={{
        idle:
          placeholder.idle || "Drag & drop an image here, or click to select",
        active: placeholder.active || "Drop the image here...",
        subtitle: placeholder.subtitle || "Supports JPEG, PNG, GIF, WebP, AVIF",
      }}
      {...props}
    />
  );
}
