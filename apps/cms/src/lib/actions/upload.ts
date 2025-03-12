"use server";

import getServerSession from "@/lib/auth/session";
import { generateSlug } from "@/utils/generate-slug";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import db from "@marble/db";
import { nanoid } from "nanoid";

const ACCESS_KEY_ID = process.env.CLOUDFLARE_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.CLOUDFLARE_BUCKET_NAME;
const ENDPOINT = process.env.CLOUDFLARE_S3_ENDPOINT;
const PUBLIC_URL = process.env.CLOUDFLARE_PUBLIC_URL;

if (!ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !BUCKET_NAME || !ENDPOINT) {
  throw new Error("Missing Cloudflare R2 environment variables");
}

const bucketName = BUCKET_NAME;
const endpoint = ENDPOINT;
const publicUrl = PUBLIC_URL;

const s3Client = new S3Client({
  region: "auto",
  endpoint,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

export interface UploadResult {
  url: string;
  key: string;
  media?: {
    id: string;
    name: string;
    url: string;
  };
}

// Maximum file size (4MB)
const MAX_FILE_SIZE = 4 * 1024 * 1024;

// Allowed MIME types (Just to be safe, even though I only compress to webp for now)
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

export async function uploadImageAction(file: File): Promise<UploadResult> {
  const sessionInfo = await getServerSession();
  if (!sessionInfo) throw new Error("Unauthorized");
  
  // Allow all workspaces to save media for now
  const workspaceCanSaveMedia = true; 

  // Validate file (although compressed images are usually under 1MB)
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    );
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(
      `File type ${file.type} is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`,
    );
  }

  try {
    const id = nanoid(6);
    const extension = file.name.split(".").pop() || "webp";
    const filename = generateSlug(`${id}-${file.name}`);
    const key = `${filename}.${extension}`;

    // Upload file to R2
    const parallelUploads = new Upload({
      client: s3Client,
      params: {
        Bucket: bucketName,
        Key: key,
        Body: file,
        ContentType: file.type,
      },
    });

    // Upload and save to database
    await parallelUploads.done();

    // Construct the URL
    const url = `${publicUrl}/${key}`;

    let media: { id: string; name: string; url: string } | undefined = undefined;

    if (workspaceCanSaveMedia) {
      const res = await db.media.create({
        data: {
          name: key,
          url,
          size: file.size,
          workspaceId: sessionInfo.session.activeOrganizationId as string,
        },
      });
      media = { id: res.id, name: res.name, url: res.url };
    }

    return {
      url,
      key,
      media: media
    };
  } catch (error) {
    console.error("Error uploading image to R2:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to upload image",
    );
  }
}
