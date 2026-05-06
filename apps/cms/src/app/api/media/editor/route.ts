import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/lib/auth/session";
import { loadMediaEditorApiFilters } from "@/lib/search-params";
import { splitMediaSort } from "@/utils/media";

export async function GET(request: Request) {
  const sessionData = await getServerSession();

  if (!sessionData) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const orgId = sessionData.session?.activeOrganizationId;

  if (!orgId) {
    return NextResponse.json(
      { error: "Active workspace not found in session" },
      { status: 400 }
    );
  }

  const filters = loadMediaEditorApiFilters(request, { strict: true });
  if (!z.number().int().min(1).max(100).safeParse(filters.limit).success) {
    return NextResponse.json({ error: "Invalid limit" }, { status: 400 });
  }

  const { field, direction } = splitMediaSort(filters.sort);
  const { cursor, limit } = filters;

  try {
    const hasAnyMedia =
      (await db.media.count({
        where: { workspaceId: orgId },
      })) > 0;

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

    const media = await db.media.findMany({
      where: {
        workspaceId: orgId,
        ...(cursorId &&
          parsedCursorValue !== null && {
            OR: [
              {
                [field]: {
                  [direction === "asc" ? "gt" : "lt"]: parsedCursorValue,
                },
              },
              {
                [field]: parsedCursorValue,
                id: { [direction === "asc" ? "gt" : "lt"]: cursorId },
              },
            ],
          }),
      },
      take: limit + 1,
      orderBy: [{ [field]: direction }, { id: direction }],
      select: {
        id: true,
        name: true,
        url: true,
        alt: true,
        createdAt: true,
        type: true,
        size: true,
        mimeType: true,
        width: true,
        height: true,
        duration: true,
        blurHash: true,
      },
    });

    let nextCursor: string | undefined;

    if (media.length > limit) {
      media.pop();
      const lastItem = media.at(-1);

      if (lastItem) {
        const value =
          field === "createdAt"
            ? lastItem.createdAt.toISOString()
            : lastItem.name;
        nextCursor = `${lastItem.id}_${encodeURIComponent(value)}`;
      }
    }

    return NextResponse.json(
      { media, nextCursor, hasAnyMedia },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch media";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
