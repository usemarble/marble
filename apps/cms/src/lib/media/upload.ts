import axios from "axios";
import type { UploadType } from "@/types/media";
import { generateSlug } from "@/utils/string";

async function getPresignedUrl(file: File, type: UploadType) {
  const response = await axios.post("/api/upload", {
    type,
    fileType: file.type,
    fileSize: file.size,
  });

  if (response.status !== 200) {
    throw new Error("Failed to get presigned URL.");
  }

  return response.data;
}

async function uploadToR2(presignedUrl: string, file: File) {
  const response = await axios.put(presignedUrl, file, {
    headers: {
      "Content-Type": file.type,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data.error);
  }

  return response.data;
}

async function completeUpload(key: string, file: File, type: UploadType) {
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
  });

  if (response.status !== 200) {
    throw new Error(response.data.error);
  }

  return response.data;
}

export async function uploadFile({
  file,
  type,
}: {
  file: File;
  type: UploadType;
}) {
  try {
    const { url: presignedUrl, key } = await getPresignedUrl(file, type);
    await uploadToR2(presignedUrl, file);
    const result = await completeUpload(key, file, type);
    return result;
  } catch (error) {
    console.error("Upload failed:", error);
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error("An unexpected error occurred during upload.");
  }
}
