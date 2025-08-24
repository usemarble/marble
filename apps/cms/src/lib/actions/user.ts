"use server";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@marble/db";
import type { User } from "better-auth";
import { nanoid } from "nanoid";
import { isAllowedAvatarUrl } from "@/lib/constants";
import { R2_BUCKET_NAME, R2_PUBLIC_URL, r2 } from "@/lib/r2";

export async function storeUserImageAction(user: User) {
  if (!user.image) return;

  try {
    // Validate the URL is from an allowed provider with HTTPS
    if (!isAllowedAvatarUrl(user.image)) {
      console.warn(`Avatar URL not from allowed host: ${user.image}`);
      return;
    }
    const response = await fetch(user.image);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    // Grab file type from headers
    const contentType = response.headers.get("content-type") || "image/png";

    // Convert to Buffer for upload
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate key for the avatar
    const id = nanoid(6);
    const extension = contentType.split("/")[1];
    const sluggedId = id.toLowerCase();
    const key = `avatars/avatar-${sluggedId}.${extension}`;

    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ContentLength: buffer.length,
      }),
    );

    const avatarUrl = `${R2_PUBLIC_URL}/${key}`;

    await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        image: avatarUrl,
      },
    });

    return { avatarUrl };
  } catch (error) {
    console.error("Failed to store user avatar:", error);
  }
}
