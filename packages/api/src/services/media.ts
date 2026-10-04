import { media } from "@marble/db/schema";
import { toMediaPayload } from "@marble/events";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  ilike,
  inArray,
  lt,
  or,
  type SQL,
} from "drizzle-orm";
import type { ServiceContext } from "../context";
import { transact } from "../lib/transaction";

export class MediaError extends Error {
  status: 400 | 404 | 500;
  constructor(status: 400 | 404 | 500, message: string) {
    super(message);
    this.status = status;
  }
}

export const mediaColumns = {
  id: media.id,
  name: media.name,
  url: media.url,
  alt: media.alt,
  createdAt: media.createdAt,
  type: media.type,
  size: media.size,
  mimeType: media.mimeType,
  width: media.width,
  height: media.height,
  duration: media.duration,
  blurHash: media.blurHash,
} as const;

export type MediaSort =
  | "createdAt_asc"
  | "createdAt_desc"
  | "name_asc"
  | "name_desc";
export type MediaType = "image" | "video" | "audio" | "document";
export interface MediaFilters {
  page: number;
  perPage: number;
  search?: string | null;
  sort: MediaSort;
  type?: MediaType | null;
}

function order(sort: MediaSort) {
  const [field, direction] = sort.split("_");
  const column = field === "name" ? media.name : media.createdAt;
  return {
    column,
    direction: direction === "asc" ? ("asc" as const) : ("desc" as const),
    by:
      direction === "asc"
        ? [asc(column), asc(media.id)]
        : [desc(column), desc(media.id)],
  };
}

function dto(row: {
  id: string;
  name: string;
  url: string;
  alt: string | null;
  createdAt: Date;
  type: MediaType;
  size: number;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  blurHash: string | null;
}) {
  return { ...row, createdAt: row.createdAt.toISOString() };
}

export async function listMedia(
  ctx: ServiceContext,
  workspaceId: string,
  filters: MediaFilters
) {
  const { page, perPage, search, type } = filters;
  const conditions: SQL[] = [eq(media.workspaceId, workspaceId)];
  if (type) {
    conditions.push(eq(media.type, type));
  }
  if (search?.trim()) {
    conditions.push(ilike(media.name, `%${search.trim()}%`));
  }
  const where = and(...conditions);
  const { by } = order(filters.sort);
  const [rows, [total], [workspaceCount]] = await Promise.all([
    ctx.db
      .select(mediaColumns)
      .from(media)
      .where(where)
      .orderBy(...by)
      .limit(perPage)
      .offset((page - 1) * perPage),
    ctx.db.select({ count: count() }).from(media).where(where),
    type || search?.trim()
      ? ctx.db
          .select({ count: count() })
          .from(media)
          .where(eq(media.workspaceId, workspaceId))
      : Promise.resolve([{ count: 0 }]),
  ]);
  const totalCount = total?.count ?? 0;
  return {
    media: rows.map(dto),
    pageCount: Math.max(1, Math.ceil(totalCount / perPage)),
    totalCount,
    hasAnyMedia:
      type || search?.trim()
        ? (workspaceCount?.count ?? 0) > 0
        : totalCount > 0,
  };
}

export async function listEditorMedia(
  ctx: ServiceContext,
  workspaceId: string,
  input: { cursor?: string | null; limit: number; sort: MediaSort }
) {
  const [{ count: mediaCount } = { count: 0 }] = await ctx.db
    .select({ count: count() })
    .from(media)
    .where(eq(media.workspaceId, workspaceId));
  const { column, direction, by } = order(input.sort);
  const conditions: SQL[] = [eq(media.workspaceId, workspaceId)];
  if (input.cursor) {
    const separator = input.cursor.indexOf("_");
    if (separator < 0) {
      throw new MediaError(400, "Invalid cursor");
    }
    const cursorId = input.cursor.slice(0, separator);
    let cursorValue: string;
    try {
      cursorValue = decodeURIComponent(input.cursor.slice(separator + 1));
    } catch {
      throw new MediaError(400, "Invalid cursor");
    }
    const value =
      column === media.createdAt ? new Date(cursorValue) : cursorValue;
    if (value instanceof Date && Number.isNaN(value.getTime())) {
      throw new MediaError(400, "Invalid cursor");
    }
    if (cursorId && cursorValue) {
      const compare = direction === "asc" ? gt : lt;
      const filter = or(
        compare(column, value),
        and(eq(column, value), compare(media.id, cursorId))
      );
      if (filter) {
        conditions.push(filter);
      }
    }
  }
  const rows = await ctx.db
    .select(mediaColumns)
    .from(media)
    .where(and(...conditions))
    .orderBy(...by)
    .limit(input.limit + 1);
  let nextCursor: string | undefined;
  if (rows.length > input.limit) {
    rows.pop();
    const last = rows.at(-1);
    if (last) {
      nextCursor = `${last.id}_${encodeURIComponent(column === media.createdAt ? last.createdAt.toISOString() : last.name)}`;
    }
  }
  return { media: rows.map(dto), nextCursor, hasAnyMedia: mediaCount > 0 };
}

