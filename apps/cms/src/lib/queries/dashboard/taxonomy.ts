import "server-only";

import { db } from "@marble/drizzle";
import { category, post, postToTag, tag } from "@marble/drizzle/schema";
import { eq, sql } from "@marble/drizzle/operators";
import type { Category, Tag } from "@/types/dashboard";

export async function getDashboardCategories(
  workspaceId: string
): Promise<Category[]> {
  const categories = await db
    .select({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      postsCount: sql<number>`cast(count(${post.id}) as int)`,
    })
    .from(category)
    .leftJoin(post, eq(post.categoryId, category.id))
    .where(eq(category.workspaceId, workspaceId))
    .groupBy(category.id);

  return categories.map(({ postsCount, ...entry }) => ({
    ...entry,
    postsCount,
  }));
}

export async function getDashboardTags(workspaceId: string): Promise<Tag[]> {
  const tags = await db
    .select({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      description: tag.description,
      postsCount: sql<number>`cast(count(${postToTag.a}) as int)`,
    })
    .from(tag)
    .leftJoin(postToTag, eq(postToTag.b, tag.id))
    .where(eq(tag.workspaceId, workspaceId))
    .groupBy(tag.id);

  return tags.map(({ postsCount, ...entry }) => ({
    ...entry,
    postsCount,
  }));
}
