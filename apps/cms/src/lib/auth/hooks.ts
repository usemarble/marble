import "server-only";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@marble/db";
import type { User } from "better-auth";
import { APIError } from "better-auth/api";
import { nanoid } from "nanoid";
import { isAllowedAvatarUrl } from "@/lib/constants";
import { R2_BUCKET_NAME, R2_PUBLIC_URL, r2 } from "@/lib/r2";
import { generateSlug } from "@/utils/string";
import {
  nameSchema,
  slugSchema,
  timezoneSchema,
} from "../validations/workspace";
import type { Organization } from "./types";

/**
 * Ensures a Better Auth user has a matching author profile in a workspace.
 * Intended for trusted organization hooks after create/join events.
 */
export async function createAuthor(user: User, organization: Organization) {
  try {
    const existingAuthor = await db.author.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: organization.id,
          userId: user.id,
        },
      },
    });

    if (existingAuthor) {
      console.log(
        "Author already exists for user",
        user.id,
        "in workspace",
        organization.id
      );
      return existingAuthor;
    }

    const baseSlug = generateSlug(user.name || user.email || "user");
    const uniqueSlug = `${baseSlug}-${nanoid(6)}`;

    const author = await db.author.create({
      data: {
        name: user.name,
        email: user.email,
        slug: uniqueSlug,
        image: user.image,
        workspaceId: organization.id,
        userId: user.id,
        role: "Member",
      },
    });

    console.log(
      "Created author for user",
      user.id,
      "in workspace",
      organization.id
    );
    return author;
  } catch (error) {
    console.error("Failed to create author:", error);
    throw new APIError("INTERNAL_SERVER_ERROR", {
      message: "Failed to create author profile",
    });
  }
}

/**
 * Copies a trusted provider avatar into Marble-owned R2 storage for a user.
 * Intended for Better Auth user lifecycle hooks.
 */
export async function storeUserImage(user: User) {
  if (!user.image) {
    return;
  }

  try {
    if (!isAllowedAvatarUrl(user.image)) {
      console.warn(`Avatar URL not from allowed host: ${user.image}`);
      return;
    }

    const response = await fetch(user.image);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extension = contentType.split("/")[1];
    const key = `avatars/${user.id}/${nanoid()}.${extension}`;

    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ContentLength: buffer.length,
      })
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

/**
 * Validates a workspace slug from Better Auth organization hook input.
 */
export async function validateWorkspaceSlug(slug: string | undefined) {
  const { success } = slugSchema.safeParse({ slug });
  if (!success) {
    throw new APIError("BAD_REQUEST", {
      message: "Invalid slug",
    });
  }
}

/**
 * Validates a workspace name from Better Auth organization hook input.
 */
export async function validateWorkspaceName(name: string | undefined) {
  const { success } = nameSchema.safeParse({ name });
  if (!success) {
    throw new APIError("BAD_REQUEST", {
      message: "Invalid name",
    });
  }
}

/**
 * Validates a workspace timezone from Better Auth organization hook input.
 */
export async function validateWorkspaceTimezone(timezone: string | undefined) {
  const { success } = timezoneSchema.safeParse({ timezone });
  if (!success) {
    throw new APIError("BAD_REQUEST", {
      message: "Invalid timezone",
    });
  }
}

interface ValidateWorkspace {
  slug: string | undefined;
  name: string | undefined;
  timezone: string | undefined;
}

/**
 * Validates all workspace fields accepted by Better Auth organization hooks.
 */
export async function validateWorkspaceSchema({
  slug,
  name,
  timezone,
}: ValidateWorkspace) {
  await validateWorkspaceSlug(slug);
  await validateWorkspaceName(name);
  await validateWorkspaceTimezone(timezone);
}