export async function getMedia(
  ctx: ServiceContext,
  workspaceId: string,
  id: string
) {
  const [row] = await ctx.db
    .select(mediaColumns)
    .from(media)
    .where(and(eq(media.id, id), eq(media.workspaceId, workspaceId)))
    .limit(1);
  if (!row) {
    throw new MediaError(404, "Media not found");
  }
  return dto(row);
}

export async function updateMedia(
  ctx: ServiceContext,
  workspaceId: string,
  id: string,
  values: { name: string; alt: string | null }
) {
  return transact(ctx, async ({ tx }) => {
    const [row] = await tx
      .update(media)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(media.id, id), eq(media.workspaceId, workspaceId)))
      .returning(mediaColumns);
    if (!row) {
      throw new MediaError(404, "Media not found");
    }
    return dto(row);
  });
}

function safeMediaKey(key: string, bucketName: string) {
  let decoded = decodeURIComponent(key)
    .replace(/^\/+/, "")
    .replace(/\/{2,}/g, "/");
  if (decoded.startsWith(`${bucketName}/`)) {
    decoded = decoded.slice(bucketName.length + 1);
  }
  if (
    !decoded.startsWith("media/") ||
    decoded.split("/").some((segment) => ["", ".", ".."].includes(segment))
  ) {
    throw new Error("Invalid storage key: must be a safe media object key.");
  }
  return decoded;
}

export async function deleteMedia(
  ctx: ServiceContext,
  workspaceId: string,
  mediaIds: string[],
  actorId: string
) {
  const existing = await ctx.db
    .select()
    .from(media)
    .where(
      and(inArray(media.id, mediaIds), eq(media.workspaceId, workspaceId))
    );
  const found = new Set(existing.map((row) => row.id));
  const failedIds = mediaIds.filter((id) => !found.has(id));
  const ready: typeof existing = [];
  for (const row of existing) {
    try {
      if (row.url) {
        await ctx.env.STORAGE.delete(
          safeMediaKey(row.storageKey, ctx.env.R2_BUCKET_NAME)
        );
      }
      ready.push(row);
    } catch (error) {
      ctx.log.error(error instanceof Error ? error : new Error(String(error)));
      failedIds.push(row.id);
    }
  }
  if (!ready.length) {
    throw new MediaError(500, "No media items were deleted successfully");
  }
  await transact(ctx, async ({ tx, emitEvent }) => {
    await tx.delete(media).where(
      and(
        inArray(
          media.id,
          ready.map((row) => row.id)
        ),
        eq(media.workspaceId, workspaceId)
      )
    );
    for (const row of ready) {
      await emitEvent({
        type: "media_deleted",
        workspaceId,
        source: "dashboard",
        resourceType: "media",
        resourceId: row.id,
        actorType: "user",
        actorId,
        payload: toMediaPayload(row),
      });
    }
  });
  const deletedIds = ready.map((row) => row.id);
  return {
    deletedIds,
    failedIds: failedIds.length ? failedIds : undefined,
    message: failedIds.length
      ? `Deleted ${deletedIds.length} items, ${failedIds.length} failed`
      : `Deleted ${deletedIds.length} items successfully`,
  };
}
