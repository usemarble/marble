"use client";

import { createImageUpload } from "novel";
import { toast } from "sonner";
import {
  ALLOWED_RASTER_MIME_TYPES,
  MAX_MEDIA_FILE_SIZE,
} from "@/lib/constants";
import { uploadFile } from "@/lib/media/upload";

const onUpload = (file: File) => {
  console.log("uploading image", file);
  return new Promise((resolve, reject) => {
    toast.promise(
      uploadFile({
        file,
        type: "media",
      }).then((response) => {
        // Preload the image for better UX
        const image = new Image();
        image.src = response.url;
        image.onload = () => {
          resolve(response.url);
        };
        image.onerror = () => {
          // Even if preload fails, resolve with the URL
          resolve(response.url);
        };
      }),
      {
        loading: "Uploading image...",
        success: "Image uploaded successfully.",
        error: (e) => {
          reject(e);
          return e instanceof Error
            ? e.message
            : "Error uploading image. Please try again.";
        },
      }
    );
  });
};

export const uploadFn = createImageUpload({
  onUpload,
  validateFn: (file) => {
    // Only allow raster images for editor content (no SVG or video)
    if (
      !ALLOWED_RASTER_MIME_TYPES.includes(
        file.type as (typeof ALLOWED_RASTER_MIME_TYPES)[number]
      )
    ) {
      toast.error(
        `File type not supported. Allowed types: ${ALLOWED_RASTER_MIME_TYPES.join(", ")}`
      );
      return false;
    }

    const maxSizeMB = MAX_MEDIA_FILE_SIZE / 1024 / 1024;
    if (file.size > MAX_MEDIA_FILE_SIZE) {
      toast.error(`File size too big (max ${maxSizeMB}MB).`);
      return false;
    }

    return true;
  },
});
