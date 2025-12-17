import type { MEDIA_SORT_BY, SORT_DIRECTIONS } from "@/lib/constants";
import type { MediaFilterType, MediaSort, MediaType } from "@/types/media";

export function getMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith("image/")) {
    return "image";
  }
  if (mimeType.startsWith("video/")) {
    return "video";
  }
  if (mimeType.startsWith("audio/")) {
    return "audio";
  }
  return "document";
}

export function getEmptyStateMessage(type?: MediaType, hasAnyMedia?: boolean) {
  if (!hasAnyMedia) {
    return "Media you upload in this workspace will appear here.";
  }
  switch (type) {
    case "image":
      return "No images found. Try uploading some images or adjusting your filters.";
    case "video":
      return "No videos found. Try uploading some videos or adjusting your filters.";
    case "audio":
      return "No audio files found. Try uploading some audio files or adjusting your filters.";
    case "document":
      return "No documents found. Try uploading some documents or adjusting your filters.";
    default:
      return "No media found. Try adjusting your filters or upload some media.";
  }
}

export function isMediaSort(value: string): value is MediaSort {
  // defer to constants list at call sites where needed; this keeps util generic
  return ["createdAt_desc", "createdAt_asc", "name_asc", "name_desc"].includes(
    value
  );
}

export function splitMediaSort(sort: MediaSort) {
  const [field, direction] = sort.split("_") as [
    (typeof MEDIA_SORT_BY)[number],
    (typeof SORT_DIRECTIONS)[number],
  ];
  return { field, direction };
}

export function isMediaFilterType(
  value: MediaFilterType
): value is MediaFilterType {
  return ["all", "image", "video"].includes(value as string);
}

export function toMediaType(value: MediaFilterType): MediaType | undefined {
  return value === "all" ? undefined : value;
}
