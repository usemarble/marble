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

  console.log("response from r2", response.data);

  return response.data;
}

async function completeUpload(key: string, file: File, type: UploadType) {
  const filenameParts = file.name.split(".");
  const extension = filenameParts.pop();
  const baseName = filenameParts.join(".");
  const sluggedName = generateSlug(baseName);
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
    throw error;
  }
}
