import { createPolarSdkClient } from "@marble/auth/polar";
import { createRecordId } from "@marble/db/id";
import {
  media,
  member,
  subscription,
  usageEvent,
  user,
  workspace,
} from "@marble/db/schema";
import { toMediaPayload } from "@marble/events";
import { getWorkspacePlan, PLAN_LIMITS } from "@marble/utils";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis/cloudflare";
import { AwsClient } from "aws4fetch";
import { and, desc, eq, gt, or, sql, sum } from "drizzle-orm";
import { log } from "evlog";
import type { ServiceContext } from "../context";
import { transact } from "../lib/transaction";
import { mediaColumns } from "./media";

export type UploadType =
  | "avatar"
  | "author-avatar"
  | "logo"
  | "media"
  | "import";
export interface UploadIntent {
  userId: string;
  workspaceId: string;
  key: string;
  type: UploadType;
  mimeType: string;
  size: number;
  expiresAt: number;
}
export class UploadError extends Error {
  status: 400 | 403 | 404 | 429 | 500;
  constructor(status: 400 | 403 | 404 | 429 | 500, message: string) {
    super(message);
    this.status = status;
  }
}

const rasterTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
];
const mediaTypes = [
  ...rasterTypes,
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
];
const importTypes = [
  "text/markdown",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream",
];
const limits: Record<UploadType, number> = {
  avatar: 5 * 1024 * 1024,
  "author-avatar": 5 * 1024 * 1024,
  logo: 5 * 1024 * 1024,
  media: 250 * 1024 * 1024,
  import: 4 * 1024 * 1024,
};
const ttlSeconds = 10 * 60;

function allowedTypes(type: UploadType) {
  return type === "media"
    ? mediaTypes
    : type === "import"
      ? importTypes
      : rasterTypes;
}
function validate(type: UploadType, mimeType: string, size: number) {
  if (!Number.isInteger(size) || size <= 0 || size > limits[type]) {
    throw new UploadError(
      400,
      `File size exceeds the maximum limit of ${limits[type] / 1024 / 1024}MB for ${type}.`
    );
  }
  if (!allowedTypes(type).includes(mimeType)) {
    throw new UploadError(
      400,
      `File type ${mimeType} is not allowed for ${type}.`
    );
  }
}
function base64url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
function decodeBase64url(value: string) {
  return Uint8Array.from(
    atob(value.replace(/-/g, "+").replace(/_/g, "/")),
    (char) => char.charCodeAt(0)
  );
}
async function hmac(secret: string, data: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return base64url(
    new Uint8Array(
      await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data))
    )
  );
}
export async function signUploadIntent(secret: string, intent: UploadIntent) {
  const value = `v2.${base64url(new TextEncoder().encode(JSON.stringify(intent)))}`;
  return `${value}.${await hmac(secret, value)}`;
}
export async function verifyUploadIntent(
  secret: string,
  token: string
): Promise<UploadIntent> {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v2") {
    throw new UploadError(400, "Invalid upload intent");
  }
  const signed = `${parts[0]}.${parts[1]}`;
  const expected = await hmac(secret, signed);
  if (parts[2] !== expected) {
    throw new UploadError(400, "Invalid upload intent");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(
      new TextDecoder().decode(decodeBase64url(parts[1] ?? ""))
    );
  } catch {
    throw new UploadError(400, "Invalid upload intent");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new UploadError(400, "Invalid upload intent");
  }
  const intent = parsed as UploadIntent;
  if (
    typeof intent.userId !== "string" ||
    typeof intent.workspaceId !== "string" ||
    typeof intent.key !== "string" ||
    !["avatar", "author-avatar", "logo", "media", "import"].includes(
      intent.type
    ) ||
    typeof intent.mimeType !== "string" ||
    !Number.isInteger(intent.size) ||
    typeof intent.expiresAt !== "number"
  ) {
    throw new UploadError(400, "Invalid upload intent");
  }
  if (intent.expiresAt <= Date.now()) {
    throw new UploadError(400, "Upload intent expired");
  }
  validate(intent.type, intent.mimeType, intent.size);
  return intent;
}

export async function canStoreUpload(
  ctx: ServiceContext,
  workspaceId: string,
  size: number
) {
  const [usage, subscriptions] = await Promise.all([
    ctx.db
      .select({ total: sum(media.size) })
      .from(media)
      .where(eq(media.workspaceId, workspaceId)),
    ctx.db
      .select({
        plan: subscription.plan,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        currentPeriodEnd: subscription.currentPeriodEnd,
      })
      .from(subscription)
      .where(
        and(
          eq(subscription.workspaceId, workspaceId),
          or(
            eq(subscription.status, "active"),
            eq(subscription.status, "trialing"),
            and(
              eq(subscription.status, "canceled"),
              eq(subscription.cancelAtPeriodEnd, true),
              gt(subscription.currentPeriodEnd, new Date())
            )
          )
        )
      )
      .orderBy(desc(subscription.createdAt))
      .limit(1),
  ]);
  const plan = getWorkspacePlan(subscriptions.at(0) ?? null);
  return (
    Number(usage[0]?.total ?? 0) + size <=
    PLAN_LIMITS[plan].maxMediaStorage * 1024 * 1024
  );
}

