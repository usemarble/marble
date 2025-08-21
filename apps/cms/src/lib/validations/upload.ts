import { z } from "zod";
import {
  ALLOWED_MIME_TYPES,
  ALLOWED_RASTER_MIME_TYPES,
  type AllowedMimeType,
  type AllowedRasterMimeType,
} from "@/lib/constants";
import type { UploadType } from "@/types/media";

export const uploadAvatarSchema = z.object({
  type: z.literal("avatar"),
  fileType: z.string(),
  fileSize: z.number(),
});

export const uploadLogoSchema = z.object({
  type: z.literal("logo"),
  fileType: z.string(),
  fileSize: z.number(),
});

export const uploadMediaSchema = z.object({
  type: z.literal("media"),
  fileType: z.string(),
  fileSize: z.number(),
});

export const uploadSchema = z.union([
  uploadAvatarSchema,
  uploadLogoSchema,
  uploadMediaSchema,
]);

export const completeAvatarSchema = z.object({
  type: z.literal("avatar"),
  key: z.string(),
  fileType: z.string(),
  fileSize: z.number(),
});

export const completeLogoSchema = z.object({
  type: z.literal("logo"),
  key: z.string(),
  fileType: z.string(),
  fileSize: z.number(),
});

export const completeMediaSchema = z.object({
  type: z.literal("media"),
  key: z.string(),
  fileType: z.string(),
  fileSize: z.number(),
  name: z.string(),
});

export const completeSchema = z.union([
  completeAvatarSchema,
  completeLogoSchema,
  completeMediaSchema,
]);

export function validateUpload({
  type,
  fileType,
}: {
  type: UploadType;
  fileType: string;
}) {
  switch (type) {
    case "avatar":
    case "logo":
      if (
        !ALLOWED_RASTER_MIME_TYPES.includes(fileType as AllowedRasterMimeType)
      ) {
        throw new Error(
          `File type ${fileType} is not allowed for ${type}. Allowed raster types: ${ALLOWED_RASTER_MIME_TYPES.join(", ")}`,
        );
      }
      break;
    case "media":
      if (!ALLOWED_MIME_TYPES.includes(fileType as AllowedMimeType)) {
        throw new Error(
          `File type ${fileType} is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`,
        );
      }
      break;
    default:
      throw new Error("Invalid upload type.");
  }
}
