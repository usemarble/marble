"use server";

import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { db } from "@marble/db";
import { nanoid } from "nanoid";
import getServerSession from "@/lib/auth/session";
import { generateSlug } from "@/utils/string";

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

/**
 * Upload an image to R2
 * @param file - The file to upload
 * @returns A promise that resolves to an object containing:
 * - url: string - The public URL of the uploaded image
 * - key: string - The S3 key of the uploaded image
 * - media?: { id: string; name: string; url: string } - Optional media object if saved to database
 */
export async function uploadMediaAction(file: File): Promise<UploadResult> {
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
    const filenameParts = file.name.split(".");
    const extension = filenameParts.pop();
    const baseName = filenameParts.join(".");

    const sluggedName = generateSlug(baseName);
    const sluggedId = id.toLocaleLowerCase();
    const key = `media/${sluggedName}-${sluggedId}.${extension}`;

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
    const mediaName = `${sluggedName}-${sluggedId}.${extension}`;

    let media: { id: string; name: string; url: string } | undefined;

    if (workspaceCanSaveMedia) {
      const res = await db.media.create({
        data: {
          name: mediaName,
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
      media: media,
    };
  } catch (error) {
    console.error("Error uploading image to R2:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to upload image",
    );
  }
}

/**
 * Delete media from the database and R2 bucket
 * @param mediaId - The ID of the media to delete
 * @returns Object containing success status and deleted media ID
 */
export async function deleteMediaAction(mediaId: string) {
  const sessionInfo = await getServerSession();
  if (!sessionInfo) throw new Error("Unauthorized");

  try {
    // Get the media from the db
    const media = await db.media.findUnique({
      where: {
        id: mediaId,
        workspaceId: sessionInfo.session.activeOrganizationId as string,
      },
    });

    if (!media) {
      throw new Error("Media not found");
    }

    // Delete the object from R2
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: media.name,
      }),
    );

    // Delete the media from the database
    const deletedMedia = await db.media.delete({
      where: {
        id: mediaId,
      },
    });

    return { success: true, id: deletedMedia.id };
  } catch (error) {
    console.error("Error deleting media:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to delete media",
    );
  }
}

/**
 * Uploads user's avatar to R2
 * @param file - The file to upload
 * @returns A promise that resolves to the public URL of the uploaded image
 */
export async function uploadUserAvatarAction(
  file: File,
): Promise<{ avatarUrl: string }> {
  const sessionInfo = await getServerSession();
  if (!sessionInfo) throw new Error("Unauthorized");
  const userId = sessionInfo.session.userId;

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
    const filenameParts = file.name.split(".");
    const extension = filenameParts.pop();
    const baseName = filenameParts.join(".");

    const sluggedName = generateSlug(baseName);
    const sluggedId = id.toLocaleLowerCase();
    const key = `user-avatars/${sluggedName}-${sluggedId}.${extension}`;

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

    // Update user's avatarUrl
    await db.user.update({
      where: { id: userId },
      data: { image: url },
    });

    return { avatarUrl: url };
  } catch (error) {
    console.error("Error uploading profile image to R2:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to upload profile image",
    );
  }
}

/**
 * Uploads workspace's logo to R2
 * @param file - The file to upload
 * @returns A promise that resolves to the public URL of the uploaded logo
 */
export async function uploadWorkspaceLogoAction(
  file: File,
): Promise<{ logoUrl: string }> {
  const sessionInfo = await getServerSession();
  if (!sessionInfo) throw new Error("Unauthorized");
  const workspaceId = sessionInfo.session.activeOrganizationId as string;

  // Validate file
  if (!workspaceId) throw new Error("Workspace ID not found in session");

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
    const filenameParts = file.name.split(".");
    const extension = filenameParts.pop();
    const baseName = filenameParts.join(".");

    const sluggedName = generateSlug(baseName);
    const sluggedId = id.toLocaleLowerCase();
    const key = `workspace-logos/${sluggedName}-${sluggedId}.${extension}`;

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

    // Update organization's logoUrl
    await db.organization.update({
      where: { id: workspaceId },
      data: { logo: url },
    });

    return { logoUrl: url };
  } catch (error) {
    console.error("Error uploading workspace logo to R2:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to upload workspace logo",
    );
  }
}
