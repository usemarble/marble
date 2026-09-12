import { z } from "@hono/zod-openapi";
import type { HyperdriveDb } from "@marble/db/hyperdrive";
import { category, post, postToTag, tag } from "@marble/db/schema";
import {
  and,
  eq,
  exists,
  ilike,
  inArray,
  not,
  or,
  type SQL,
  sql,
} from "drizzle-orm";

export function buildStatusFilter(
  status: "published" | "draft" | "all"
): SQL | undefined {
  if (status === "all") {
    return inArray(post.status, ["published", "draft"]);
  }

  return eq(post.status, status);
}

export interface PostsListFilterInput {
  categories: string[];
  excludeCategories: string[];
  tags: string[];
  excludeTags: string[];
  query?: string;
  featured?: string;
  status: "published" | "draft" | "all";
}

export function buildPostsListWhere(
  db: HyperdriveDb,
  workspaceId: string,
  filters: PostsListFilterInput
): SQL {
  const conditions: SQL[] = [eq(post.workspaceId, workspaceId)];

  const statusCondition = buildStatusFilter(filters.status);
  if (statusCondition) {
    conditions.push(statusCondition);
  }

  if (filters.categories.length > 0) {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(category)
          .where(
            and(
              eq(category.id, post.categoryId),
              inArray(category.slug, filters.categories)
            )
          )
      )
    );
  }

  if (filters.excludeCategories.length > 0) {
    conditions.push(
      not(
        exists(
          db
            .select({ one: sql`1` })
            .from(category)
            .where(
              and(
                eq(category.id, post.categoryId),
                inArray(category.slug, filters.excludeCategories)
              )
            )
        )
      )
    );
  }

  if (filters.tags.length > 0) {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(postToTag)
          .innerJoin(tag, eq(postToTag.b, tag.id))
          .where(and(eq(postToTag.a, post.id), inArray(tag.slug, filters.tags)))
      )
    );
  }

  if (filters.excludeTags.length > 0) {
    conditions.push(
      not(
        exists(
          db
            .select({ one: sql`1` })
            .from(postToTag)
            .innerJoin(tag, eq(postToTag.b, tag.id))
            .where(
              and(
                eq(postToTag.a, post.id),
                inArray(tag.slug, filters.excludeTags)
              )
            )
        )
      )
    );
  }

  if (filters.query) {
    conditions.push(
      or(
        ilike(post.title, `%${filters.query}%`),
        ilike(post.content, `%${filters.query}%`)
      ) as SQL
    );
  }

  if (filters.featured !== undefined) {
    conditions.push(eq(post.featured, filters.featured === "true"));
  }

  return and(...conditions) as SQL;
}

function castFieldValue(
  value: string,
  type: string
): string | number | boolean | string[] | null {
  switch (type) {
    case "number": {
      const num = Number.parseFloat(value);
      return Number.isNaN(num) ? null : num;
    }
    case "boolean":
      return value === "true";
    case "multiselect":
      try {
        return z.array(z.string()).parse(JSON.parse(value));
      } catch {
        return null;
      }
    default:
      return value;
  }
}

export function buildFieldsObject(
  fieldValues: Array<{
    value: string;
    field: { key: string; type: string };
  }>,
  allFields?: Array<{ key: string; type: string }>
): Record<string, string | number | boolean | string[] | null> {
  const result: Record<string, string | number | boolean | string[] | null> =
    {};

  if (allFields) {
    for (const fieldRow of allFields) {
      result[fieldRow.key] = null;
    }
  }

  for (const fieldValue of fieldValues) {
    result[fieldValue.field.key] = castFieldValue(
      fieldValue.value,
      fieldValue.field.type
    );
  }

  return result;
}
