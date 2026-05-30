import "server-only";

import { db } from "@marble/db";
import type { Post } from "@/types/dashboard";

export interface PostListFilters {
  category: string;
  page: number;
  perPage: number;
  search: string;
  sort: string;
  status: "all" | "published" | "draft";
}

export interface PostListResponse {
  hasAnyPosts: boolean;
  pageCount: number;
  posts: Post[];
  totalCount: number;
}

const POST_SORT_FIELDS = new Set([
  "createdAt",
  "publishedAt",
  "updatedAt",
  "title",
]);

export function splitPostSort(sort: string) {
  const [field = "createdAt", direction = "desc"] = sort.split("_");
  return {
    field: POST_SORT_FIELDS.has(field) ? field : "createdAt",
    direction: direction === "asc" ? "asc" : "desc",
  } as const;
}

export async function getDashboardPosts(
  workspaceId: string,
  filters: PostListFilters
): Promise<PostListResponse> {
  const { category, page, perPage, search, sort, status } = filters;
  const { direction, field } = splitPostSort(sort);
  const trimmedSearch = search.trim();
  const where = {
    workspaceId,
    ...(category !== "all" && { categoryId: category }),
    ...(status !== "all" && { status }),
    ...(trimmedSearch && {
      title: {
        contains: trimmedSearch,
        mode: "insensitive" as const,
      },
    }),
  };

  const hasFilters = Boolean(
    category !== "all" || status !== "all" || trimmedSearch
  );
  const [posts, totalCount, workspacePostCount] = await Promise.all([
    db.post.findMany({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        title: true,
        coverImage: true,
        status: true,
        featured: true,
        publishedAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        authors: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: [{ [field]: direction }, { id: direction }],
    }),
    db.post.count({ where }),
    hasFilters ? db.post.count({ where: { workspaceId } }) : null,
  ]);

  return {
    hasAnyPosts:
      workspacePostCount === null ? totalCount > 0 : workspacePostCount > 0,
    pageCount: Math.max(1, Math.ceil(totalCount / perPage)),
    posts,
    totalCount,
  };
}
