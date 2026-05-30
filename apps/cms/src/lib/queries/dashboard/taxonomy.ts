import "server-only";

import { db } from "@marble/db";
import type { Category, Tag } from "@/types/dashboard";

export async function getDashboardCategories(
  workspaceId: string
): Promise<Category[]> {
  const categories = await db.category.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      _count: {
        select: {
          posts: true,
        },
      },
    },
  });

  return categories.map(({ _count, ...category }) => ({
    ...category,
    postsCount: _count.posts,
  }));
}

export async function getDashboardTags(workspaceId: string): Promise<Tag[]> {
  const tags = await db.tag.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      _count: {
        select: {
          posts: true,
        },
      },
    },
  });

  return tags.map(({ _count, ...tag }) => ({
    ...tag,
    postsCount: _count.posts,
  }));
}
