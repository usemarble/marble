import type { MEDIA_SORT_BY, SORT_DIRECTIONS } from "@/lib/constants";
import type {
  Media,
  MediaFilterType,
  MediaSort,
  MediaType,
} from "@/types/media";

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
  return ["all", "image", "video", "audio", "document"].includes(
    value as string
  );
}

export function toMediaType(value: MediaFilterType): MediaType | undefined {
  return value === "all" ? undefined : value;
}

export async function downloadMedia(media: Media) {
  const response = await fetch(media.url);
  if (!response.ok) {
    throw new Error("Failed to download media");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  try {
    link.href = objectUrl;
    link.download = media.name;
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    URL.revokeObjectURL(objectUrl);
  }
}

export function formatMediaType(media: Media) {
  return `${media.type.charAt(0).toUpperCase()}${media.type.slice(1)}`;
}

export function formatMediaDimensions(media: Media) {
  if (media.width && media.height) {
    return `${media.width} x ${media.height}`;
  }
  return "-";
}

export function formatMediaDuration(duration: number | null | undefined) {
  if (duration == null) {
    return "-";
  }

  const totalSeconds = Math.round(duration / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const paddedMinutes = String(minutes).padStart(hours > 0 ? 2 : 1, "0");
  const paddedSeconds = String(seconds).padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }

  return `${paddedMinutes}:${paddedSeconds}`;
}
