import { z } from "zod";
import {
  ALLOWED_MIME_TYPES,
  ALLOWED_RASTER_MIME_TYPES,
  type AllowedMimeType,
  type AllowedRasterMimeType,
  MAX_AVATAR_FILE_SIZE,
  MAX_LOGO_FILE_SIZE,
  MAX_MEDIA_FILE_SIZE,
} from "@/lib/constants";
import type { UploadType } from "@/types/media";

export const uploadAvatarSchema = z.object({
  type: z.literal("avatar"),
  fileType: z.coerce.string().nonempty(),
  fileSize: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_AVATAR_FILE_SIZE, {
      message: `Avatar image must be less than ${MAX_AVATAR_FILE_SIZE / 1024 / 1024}MB`,
    }),
});

export const uploadAuthorAvatarSchema = z.object({
  type: z.literal("author-avatar"),
  fileType: z.coerce.string().nonempty(),
  fileSize: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_AVATAR_FILE_SIZE, {
      message: `Author avatar must be less than ${MAX_AVATAR_FILE_SIZE / 1024 / 1024}MB`,
    }),
});

export const uploadLogoSchema = z.object({
  type: z.literal("logo"),
  fileType: z.coerce.string().nonempty(),
  fileSize: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_LOGO_FILE_SIZE, {
      message: `Logo image must be less than ${MAX_LOGO_FILE_SIZE / 1024 / 1024}MB`,
    }),
});

export const uploadMediaSchema = z.object({
  type: z.literal("media"),
  fileType: z.coerce.string().nonempty(),
  fileSize: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_MEDIA_FILE_SIZE, {
      message: `Media file must be less than ${MAX_MEDIA_FILE_SIZE / 1024 / 1024}MB`,
    }),
});

export const uploadSchema = z.union([
  uploadAvatarSchema,
  uploadAuthorAvatarSchema,
  uploadLogoSchema,
  uploadMediaSchema,
]);

const maxSizeByType = {
  avatar: MAX_AVATAR_FILE_SIZE,
  "author-avatar": MAX_AVATAR_FILE_SIZE,
  logo: MAX_LOGO_FILE_SIZE,
  media: MAX_MEDIA_FILE_SIZE,
};

export const completeAvatarSchema = z.object({
  type: z.literal("avatar"),
  key: z
    .string()
    .min(3)
    .max(1024)
    .refine(
      (k) =>
        k.startsWith("avatars/") && !k.includes("..") && !k.startsWith("/"),
      "Invalid key: must start with avatars/ and not contain path traversal"
    ),
  fileType: z.string().min(1),
  fileSize: z.coerce.number().int().positive().max(MAX_AVATAR_FILE_SIZE),
});

export const completeAuthorAvatarSchema = z.object({
  type: z.literal("author-avatar"),
  key: z
    .string()
    .min(3)
    .max(1024)
    .refine(
      (k) =>
        k.startsWith("avatars/") && !k.includes("..") && !k.startsWith("/"),
      "Invalid key: must start with avatars/ and not contain path traversal"
    ),
  fileType: z.string().min(1),
  fileSize: z.coerce.number().int().positive().max(MAX_AVATAR_FILE_SIZE),
});

export const completeLogoSchema = z.object({
  type: z.literal("logo"),
  key: z
    .string()
    .min(3)
    .max(1024)
    .refine(
      (k) => k.startsWith("logos/") && !k.includes("..") && !k.startsWith("/"),
      "Invalid key: must start with logos/ and not contain path traversal"
    ),
  fileType: z.string().min(1),
  fileSize: z.coerce.number().int().positive().max(MAX_LOGO_FILE_SIZE),
});

export const completeMediaSchema = z.object({
  type: z.literal("media"),
  key: z
    .string()
    .min(3)
    .max(1024)
    .refine(
      (k) => k.startsWith("media/") && !k.includes("..") && !k.startsWith("/"),
      "Invalid key: must start with media/ and not contain path traversal"
    ),
  fileType: z.string().min(1),
  fileSize: z.coerce.number().int().positive().max(MAX_MEDIA_FILE_SIZE),
  name: z.string().min(1).max(255),
});

export const completeSchema = z.union([
  completeAvatarSchema,
  completeAuthorAvatarSchema,
  completeLogoSchema,
  completeMediaSchema,
]);

export const DeleteSchema = z
  .object({
    mediaId: z.string().optional(),
    mediaIds: z.array(z.string()).min(1).max(100).optional(),
  })
  .refine((d) => d.mediaId || d.mediaIds?.length, {
    message: "mediaId or mediaIds is required",
  });

export function validateUpload({
  type,
  fileType,
  fileSize,
}: {
  type: UploadType;
  fileType: string;
  fileSize: number;
}) {
  const maxSize = maxSizeByType[type];
  if (fileSize > maxSize) {
    throw new Error(
      `File size exceeds the maximum limit of ${maxSize / 1024 / 1024}MB for ${type}.`
    );
  }

  switch (type) {
    case "avatar":
    case "author-avatar":
    case "logo":
      if (
        !ALLOWED_RASTER_MIME_TYPES.includes(fileType as AllowedRasterMimeType)
      ) {
        throw new Error(
          `File type ${fileType} is not allowed for ${type}. Allowed raster types: ${ALLOWED_RASTER_MIME_TYPES.join(", ")}`
        );
      }
      break;
    case "media":
      if (!ALLOWED_MIME_TYPES.includes(fileType as AllowedMimeType)) {
        throw new Error(
          `File type ${fileType} is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`
        );
      }
      break;
    default:
      throw new Error("Invalid upload type.");
  }
}
