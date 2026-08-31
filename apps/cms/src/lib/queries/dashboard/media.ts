import "server-only";

import { db } from "@marble/drizzle";
import { media } from "@marble/drizzle/schema";
import { and, asc, count, desc, eq, ilike, type SQL } from "drizzle-orm";
import type {
  MediaPaginatedListResponse,
  MediaSort,
  MediaType,
} from "@/types/media";
import { splitMediaSort } from "@/utils/media";

export interface MediaListFilters {
  page: number;
  perPage: number;
  search: string | null;
  sort: MediaSort;
  type?: MediaType | null;
}

const mediaSortColumns = {
  createdAt: media.createdAt,
  name: media.name,
} as const;

function buildMediaFilters(
  workspaceId: string,
  filters: Pick<MediaListFilters, "search" | "type">
): SQL | undefined {
  const trimmedSearch = filters.search?.trim();
  const conditions: SQL[] = [eq(media.workspaceId, workspaceId)];

  if (filters.type) {
    conditions.push(eq(media.type, filters.type));
  }

  if (trimmedSearch) {
    conditions.push(ilike(media.name, `%${trimmedSearch}%`));
  }

  return and(...conditions);
}

export async function getDashboardMedia(
  workspaceId: string,
  filters: MediaListFilters
): Promise<MediaPaginatedListResponse> {
  const { field, direction } = splitMediaSort(filters.sort);
  const { page, perPage, search, type } = filters;
  const trimmedSearch = search?.trim();
  const where = buildMediaFilters(workspaceId, { search, type });

  const hasFilters = Boolean(type || trimmedSearch);
  const sortColumn =
    mediaSortColumns[field as keyof typeof mediaSortColumns] ??
    mediaSortColumns.createdAt;
  const orderBy =
    direction === "asc"
      ? [asc(sortColumn), asc(media.id)]
      : [desc(sortColumn), desc(media.id)];

  const [rows, totalCountResult, workspaceMediaCountResult] = await Promise.all(
    [
      db
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
        .where(where)
        .orderBy(...orderBy)
        .limit(perPage)
        .offset((page - 1) * perPage),
      db.select({ count: count() }).from(media).where(where),
      hasFilters
        ? db
            .select({ count: count() })
            .from(media)
            .where(eq(media.workspaceId, workspaceId))
        : null,
    ]
  );

  const totalCount = totalCountResult[0]?.count ?? 0;
  const workspaceMediaCount = workspaceMediaCountResult?.[0]?.count ?? null;

  return {
    media: rows.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
    pageCount: Math.max(1, Math.ceil(totalCount / perPage)),
    totalCount,
    hasAnyMedia:
      workspaceMediaCount === null ? totalCount > 0 : workspaceMediaCount > 0,
  };
}
