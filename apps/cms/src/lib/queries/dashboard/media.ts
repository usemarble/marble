import "server-only";

import { db } from "@marble/db";
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

export async function getDashboardMedia(
  workspaceId: string,
  filters: MediaListFilters
): Promise<MediaPaginatedListResponse> {
  const { field, direction } = splitMediaSort(filters.sort);
  const { page, perPage, search, type } = filters;
  const trimmedSearch = search?.trim();
  const where = {
    workspaceId,
    ...(type && { type }),
    ...(trimmedSearch && {
      name: {
        contains: trimmedSearch,
        mode: "insensitive" as const,
      },
    }),
  };

  const hasFilters = Boolean(type || trimmedSearch);
  const [media, totalCount, workspaceMediaCount] = await Promise.all([
    db.media.findMany({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
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
    }),
    db.media.count({ where }),
    hasFilters ? db.media.count({ where: { workspaceId } }) : null,
  ]);

  return {
    media: media.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
    pageCount: Math.max(1, Math.ceil(totalCount / perPage)),
    totalCount,
    hasAnyMedia:
      workspaceMediaCount === null ? totalCount > 0 : workspaceMediaCount > 0,
  };
}
