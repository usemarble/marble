import "server-only";

import { db } from "@marble/drizzle";
import { post } from "@marble/drizzle/schema";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  type SQL,
} from "drizzle-orm";
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

const postSortColumns = {
  createdAt: post.createdAt,
  publishedAt: post.publishedAt,
  updatedAt: post.updatedAt,
  title: post.title,
} as const;

export function splitPostSort(sort: string) {
  const [field = "createdAt", direction = "desc"] = sort.split("_");
  return {
    field: POST_SORT_FIELDS.has(field) ? field : "createdAt",
    direction: direction === "asc" ? "asc" : "desc",
  } as const;
}

function buildPostFilters(
  workspaceId: string,
  filters: Pick<PostListFilters, "category" | "search" | "status">
): SQL | undefined {
  const trimmedSearch = filters.search.trim();
  const conditions: SQL[] = [eq(post.workspaceId, workspaceId)];

  if (filters.category !== "all") {
    conditions.push(eq(post.categoryId, filters.category));
  }

  if (filters.status !== "all") {
    conditions.push(eq(post.status, filters.status));
  }

  if (trimmedSearch) {
    conditions.push(ilike(post.title, `%${trimmedSearch}%`));
  }

  return and(...conditions);
}

export async function getDashboardPosts(
  workspaceId: string,
  filters: PostListFilters
): Promise<PostListResponse> {
  const { category, page, perPage, search, sort, status } = filters;
  const { direction, field } = splitPostSort(sort);
  const trimmedSearch = search.trim();
  const where = buildPostFilters(workspaceId, { category, search, status });

  const hasFilters = Boolean(
    category !== "all" || status !== "all" || trimmedSearch
  );

  const sortColumn =
    postSortColumns[field as keyof typeof postSortColumns] ??
    postSortColumns.createdAt;
  const orderBy =
    direction === "asc"
      ? [asc(sortColumn), asc(post.id)]
      : [desc(sortColumn), desc(post.id)];

  const [rows, totalCountResult, workspacePostCountResult] = await Promise.all([
    db.query.post.findMany({
      where,
      columns: {
        id: true,
        title: true,
        coverImage: true,
        status: true,
        featured: true,
        publishedAt: true,
        updatedAt: true,
      },
      with: {
        category: {
          columns: {
            id: true,
            name: true,
          },
        },
        authors: {
          with: {
            author: {
              columns: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy,
      limit: perPage,
      offset: (page - 1) * perPage,
    }),
    db.select({ count: count() }).from(post).where(where),
    hasFilters
      ? db
          .select({ count: count() })
          .from(post)
          .where(eq(post.workspaceId, workspaceId))
      : null,
  ]);

  const totalCount = totalCountResult[0]?.count ?? 0;
  const workspacePostCount = workspacePostCountResult?.[0]?.count ?? null;

  const posts: Post[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    coverImage: row.coverImage,
    status: row.status,
    featured: row.featured,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
    category: row.category,
    authors: row.authors.map((entry) => entry.author),
  }));

  return {
    hasAnyPosts:
      workspacePostCount === null ? totalCount > 0 : workspacePostCount > 0,
    pageCount: Math.max(1, Math.ceil(totalCount / perPage)),
    posts,
    totalCount,
  };
}
