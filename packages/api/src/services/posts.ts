import { createRecordId } from "@marble/db/id";
import {
  author,
  category,
  field,
  fieldOption,
  fieldValue,
  post,
  postToAuthor,
  postToTag,
  tag,
} from "@marble/db/schema";
import { toPostPayload, withChanges } from "@marble/events";
import { generateSlug } from "@marble/utils";
import { sanitizeHtml } from "@marble/utils/sanitize";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  ne,
  type SQL,
} from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import type { ServiceContext } from "../context";
import {
  customFieldsPayloadSchema,
  resolveCustomFieldValues,
} from "../lib/custom-fields";
import {
  type PostUpsertValues,
  postUpsertSchema,
} from "../lib/post-validation";
import { transact } from "../lib/transaction";
import { buildCustomFieldWrites, writeCustomFieldValues } from "./post-fields";

export interface PostListFilters {
  category: string;
  page: number;
  perPage: number;
  search: string;
  sort: string;
  status: "all" | "published" | "draft";
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

export async function listPosts(
  ctx: ServiceContext,
  workspaceId: string,
  filters: PostListFilters
) {
  const { db } = ctx;
  if (!z.number().int().min(1).safeParse(filters.page).success) {
    throw new PostError(400, "Invalid page");
  }
  if (!z.number().int().min(1).max(100).safeParse(filters.perPage).success) {
    throw new PostError(400, "Invalid perPage");
  }
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

  const posts = rows.map((row) => ({
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

/** Dashboard error behavior, translated to oRPC by the router. */
export class PostError extends Error {
  readonly status: 400 | 404 | 409 | 500;
  readonly data?: Record<string, unknown>;

  constructor(
    status: 400 | 404 | 409 | 500,
    message: string,
    data?: Record<string, unknown>
  ) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export interface PostActor {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

function parsePost(input: unknown): PostUpsertValues {
  const result = postUpsertSchema.safeParse(input);
  if (!result.success) {
    throw new PostError(400, "Invalid request body", {
      details: result.error.issues,
    });
  }
  return result.data;
}

async function validateWorkspaceTags(
  ctx: ServiceContext,
  workspaceId: string,
  tagIds: string[] | undefined
) {
  const uniqueTagIds = Array.from(new Set(tagIds ?? []));
  if (uniqueTagIds.length) {
    const valid = await ctx.db
      .select({ id: tag.id })
      .from(tag)
      .where(
        and(inArray(tag.id, uniqueTagIds), eq(tag.workspaceId, workspaceId))
      );
    if (valid.length !== uniqueTagIds.length) {
      throw new PostError(
        400,
        "One or more tags are invalid for this workspace."
      );
    }
  }
  return uniqueTagIds;
}

export async function getPost(
  ctx: ServiceContext,
  workspaceId: string,
  id: string
) {
  const { db } = ctx;
  const postRow = await db.query.post.findFirst({
    where: and(eq(post.id, id), eq(post.workspaceId, workspaceId)),
    columns: {
      id: true,
      slug: true,
      title: true,
      status: true,
      featured: true,
      content: true,
      coverImage: true,
      description: true,
      publishedAt: true,
      contentJson: true,
      categoryId: true,
    },
  });

  if (!postRow) {
    throw new PostError(404, "Post not found");
  }

  const [tagLinks, authorLinks] = await Promise.all([
    db.select({ id: postToTag.b }).from(postToTag).where(eq(postToTag.a, id)),
    db
      .select({ id: postToAuthor.a })
      .from(postToAuthor)
      .where(eq(postToAuthor.b, id)),
  ]);

  const structuredData = {
    slug: postRow.slug,
    title: postRow.title,
    status: postRow.status,
    featured: postRow.featured,
    content: postRow.content,
    coverImage: postRow.coverImage,
    description: postRow.description,
    publishedAt: postRow.publishedAt,
    contentJson: JSON.stringify(postRow.contentJson),
    tags: tagLinks.map((tag) => tag.id),
    category: postRow.categoryId,
    authors: authorLinks.map((authorRow) => authorRow.id),
  };

  return structuredData;
}

function customFieldFailure(data: Record<string, unknown>) {
  return new PostError(400, String(data.error), data);
}

export async function createPost(
  ctx: ServiceContext,
  workspaceId: string,
  actor: PostActor,
  input: unknown
) {
  const { db } = ctx;
  const values = parsePost(input);
  const existingPost = await db.query.post.findFirst({
    where: and(eq(post.slug, values.slug), eq(post.workspaceId, workspaceId)),
  });

  if (existingPost) {
    throw new PostError(409, "Slug already in use");
  }

  let primaryAuthor = await db.query.author.findFirst({
    where: and(
      eq(author.workspaceId, workspaceId),
      eq(author.userId, actor.id)
    ),
  });

  if (!primaryAuthor) {
    primaryAuthor = await db.query.author.findFirst({
      where: eq(author.workspaceId, workspaceId),
      orderBy: asc(author.createdAt),
    });
  }

  if (!primaryAuthor) {
    try {
      const baseSlug = generateSlug(actor.name || "user");
      const uniqueSlug = `${baseSlug}-${nanoid(6)}`;
      const now = new Date();

      const [createdAuthor] = await transact(ctx, ({ tx }) =>
        tx
          .insert(author)
          .values({
            id: createRecordId(),
            name: actor.name || "Member",
            email: actor.email,
            slug: uniqueSlug,
            image: actor.image,
            workspaceId,
            userId: actor.id,
            role: "Writer",
            updatedAt: now,
          })
          .returning()
      );

      primaryAuthor = createdAuthor;
    } catch (error) {
      ctx.log.error(error instanceof Error ? error : new Error(String(error)));
      throw new PostError(500, "Failed to create author profile for post");
    }
  }

  if (!primaryAuthor) {
    throw new PostError(500, "Failed to create author profile for post");
  }

  const resolvedPrimaryAuthor = primaryAuthor;

  const contentJson = JSON.parse(values.contentJson);
  const cleanContent = sanitizeHtml(values.content);

  const uniqueTagIds = await validateWorkspaceTags(
    ctx,
    workspaceId,
    values.tags
  );

  if (values.category) {
    const categoryRow = await db.query.category.findFirst({
      where: and(
        eq(category.id, values.category),
        eq(category.workspaceId, workspaceId)
      ),
    });

    if (!categoryRow) {
      throw new PostError(400, "Invalid category provided");
    }
  }

  const authorIds = values.authors || [resolvedPrimaryAuthor.id];
  const validAuthors = await db.query.author.findMany({
    where: and(
      inArray(author.id, authorIds),
      eq(author.workspaceId, workspaceId)
    ),
  });

  if (validAuthors.length === 0) {
    throw new PostError(400, "No valid authors found");
  }

  try {
    const postCreated = await transact(
      ctx,
      async ({ tx, emitEvent, invalidate }) => {
        const postId = createRecordId();
        const now = new Date();

        const [createdPost] = await tx
          .insert(post)
          .values({
            id: postId,
            primaryAuthorId: resolvedPrimaryAuthor.id,
            contentJson,
            slug: values.slug,
            title: values.title,
            status: values.status,
            featured: values.featured,
            content: cleanContent,
            categoryId: values.category,
            coverImage: values.coverImage,
            publishedAt: values.publishedAt,
            description: values.description,
            workspaceId,
            updatedAt: now,
          })
          .returning();

        if (!createdPost) {
          throw new Error("Failed to create post");
        }

        if (uniqueTagIds.length > 0) {
          await tx.insert(postToTag).values(
            uniqueTagIds.map((tagId) => ({
              a: createdPost.id,
              b: tagId,
            }))
          );
        }

        await tx.insert(postToAuthor).values(
          validAuthors.map((authorRow) => ({
            a: authorRow.id,
            b: createdPost.id,
          }))
        );

        const customFieldWrites = await buildCustomFieldWrites(
          db,
          workspaceId,
          values.customFields
        );

        if (!customFieldWrites.success) {
          throw customFieldFailure(customFieldWrites.error);
        }

        await writeCustomFieldValues(
          tx,
          workspaceId,
          createdPost.id,
          customFieldWrites
        );

        await emitEvent({
          type:
            createdPost.status === "published"
              ? "post_published"
              : "post_created",
          workspaceId,
          source: "dashboard",
          resourceType: "post",
          resourceId: createdPost.id,
          actorType: "user",
          actorId: actor.id,
          payload: toPostPayload(createdPost),
        });
        invalidate(workspaceId, "posts");
        return createdPost;
      }
    );

    return { id: postCreated.id };
  } catch (error) {
    if (error instanceof PostError) {
      throw error;
    }
    ctx.log.error(error instanceof Error ? error : new Error(String(error)));
    throw new PostError(500, "Failed to create post");
  }
}

export async function updatePost(
  ctx: ServiceContext,
  workspaceId: string,
  id: string,
  actor: PostActor,
  input: unknown
) {
  const { db } = ctx;
  const values = parsePost(input);
  const postWithSlug = await db.query.post.findFirst({
    where: and(
      eq(post.slug, values.slug),
      eq(post.workspaceId, workspaceId),
      ne(post.id, id)
    ),
  });

  if (postWithSlug) {
    throw new PostError(409, "Slug already in use");
  }

  const contentJson = JSON.parse(values.contentJson);
  const cleanContent = sanitizeHtml(values.content);

  const uniqueTagIds = await validateWorkspaceTags(
    ctx,
    workspaceId,
    values.tags
  );

  if (values.category) {
    const categoryRow = await db.query.category.findFirst({
      where: and(
        eq(category.id, values.category),
        eq(category.workspaceId, workspaceId)
      ),
    });

    if (!categoryRow) {
      throw new PostError(400, "Invalid category provided");
    }
  }

  const authorIds = values.authors ?? [];

  const validAuthors = await db.query.author.findMany({
    where: and(
      inArray(author.id, authorIds),
      eq(author.workspaceId, workspaceId)
    ),
  });

  if (validAuthors.length === 0) {
    throw new PostError(400, "No valid authors found");
  }

  const primaryAuthor = validAuthors[0];

  if (!primaryAuthor) {
    throw new PostError(500, "Unable to determine primary author");
  }

  const previousPost = await db.query.post.findFirst({
    where: and(eq(post.id, id), eq(post.workspaceId, workspaceId)),
    columns: { status: true },
  });

  if (!previousPost) {
    throw new PostError(404, "Post not found");
  }

  try {
    const customFieldWrites = await buildCustomFieldWrites(
      db,
      workspaceId,
      values.customFields
    );

    if (!customFieldWrites.success) {
      throw customFieldFailure(customFieldWrites.error);
    }

    const postUpdated = await transact(
      ctx,
      async ({ tx, emitEvent, invalidate }) => {
        const now = new Date();

        const [updatedPost] = await tx
          .update(post)
          .set({
            primaryAuthorId: primaryAuthor.id,
            contentJson,
            slug: values.slug,
            title: values.title,
            status: values.status,
            featured: values.featured,
            content: cleanContent,
            categoryId: values.category,
            coverImage: values.coverImage,
            description: values.description,
            publishedAt: values.publishedAt,
            workspaceId,
            updatedAt: now,
          })
          .where(and(eq(post.id, id), eq(post.workspaceId, workspaceId)))
          .returning();

        if (!updatedPost) {
          throw new Error("Post not found");
        }

        if (values.tags) {
          await tx.delete(postToTag).where(eq(postToTag.a, id));

          if (uniqueTagIds.length > 0) {
            await tx.insert(postToTag).values(
              uniqueTagIds.map((tagId) => ({
                a: id,
                b: tagId,
              }))
            );
          }
        }

        await tx.delete(postToAuthor).where(eq(postToAuthor.b, id));
        await tx.insert(postToAuthor).values(
          validAuthors.map((authorRow) => ({
            a: authorRow.id,
            b: id,
          }))
        );

        await writeCustomFieldValues(tx, workspaceId, id, customFieldWrites);

        const eventType =
          previousPost.status !== "published" &&
          updatedPost.status === "published"
            ? "post_published"
            : previousPost.status === "published" &&
                updatedPost.status !== "published"
              ? "post_unpublished"
              : "post_updated";
        const payload =
          eventType === "post_updated"
            ? withChanges(toPostPayload(updatedPost), Object.keys(values))
            : toPostPayload(updatedPost);
        await emitEvent({
          type: eventType,
          workspaceId,
          source: "dashboard",
          resourceType: "post",
          resourceId: updatedPost.id,
          actorType: "user",
          actorId: actor.id,
          payload,
        });
        invalidate(workspaceId, "posts");
        return updatedPost;
      }
    );
    return { id: postUpdated.id };
  } catch (error) {
    if (error instanceof PostError) {
      throw error;
    }
    ctx.log.error(error instanceof Error ? error : new Error(String(error)));
    throw new PostError(500, "Failed to update post");
  }
}

export async function deletePost(
  ctx: ServiceContext,
  workspaceId: string,
  id: string,
  actor: PostActor
) {
  try {
    return await transact(ctx, async ({ tx, emitEvent, invalidate }) => {
      const [deletedPost] = await tx
        .delete(post)
        .where(and(eq(post.id, id), eq(post.workspaceId, workspaceId)))
        .returning();
      if (!deletedPost) {
        throw new PostError(404, "Post not found");
      }
      await emitEvent({
        type: "post_deleted",
        workspaceId,
        source: "dashboard",
        resourceType: "post",
        resourceId: id,
        actorType: "user",
        actorId: actor.id,
        payload: toPostPayload(deletedPost),
      });
      invalidate(workspaceId, "posts");
      return { id: deletedPost.id };
    });
  } catch (error) {
    if (error instanceof PostError) {
      throw error;
    }
    throw new PostError(500, "Failed to delete post");
  }
}

function fieldDto(
  entry: typeof field.$inferSelect & {
    options: (typeof fieldOption.$inferSelect)[];
  }
) {
  return {
    id: entry.id,
    name: entry.name,
    description: entry.description,
    key: entry.key,
    type: entry.type,
    required: entry.required,
    position: entry.position,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    options: entry.options.map((option) => ({
      id: option.id,
      fieldId: option.fieldId,
      workspaceId: option.workspaceId,
      value: option.value,
      label: option.label,
      position: option.position,
      createdAt: option.createdAt.toISOString(),
      updatedAt: option.updatedAt.toISOString(),
    })),
  };
}

async function fieldDefinitions(ctx: ServiceContext, workspaceId: string) {
  return ctx.db.query.field.findMany({
    where: eq(field.workspaceId, workspaceId),
    with: {
      options: {
        orderBy: [asc(fieldOption.position), asc(fieldOption.createdAt)],
      },
    },
    orderBy: [asc(field.position), asc(field.createdAt)],
  });
}

/** Definitions for the new-post editor, matching its old /api/fields read. */
export async function listPostFields(ctx: ServiceContext, workspaceId: string) {
  const [fields, valueCounts] = await Promise.all([
    fieldDefinitions(ctx, workspaceId),
    ctx.db
      .select({ fieldId: fieldValue.fieldId, count: count() })
      .from(fieldValue)
      .where(eq(fieldValue.workspaceId, workspaceId))
      .groupBy(fieldValue.fieldId),
  ]);
  const valueCountByFieldId = new Map(
    valueCounts.map((entry) => [entry.fieldId, entry.count])
  );
  return fields.map((entry) => ({
    ...fieldDto(entry),
    hasValues: (valueCountByFieldId.get(entry.id) ?? 0) > 0,
  }));
}

async function requirePost(
  ctx: ServiceContext,
  workspaceId: string,
  id: string
) {
  const row = await ctx.db.query.post.findFirst({
    where: and(eq(post.id, id), eq(post.workspaceId, workspaceId)),
    columns: { id: true },
  });
  if (!row) {
    throw new PostError(404, "Post not found");
  }
}

export async function getPostFields(
  ctx: ServiceContext,
  workspaceId: string,
  id: string
) {
  await requirePost(ctx, workspaceId, id);
  const [fields, values] = await Promise.all([
    fieldDefinitions(ctx, workspaceId),
    ctx.db.query.fieldValue.findMany({
      where: and(
        eq(fieldValue.postId, id),
        eq(fieldValue.workspaceId, workspaceId)
      ),
    }),
  ]);
  const valueMap: Record<string, string> = {};
  for (const value of values) {
    valueMap[value.fieldId] = value.value;
  }
  return { fields: fields.map(fieldDto), values: valueMap };
}

export async function updatePostFields(
  ctx: ServiceContext,
  workspaceId: string,
  id: string,
  actor: PostActor,
  input: unknown
) {
  await requirePost(ctx, workspaceId, id);
  const payload = customFieldsPayloadSchema.safeParse(input);
  if (!payload.success) {
    throw new PostError(400, "Invalid request body", {
      details: payload.error.issues,
    });
  }
  const fields = await ctx.db.query.field.findMany({
    where: eq(field.workspaceId, workspaceId),
    columns: { id: true, key: true, name: true, type: true, required: true },
    with: {
      options: {
        columns: { value: true, label: true },
        orderBy: [asc(fieldOption.position), asc(fieldOption.createdAt)],
      },
    },
  });
  const resolvedValues = resolveCustomFieldValues(fields, payload.data);
  if (!resolvedValues.success) {
    throw customFieldFailure(resolvedValues.error);
  }
  if (resolvedValues.values.length > 0) {
    // A custom-field change is a post change: /v1 serves the values, and
    // webhooks report it, as /v1's own update does.
    await transact(ctx, async ({ tx, emitEvent, invalidate }) => {
      await writeCustomFieldValues(tx, workspaceId, id, resolvedValues);
      const [updatedPost] = await tx
        .update(post)
        .set({ updatedAt: new Date() })
        .where(and(eq(post.id, id), eq(post.workspaceId, workspaceId)))
        .returning();
      if (!updatedPost) {
        throw new PostError(404, "Post not found");
      }
      await emitEvent({
        type: "post_updated",
        workspaceId,
        source: "dashboard",
        resourceType: "post",
        resourceId: id,
        actorType: "user",
        actorId: actor.id,
        payload: withChanges(toPostPayload(updatedPost), ["fields"]),
      });
      invalidate(workspaceId, "posts");
    });
  }
  return { success: true };
}
