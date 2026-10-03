import { createRecordId } from "@marble/db/id";
import { category, post } from "@marble/db/schema";
import { toCategoryPayload, withChanges } from "@marble/events";
import { and, eq, ne, sql } from "drizzle-orm";
import type { ServiceContext } from "../context";
import { categorySchema } from "../lib/taxonomy-validation";
import { transact } from "../lib/transaction";

export class CategoryError extends Error {
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

function parseCategory(input: unknown) {
  const body = categorySchema.safeParse(input);
  if (!body.success) {
    throw new CategoryError(400, "Invalid request body", {
      details: body.error.issues,
    });
  }
  return body.data;
}

export async function listCategories(ctx: ServiceContext, workspaceId: string) {
  const categories = await ctx.db
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

export async function createCategory(
  ctx: ServiceContext,
  workspaceId: string,
  actor: { id: string },
  input: unknown
) {
  const values = parseCategory(input);
  const existing = await ctx.db.query.category.findFirst({
    where: and(
      eq(category.slug, values.slug),
      eq(category.workspaceId, workspaceId)
    ),
  });
  if (existing) {
    throw new CategoryError(409, "Slug already in use");
  }
  return transact(ctx, async ({ tx, emitEvent, invalidate }) => {
    const [created] = await tx
      .insert(category)
      .values({
        id: createRecordId(),
        name: values.name,
        slug: values.slug,
        description: values.description,
        workspaceId,
        updatedAt: new Date(),
      })
      .returning();
    if (!created) {
      throw new CategoryError(500, "Failed to create category");
    }
    await emitEvent({
      type: "category_created",
      workspaceId,
      source: "dashboard",
      resourceType: "category",
      resourceId: created.id,
      actorType: "user",
      actorId: actor.id,
      payload: toCategoryPayload(created),
    });
    invalidate(workspaceId, "categories");
    return created;
  });
}

export async function updateCategory(
  ctx: ServiceContext,
  workspaceId: string,
  id: string,
  actor: { id: string },
  input: unknown
) {
  const values = parseCategory(input);
  const existingSlug = await ctx.db.query.category.findFirst({
    where: and(
      eq(category.slug, values.slug),
      eq(category.workspaceId, workspaceId),
      ne(category.id, id)
    ),
  });
  if (existingSlug) {
    throw new CategoryError(409, "Slug already in use");
  }
  return transact(ctx, async ({ tx, emitEvent, invalidate }) => {
    const [updated] = await tx
      .update(category)
      .set({
        name: values.name,
        slug: values.slug,
        description: values.description,
        updatedAt: new Date(),
      })
      .where(and(eq(category.id, id), eq(category.workspaceId, workspaceId)))
      .returning();
    if (!updated) {
      throw new Error("Record to update not found.");
    }
    await emitEvent({
      type: "category_updated",
      workspaceId,
      source: "dashboard",
      resourceType: "category",
      resourceId: updated.id,
      actorType: "user",
      actorId: actor.id,
      payload: withChanges(toCategoryPayload(updated), Object.keys(values)),
    });
    invalidate(workspaceId, "categories");
    return updated;
  });
}

export async function deleteCategory(
  ctx: ServiceContext,
  workspaceId: string,
  id: string,
  actor: { id: string }
) {
  const existing = await ctx.db.query.category.findFirst({
    where: and(eq(category.id, id), eq(category.workspaceId, workspaceId)),
    columns: { id: true, name: true, slug: true, description: true },
  });
  if (!existing) {
    throw new CategoryError(404, "Category not found");
  }
  const postsWithCategory = await ctx.db.query.post.findFirst({
    where: and(eq(post.categoryId, id), eq(post.workspaceId, workspaceId)),
    columns: { id: true },
  });
  if (postsWithCategory) {
    throw new CategoryError(400, "Category is associated with existing posts");
  }
  try {
    await transact(ctx, async ({ tx, emitEvent, invalidate }) => {
      await tx
        .delete(category)
        .where(and(eq(category.id, id), eq(category.workspaceId, workspaceId)));
      await emitEvent({
        type: "category_deleted",
        workspaceId,
        source: "dashboard",
        resourceType: "category",
        resourceId: id,
        actorType: "user",
        actorId: actor.id,
        payload: toCategoryPayload(existing),
      });
      invalidate(workspaceId, "categories");
    });
  } catch {
    throw new CategoryError(500, "Failed to delete category");
  }
}