async function checkRateLimit(
  ctx: ServiceContext,
  type: UploadType,
  workspaceId: string,
  userId: string
) {
  if (type === "import") {
    return;
  }
  const definition =
    type === "logo"
      ? [
          "workspace-logo-upload-rate-limit",
          10,
          "30 m",
          `${workspaceId}:${userId}`,
        ]
      : type === "media"
        ? [
            "workspace-media-upload-rate-limit",
            60,
            "60 m",
            `${workspaceId}:${userId}`,
          ]
        : ["user-avatar-upload-rate-limit", 5, "30 m", userId];
  const redis = new Redis({
    url: ctx.env.REDIS_URL,
    token: ctx.env.REDIS_TOKEN,
  });
  const limiter = new Ratelimit({
    redis,
    prefix: definition[0] as string,
    limiter: Ratelimit.slidingWindow(
      definition[1] as number,
      definition[2] as "30 m" | "60 m"
    ),
  });
  const result = await limiter.limit(definition[3] as string);
  if (!result.success) {
    throw new UploadError(429, "Too Many Requests");
  }
}

function objectKey(
  type: UploadType,
  workspaceId: string,
  userId: string,
  mimeType: string,
  fileName?: string
) {
  const random = crypto.randomUUID();
  if (type === "import") {
    const extension = fileName?.toLowerCase().split(".").pop();
    if (!["md", "mdx", "zip"].includes(extension ?? "")) {
      throw new UploadError(
        400,
        "Import file must be a .md, .mdx, or .zip file"
      );
    }
    return `imports/${workspaceId}/${random}.${extension}`;
  }
  const extension = mimeType.split("/")[1];
  if (type === "avatar" || type === "author-avatar") {
    return `avatars/${userId}/${random}.${extension}`;
  }
  if (type === "logo") {
    return `logos/${workspaceId}/${random}.${extension}`;
  }
  return `media/${workspaceId}/${random}.${extension}`;
}

export async function initiateUpload(
  ctx: ServiceContext,
  actor: { id: string },
  workspaceId: string,
  role: string,
  input: {
    type: UploadType;
    fileType: string;
    fileSize: number;
    fileName?: string;
  }
) {
  if (input.type === "logo" && role !== "owner") {
    throw new UploadError(403, "Only workspace owners can update the logo");
  }
  await checkRateLimit(ctx, input.type, workspaceId, actor.id);
  validate(input.type, input.fileType, input.fileSize);
  if (!(await canStoreUpload(ctx, workspaceId, input.fileSize))) {
    throw new UploadError(403, "Media storage limit reached");
  }
  const key = objectKey(
    input.type,
    workspaceId,
    actor.id,
    input.fileType,
    input.fileName
  );
  const expiresAt = Date.now() + ttlSeconds * 1000;
  const url = new URL(
    `${ctx.env.R2_S3_ENDPOINT}/${ctx.env.R2_BUCKET_NAME}/${key}`
  );
  url.searchParams.set("X-Amz-Expires", String(ttlSeconds));
  const signer = new AwsClient({
    accessKeyId: ctx.env.R2_ACCESS_KEY_ID,
    secretAccessKey: ctx.env.R2_SECRET_ACCESS_KEY,
    service: "s3",
    region: "auto",
  });
  const signed = await signer.sign(url.toString(), {
    method: "PUT",
    headers: { "Content-Type": input.fileType },
    aws: { signQuery: true },
  });
  const token = await signUploadIntent(ctx.env.BETTER_AUTH_SECRET, {
    userId: actor.id,
    workspaceId,
    key,
    type: input.type,
    mimeType: input.fileType,
    size: input.fileSize,
    expiresAt,
  });
  return {
    url: signed.url,
    key,
    token,
    headers: { "Content-Type": input.fileType },
  };
}

export interface CompleteInput {
  token: string;
  type: UploadType;
  key: string;
  fileType: string;
  fileSize: number;
  name?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  duration?: number;
  blurHash?: string;
}

