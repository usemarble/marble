"use client";

import { cn } from "@marble/ui/lib/utils";
import { Image as ImageIcon } from "@phosphor-icons/react";
import { type DropzoneOptions, useDropzone } from "react-dropzone";
import { IMAGE_DROPZONE_ACCEPT } from "@/lib/constants";

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
  accept = {
    "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp", ".avif"],
  },
  maxSize,
  children,
  disabled = false,
  placeholder = {
    idle: "Drag & drop files here, or click to select",
    active: "Drop the files here...",
    subtitle: "Supports JPEG, PNG, GIF, WebP, AVIF",
  },
}: DropzoneProps) {
  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
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
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          "w-full rounded-md border border-dashed bg-background flex items-center justify-center cursor-pointer transition-colors",
          isDragActive && "border-primary bg-primary/5",
          hasErrors && "border-destructive bg-destructive/5",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        <input {...getInputProps()} />
        {children || (
          <div className="flex flex-col items-center gap-2 text-muted-foreground p-6">
            <ImageIcon className="size-6" />
            <div className="flex flex-col items-center text-center">
              <p className="text-sm font-medium">
                {isDragActive ? placeholder.active : placeholder.idle}
              </p>
              {placeholder.subtitle && (
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {placeholder.subtitle}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error messages */}
      {hasErrors && (
        <div className="mt-2 space-y-1">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="text-sm text-destructive">
              <span className="font-medium">{file.name}:</span>
              {errors.map((error) => (
                <span key={error.code} className="ml-1">
                  {error.message}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ImageDropzoneProps
  extends Omit<DropzoneProps, "accept" | "placeholder"> {
  placeholder?: {
    idle?: string;
    active?: string;
    subtitle?: string;
  };
}

export function ImageDropzone({
  placeholder = {},
  ...props
}: ImageDropzoneProps) {
  return (
    <Dropzone
      accept={{
        "image/*": IMAGE_DROPZONE_ACCEPT,
      }}
      placeholder={{
        idle:
          placeholder.idle || "Drag & drop an image here, or click to select",
        active: placeholder.active || "Drop the image here...",
        subtitle:
          placeholder.subtitle || "Supports JPEG, PNG, GIF, WebP, AVIF, SVG",
      }}
      {...props}
    />
  );
}
