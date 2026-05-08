import { imageSize } from "image-size";
import { DEFAULT_CDN_URL } from "./constants";

export type MediaType = "image" | "video" | "audio" | "document";

export interface MediaRecord {
  id: string;
  name: string;
  url: string;
  alt: string | null;
  size: number;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  blurHash: string | null;
  type: MediaType;
  createdAt: Date;
  updatedAt: Date;
}

export function serializeMedia(item: MediaRecord) {
  return {
    id: item.id,
    name: item.name,
    url: item.url,
    alt: item.alt,
    size: item.size,
    mimeType: item.mimeType,
    width: item.width,
    height: item.height,
    duration: item.duration,
    blurHash: item.blurHash,
    type: item.type,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

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

export function extensionFromFile(file: File) {
  const filename = file.name.trim();
  const filenameExtension = filename.includes(".")
    ? filename.split(".").pop()
    : undefined;
  if (filenameExtension) {
    return filenameExtension.toLowerCase().replace(/[^a-z0-9]/g, "");
  }
  return file.type.split("/")[1]?.split("+")[0] || "bin";
}

export function publicUrl(envUrl: string | undefined, key: string) {
  const base = (envUrl || DEFAULT_CDN_URL).replace(/\/$/, "");
  return `${base}/${key}`;
}

export function objectKeyFromUrl(url: string) {
  try {
    return new URL(url).pathname.replace(/^\/+/, "");
  } catch {
    return null;
  }
}

export function getImageDimensions(buffer: ArrayBuffer) {
  try {
    const dimensions = imageSize(new Uint8Array(buffer));
    return {
      width: dimensions.width,
      height: dimensions.height,
    };
  } catch (error) {
    console.warn("Failed to read image dimensions:", error);
    return {};
  }
}
