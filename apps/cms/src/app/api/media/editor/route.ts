import { db } from "@marble/drizzle";
import { media } from "@marble/drizzle/schema";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  lt,
  or,
  type SQL,
} from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import { loadMediaEditorApiFilters } from "@/lib/search-params";
import { splitMediaSort } from "@/utils/media";

const mediaSortColumns = {
  createdAt: media.createdAt,
  name: media.name,
} as const;

export async function GET(request: Request) {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { workspaceId } = accessData;

  const filters = loadMediaEditorApiFilters(request, { strict: true });
  if (!z.number().int().min(1).max(100).safeParse(filters.limit).success) {
    return NextResponse.json({ error: "Invalid limit" }, { status: 400 });
  }

  const { field, direction } = splitMediaSort(filters.sort);
  const { cursor, limit } = filters;

  try {
    const [mediaCountResult] = await db
      .select({ count: count() })
      .from(media)
      .where(eq(media.workspaceId, workspaceId));

    const hasAnyMedia = (mediaCountResult?.count ?? 0) > 0;

    let cursorId: string | null = null;
    let parsedCursorValue: string | Date | null = null;
    if (cursor) {
      const separatorIndex = cursor.indexOf("_");
      if (separatorIndex === -1) {
        return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
      }

      const idPart = cursor.slice(0, separatorIndex);
      const encodedValue = cursor.slice(separatorIndex + 1);
      let valuePart: string;
      try {
        valuePart = decodeURIComponent(encodedValue);
      } catch {
        return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
      }

      cursorId = idPart || null;
      if (valuePart) {
        if (field === "createdAt") {
          const date = new Date(valuePart);
          if (Number.isNaN(date.getTime())) {
            return NextResponse.json(
              { error: "Invalid cursor" },
              { status: 400 }
            );
          }
          parsedCursorValue = date;
        } else {
          parsedCursorValue = valuePart;
        }
      }
    }

    const sortColumn =
      mediaSortColumns[field as keyof typeof mediaSortColumns] ??
      mediaSortColumns.createdAt;

    const conditions: SQL[] = [eq(media.workspaceId, workspaceId)];

    if (cursorId && parsedCursorValue !== null) {
      const fieldCompare = direction === "asc" ? gt : lt;
      const idCompare = direction === "asc" ? gt : lt;

      const cursorFilter = or(
        fieldCompare(sortColumn, parsedCursorValue),
        and(eq(sortColumn, parsedCursorValue), idCompare(media.id, cursorId))
      );
      if (cursorFilter) {
        conditions.push(cursorFilter);
      }
    }

    const orderBy =
      direction === "asc"
        ? [asc(sortColumn), asc(media.id)]
        : [desc(sortColumn), desc(media.id)];

    const rows = await db
      .select({
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
      })
      .from(media)
      .where(and(...conditions))
      .orderBy(...orderBy)
      .limit(limit + 1);

    let nextCursor: string | undefined;

    if (rows.length > limit) {
      rows.pop();
      const lastItem = rows.at(-1);

      if (lastItem) {
        const value =
          field === "createdAt"
            ? lastItem.createdAt.toISOString()
            : lastItem.name;
        nextCursor = `${lastItem.id}_${encodeURIComponent(value)}`;
      }
    }

    return NextResponse.json(
      { media: rows, nextCursor, hasAnyMedia },
      { status: 200 }
    );
  } catch (error) {
    console.error("[MediaEditor] Failed to fetch media:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}
