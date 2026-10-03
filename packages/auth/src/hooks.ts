import type { DbClient } from "@marble/db";
import { createRecordId } from "@marble/db/id";
import { author as authorTable, user as userTable } from "@marble/db/schema";
import { generateSlug } from "@marble/utils";
import {
  nameSchema,
  slugSchema,
  timezoneSchema,
} from "@marble/utils/workspace";
import type { User } from "better-auth";
import { APIError } from "better-auth/api";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { AuthEnv } from "./env";

const ALLOWED_AVATAR_HOSTS = [
  "avatars.githubusercontent.com",
  "googleusercontent.com",
] as const;

/**
 * Validates if a URL is from an allowed avatar host with HTTPS protocol
 */
function isAllowedAvatarUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);

    // Enforce HTTPS protocol
    if (parsedUrl.protocol !== "https:") {
      return false;
    }

    const hostname = parsedUrl.hostname;

    // Check if hostname matches exactly or is a subdomain of allowed hosts
    return ALLOWED_AVATAR_HOSTS.some(
      (allowedHost) =>
        hostname === allowedHost || hostname.endsWith(`.${allowedHost}`)
    );
  } catch {
    // Invalid URL
    return false;
  }
}

/**
 * Ensures a Better Auth user has a matching author profile in a workspace.
 * Intended for trusted organization hooks after create/join events.
 */
export async function createAuthor(
  db: DbClient,
  user: User,
  organization: { id: string }
) {
  try {
    const author = await db.query.author.findFirst({
      where: and(
        eq(authorTable.workspaceId, organization.id),
        eq(authorTable.userId, user.id)
      ),
    });

    if (author) {
      return author;
    }

    const baseSlug = generateSlug(user.name || user.email || "user");
    const uniqueSlug = `${baseSlug}-${nanoid(6)}`;

    const [createdAuthor] = await db
      .insert(authorTable)
      .values({
        id: createRecordId(),
        name: user.name,
        email: user.email,
        slug: uniqueSlug,
        image: user.image,
        workspaceId: organization.id,
        userId: user.id,
        role: "Member",
        updatedAt: new Date(),
      })
      .returning();

    if (!createdAuthor) {
      throw new Error("Failed to create author");
    }

    return createdAuthor;
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
export async function storeUserImage(db: DbClient, env: AuthEnv, user: User) {
  if (!user.image) {
    return;
  }

  const {
    CLOUDFLARE_ACCESS_KEY_ID: accessKeyId,
    CLOUDFLARE_SECRET_ACCESS_KEY: secretAccessKey,
    CLOUDFLARE_BUCKET_NAME: bucket,
    CLOUDFLARE_S3_ENDPOINT: endpoint,
    CLOUDFLARE_PUBLIC_URL: publicUrl,
  } = env;

  if (!(accessKeyId && secretAccessKey && bucket && endpoint && publicUrl)) {
    console.warn("R2 is not configured; keeping the provider avatar");
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

    // Loaded on demand: only sign-up needs it, and it is a large module for
    // every other caller of the auth config to evaluate.
    const { PutObjectCommand, S3Client } = await import("@aws-sdk/client-s3");
    const r2 = new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });

    await r2.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ContentLength: buffer.length,
      })
    );

    const avatarUrl = `${publicUrl}/${key}`;

    await db
      .update(userTable)
      .set({
        image: avatarUrl,
      })
      .where(eq(userTable.id, user.id));

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
