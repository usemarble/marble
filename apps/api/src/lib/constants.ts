/**
 * Available API route resources.
 * Used for route dispatching and redirect logic.
 */
export const ROUTES = [
  "posts",
  "categories",
  "tags",
  "authors",
  "cache",
  "media",
];

export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
export const DEFAULT_CDN_URL = "https://cdn.marblecms.com";

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/svg+xml",
] as const;

export const ALLOWED_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
] as const;

export const ALLOWED_AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/aac",
  "audio/flac",
] as const;

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/json",
  "application/zip",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;

export const ALLOWED_MEDIA_MIME_TYPES = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  ...ALLOWED_VIDEO_MIME_TYPES,
  ...ALLOWED_AUDIO_MIME_TYPES,
  ...ALLOWED_DOCUMENT_MIME_TYPES,
] as const;

export type AllowedMediaMimeType = (typeof ALLOWED_MEDIA_MIME_TYPES)[number];

export const FRAMER_PLUGIN_ID = "4pj5owtk2qcexo6c1yt9kicye";
export const FRAMER_PLUGIN_PATTERN = new RegExp(
  `^https://${FRAMER_PLUGIN_ID}(-[a-zA-Z0-9]+)?\\.plugins\\.framercdn\\.com$`
);
