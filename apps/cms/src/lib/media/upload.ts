import axios from "axios";
import { encode } from "blurhash";
import type { PresignedUrlResponse, UploadType } from "@/types/media";
import { generateSlug } from "@/utils/string";

interface UploadMetadata {
  mimeType?: string;
  width?: number;
  height?: number;
  duration?: number;
  blurHash?: string;
}

const BLURHASH_RASTER_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
]);

/**
 * Requests a short-lived R2 PUT URL and storage key for the selected upload.
 */
async function getPresignedUrl(
  file: File,
  type: UploadType
): Promise<PresignedUrlResponse> {
  const response = await axios.post<PresignedUrlResponse>("/api/upload", {
    type,
    fileType: file.type,
    fileSize: file.size,
  });

  if (response.status !== 200) {
    throw new Error("Failed to get presigned URL.");
  }

  return response.data;
}

/**
 * Uploads the raw file bytes directly to R2 through the presigned URL.
 */
async function uploadToR2(presignedUrl: string, file: File) {
  const response = await axios.put(presignedUrl, file, {
    headers: {
      "Content-Type": file.type,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data.error);
  }
}

/**
 * Finalizes an upload by creating the Marble-side record with file metadata.
 */
async function completeUpload(
  key: string,
  file: File,
  type: UploadType,
  metadata: UploadMetadata
) {
  const filenameParts = file.name.split(".");
  const extension = filenameParts.pop() || "";
  const baseName = filenameParts.join(".");

  // UX check to potentially avoid wasted uploads from overly long filenames.
  // The server will still validate this, but truncating here is a bit better.
  // It avoids us having orphaned files in the storage without a corresponding database record.
  // Max length is 240 leaving space for extension and dot.
  const maxBaseNameLength = 240;
  const truncatedBaseName =
    baseName.length > maxBaseNameLength
      ? baseName.substring(0, maxBaseNameLength)
      : baseName;

  const sluggedName = generateSlug(truncatedBaseName);
  const mediaName = `${sluggedName}.${extension}`;

  const response = await axios.post("/api/upload/complete", {
    type,
    key,
    fileType: file.type,
    fileSize: file.size,
    name: mediaName,
    ...metadata,
  });

  if (response.status !== 200) {
    throw new Error(response.data.error);
  }

  return response.data;
}

/**
 * Loads a local image file into an HTMLImageElement so browser metadata and
 * pixels can be read before the file is uploaded.
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to read image metadata."));
    };
    image.src = objectUrl;
  });
}

/**
 * Encodes a compact BlurHash placeholder from a downsized image preview.
 */
function encodeBlurHash(image: HTMLImageElement) {
  const width = Math.max(1, Math.round(image.naturalWidth));
  const height = Math.max(1, Math.round(image.naturalHeight));
  const maxDimension = 32;
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  const canvasWidth = Math.max(1, Math.round(width * scale));
  const canvasHeight = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    return undefined;
  }

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  context.drawImage(image, 0, 0, canvasWidth, canvasHeight);

  const imageData = context.getImageData(0, 0, canvasWidth, canvasHeight);
  return encode(imageData.data, canvasWidth, canvasHeight, 4, 3);
}

/**
 * Extracts raster image dimensions and, when supported, a BlurHash placeholder.
 */
async function getImageMetadata(file: File): Promise<UploadMetadata> {
  const image = await loadImage(file);
  const metadata: UploadMetadata = {
    mimeType: file.type,
    width: image.naturalWidth || undefined,
    height: image.naturalHeight || undefined,
  };

  if (BLURHASH_RASTER_TYPES.has(file.type)) {
    metadata.blurHash = encodeBlurHash(image);
  }

  return metadata;
}

/**
 * Extracts video dimensions and duration from browser media metadata.
 */
function getVideoMetadata(file: File): Promise<UploadMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);

    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        mimeType: file.type,
        width: video.videoWidth || undefined,
        height: video.videoHeight || undefined,
        // Browser media duration is seconds; Marble stores media duration in milliseconds.
        duration: Number.isFinite(video.duration)
          ? Math.round(video.duration * 1000)
          : undefined,
      });
    };
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to read video metadata."));
    };
    video.src = objectUrl;
  });
}

/**
 * Builds the metadata payload sent to `/api/upload/complete`.
 */
async function getUploadMetadata(file: File): Promise<UploadMetadata> {
  try {
    if (file.type.startsWith("image/")) {
      return await getImageMetadata(file);
    }
    if (file.type.startsWith("video/")) {
      return await getVideoMetadata(file);
    }
  } catch (error) {
    console.warn("Failed to extract upload metadata:", error);
  }

  return { mimeType: file.type || undefined };
}

/**
 * Runs the dashboard upload flow: presign, extract metadata, upload to R2, and
 * create the Marble media record.
 */
export async function uploadFile({
  file,
  type,
}: {
  file: File;
  type: UploadType;
}) {
  try {
    const { url: presignedUrl, key } = await getPresignedUrl(file, type);
    const metadata = await getUploadMetadata(file);
    await uploadToR2(presignedUrl, file);
    const result = await completeUpload(key, file, type, metadata);
    return result;
  } catch (error) {
    console.error("Upload failed:", error);
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error("An unexpected error occurred during upload.");
  }
}
