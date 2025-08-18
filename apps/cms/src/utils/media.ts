import { MediaType } from "@marble/db/client";

export function getMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith("image/")) {
    return MediaType.image;
  }
  if (mimeType.startsWith("video/")) {
    return MediaType.video;
  }
  if (mimeType.startsWith("audio/")) {
    return MediaType.audio;
  }
  return MediaType.document;
}
