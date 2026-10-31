import { z } from "@hono/zod-openapi";
import type { HyperdriveDb } from "@marble/db/hyperdrive";
import { category, post, postToTag, tag, workspace } from "@marble/db/schema";
import {
  type PostStatus,
  PUBLIC_POST_STATUSES,
} from "@marble/utils/post-status";
import { wallClockToInstant } from "@marble/utils/wall-clock";
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

export class SkippedLocalTime extends Error {
  readonly timeZone: string;

  constructor(timeZone: string) {
    super("Local time skipped for daylight saving");
    this.timeZone = timeZone;
  }
}

/**
 * The instant a `publishedAt` input means. A value with no zone is a time on
 * the workspace's clock, so only that form reads the workspace.
 */
export async function resolvePublishedAt(
  db: HyperdriveDb,
  workspaceId: string,
  value: string
): Promise<Date> {
  if (/[Z+-]/.test(value.slice(value.indexOf("T")))) {
    return new Date(value);
  }
  const row = await db.query.workspace.findFirst({
    where: eq(workspace.id, workspaceId),
    columns: { timezone: true },
  });
  if (!row) {
    throw new Error("Workspace not found");
  }
  const instant = wallClockToInstant(
    new Date(`${value}Z`).getTime(),
    row.timezone
  );
  if (!instant) {
    throw new SkippedLocalTime(row.timezone);
  }
  return instant;
}

export function buildStatusFilter(status: PostStatus | "all"): SQL | undefined {
  if (status === "all") {
    return inArray(post.status, PUBLIC_POST_STATUSES);
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
  status: PostStatus | "all";
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
