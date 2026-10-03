import { createRecordId } from "@marble/db/id";
import { postToTag, tag } from "@marble/db/schema";
import { toTagPayload, withChanges } from "@marble/events";
import { and, eq, ne, sql } from "drizzle-orm";
import type { ServiceContext } from "../context";
import { tagSchema } from "../lib/taxonomy-validation";
import { transact } from "../lib/transaction";

export class TagError extends Error {
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

function parseTag(input: unknown) {
  const body = tagSchema.safeParse(input);
  if (!body.success) {
    throw new TagError(400, "Invalid request body", {
      details: body.error.issues,
    });
  }
  return body.data;
}

export async function listTags(ctx: ServiceContext, workspaceId: string) {
  const tags = await ctx.db
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

export async function createTag(
  ctx: ServiceContext,
  workspaceId: string,
  actor: { id: string },
  input: unknown
) {
  const values = parseTag(input);
  const existing = await ctx.db.query.tag.findFirst({
    where: and(eq(tag.slug, values.slug), eq(tag.workspaceId, workspaceId)),
  });
  if (existing) {
    throw new TagError(409, "Slug already in use");
  }
  return transact(ctx, async ({ tx, emitEvent, invalidate }) => {
    const [created] = await tx
      .insert(tag)
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
      throw new TagError(500, "Failed to create tag");
    }
    await emitEvent({
      type: "tag_created",
      workspaceId,
      source: "dashboard",
      resourceType: "tag",
      resourceId: created.id,
      actorType: "user",
      actorId: actor.id,
      payload: toTagPayload(created),
    });
    invalidate(workspaceId, "tags");
    return created;
  });
}

export async function updateTag(
  ctx: ServiceContext,
  workspaceId: string,
  id: string,
  actor: { id: string },
  input: unknown
) {
  const values = parseTag(input);
  const existing = await ctx.db.query.tag.findFirst({
    where: and(eq(tag.id, id), eq(tag.workspaceId, workspaceId)),
    columns: { id: true },
  });
  if (!existing) {
    throw new TagError(404, "Tag not found");
  }
  const existingSlug = await ctx.db.query.tag.findFirst({
    where: and(
      eq(tag.slug, values.slug),
      eq(tag.workspaceId, workspaceId),
      ne(tag.id, id)
    ),
  });
  if (existingSlug) {
    throw new TagError(409, "Slug already in use");
  }
  return transact(ctx, async ({ tx, emitEvent, invalidate }) => {
    const [updated] = await tx
      .update(tag)
      .set({
        name: values.name,
        slug: values.slug,
        description: values.description,
        updatedAt: new Date(),
      })
      .where(and(eq(tag.id, id), eq(tag.workspaceId, workspaceId)))
      .returning();
    if (!updated) {
      throw new TagError(404, "Tag not found");
    }
    await emitEvent({
      type: "tag_updated",
      workspaceId,
      source: "dashboard",
      resourceType: "tag",
      resourceId: updated.id,
      actorType: "user",
      actorId: actor.id,
      payload: withChanges(toTagPayload(updated), Object.keys(values)),
    });
    invalidate(workspaceId, "tags");
    return updated;
  });
}

export async function deleteTag(
  ctx: ServiceContext,
  workspaceId: string,
  id: string,
  actor: { id: string }
) {
  const existing = await ctx.db.query.tag.findFirst({
    where: and(eq(tag.id, id), eq(tag.workspaceId, workspaceId)),
    columns: { id: true, name: true, slug: true, description: true },
  });
  if (!existing) {
    throw new TagError(404, "Tag not found");
  }
  try {
    await transact(ctx, async ({ tx, emitEvent, invalidate }) => {
      await tx
        .delete(tag)
        .where(and(eq(tag.id, id), eq(tag.workspaceId, workspaceId)));
      await emitEvent({
        type: "tag_deleted",
        workspaceId,
        source: "dashboard",
        resourceType: "tag",
        resourceId: id,
        actorType: "user",
        actorId: actor.id,
        payload: toTagPayload(existing),
      });
      invalidate(workspaceId, "tags");
    });
  } catch {
    throw new TagError(500, "Failed to delete tag");
  }
}