async function trackPolarUpload(
  ctx: ServiceContext,
  workspaceId: string,
  fileSize: number,
  mediaType: string
) {
  try {
    const owner = await ctx.db.query.workspace.findFirst({
      where: eq(workspace.id, workspaceId),
      with: {
        members: {
          where: eq(member.role, "owner"),
          columns: { userId: true },
          limit: 1,
        },
      },
    });
    const customerId = owner?.members[0]?.userId ?? workspaceId;
    if (!ctx.env.POLAR_ACCESS_TOKEN) {
      return;
    }
    await createPolarSdkClient(
      ctx.env.POLAR_ACCESS_TOKEN,
      ctx.env.POLAR_SERVER
    ).events.ingest({
      events: [
        {
          name: "media_upload",
          external_customer_id: customerId,
          metadata: { size: fileSize, type: mediaType },
        },
      ],
    });
  } catch (error) {
    // As in the CMS, Polar failures do not undo a completed upload.
    log.error(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function completeUpload(
  ctx: ServiceContext,
  actor: { id: string },
  workspaceId: string,
  role: string,
  input: CompleteInput
) {
  const intent = await verifyUploadIntent(
    ctx.env.BETTER_AUTH_SECRET,
    input.token
  );
  if (
    intent.userId !== actor.id ||
    intent.workspaceId !== workspaceId ||
    intent.type !== input.type ||
    intent.key !== input.key ||
    intent.mimeType !== input.fileType ||
    intent.size !== input.fileSize ||
    (input.mimeType !== undefined && input.mimeType !== intent.mimeType)
  ) {
    throw new UploadError(400, "Invalid upload intent");
  }
  if (intent.type === "logo" && role !== "owner") {
    throw new UploadError(403, "Only workspace owners can update the logo");
  }
  const head = await ctx.env.STORAGE.head(intent.key);
  if (!head) {
    throw new UploadError(404, "Uploaded object missing");
  }
  if (
    head.size !== intent.size ||
    head.httpMetadata?.contentType !== intent.mimeType
  ) {
    throw new UploadError(400, "Uploaded object does not match the intent");
  }
  const url = `${ctx.env.STORAGE_PUBLIC_URL}/${intent.key}`;
  if (intent.type === "media") {
    // An advisory transaction lock makes retries safe even before the unique-key migration reaches Neon.
    const outcome = await transact(
      ctx,
      async ({ tx, emitEvent, invalidate }) => {
        await tx.execute(
          sql`SELECT pg_advisory_xact_lock(hashtextextended(${intent.key}, 0))`
        );
        const [existing] = await tx
          .select(mediaColumns)
          .from(media)
          .where(
            and(
              eq(media.storageKey, intent.key),
              eq(media.workspaceId, workspaceId)
            )
          )
          .limit(1);
        if (existing) {
          return { row: existing, created: false };
        }
        if (
          !(await canStoreUpload(
            { ...ctx, db: tx } as ServiceContext,
            workspaceId,
            intent.size
          ))
        ) {
          throw new UploadError(403, "Media storage limit reached");
        }
        const kind = intent.mimeType.startsWith("image/")
          ? "image"
          : intent.mimeType.startsWith("video/")
            ? "video"
            : "document";
        const [created] = await tx
          .insert(media)
          .values({
            id: createRecordId(),
            name: input.name ?? intent.key.split("/").pop() ?? "media",
            url,
            storageKey: intent.key,
            size: intent.size,
            mimeType: intent.mimeType,
            width: input.width,
            height: input.height,
            duration: input.duration,
            blurHash: input.blurHash,
            type: kind,
            workspaceId,
            updatedAt: new Date(),
          })
          .returning();
        if (!created) {
          throw new UploadError(500, "Failed to complete upload");
        }
        await tx.insert(usageEvent).values({
          id: createRecordId(),
          type: "media_upload",
          workspaceId,
          size: intent.size,
        });
        await emitEvent({
          type: "media_uploaded",
          workspaceId,
          source: "dashboard",
          resourceType: "media",
          resourceId: created.id,
          actorType: "user",
          actorId: actor.id,
          payload: toMediaPayload(created),
        });
        invalidate(workspaceId, "media");
        return { row: created, created: true };
      }
    );
    if (outcome.created) {
      ctx.defer(
        trackPolarUpload(ctx, workspaceId, intent.size, outcome.row.type)
      );
    }
    return { ...outcome.row, createdAt: outcome.row.createdAt.toISOString() };
  }
  if (!(await canStoreUpload(ctx, workspaceId, intent.size))) {
    throw new UploadError(403, "Media storage limit reached");
  }
  if (intent.type === "logo") {
    await transact(ctx, async ({ tx }) => {
      await tx
        .update(workspace)
        .set({ logo: url, updatedAt: new Date() })
        .where(eq(workspace.id, workspaceId));
    });
  } else if (intent.type === "avatar") {
    await transact(ctx, async ({ tx }) => {
      await tx
        .update(user)
        .set({ image: url, updatedAt: new Date() })
        .where(eq(user.id, actor.id));
    });
  }
  return { url };
}
