import { db } from "@marble/drizzle";
import { tag as tagTable } from "@marble/drizzle/schema";
import { toTagPayload, withChanges } from "@marble/events";
import { and, eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import { invalidateCache } from "@/lib/cache/invalidate";
import {
  emitDashboardEvent,
  logDashboardEventError,
} from "@/lib/queues/events";
import { tagSchema } from "@/lib/validations/workspace";

async function parseTagRequest(req: Request) {
  try {
    return tagSchema.safeParse(await req.json());
  } catch {
    return tagSchema.safeParse(null);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { sessionData, workspaceId } = accessData;

  const { id } = await params;

  const body = await parseTagRequest(req);

  if (!body.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: body.error.issues },
      { status: 400 }
    );
  }

  const tag = await db.query.tag.findFirst({
    where: and(eq(tagTable.id, id), eq(tagTable.workspaceId, workspaceId)),
    columns: { id: true },
  });

  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  const tagWithSlug = await db.query.tag.findFirst({
    where: and(
      eq(tagTable.slug, body.data.slug),
      eq(tagTable.workspaceId, workspaceId),
      ne(tagTable.id, id)
    ),
  });

  if (tagWithSlug) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }

  const [updatedTag] = await db
    .update(tagTable)
    .set({
      name: body.data.name,
      slug: body.data.slug,
      description: body.data.description,
      updatedAt: new Date(),
    })
    .where(and(eq(tagTable.id, id), eq(tagTable.workspaceId, workspaceId)))
    .returning();

  if (!updatedTag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  await emitDashboardEvent({
    type: "tag_updated",
    workspaceId,
    resourceType: "tag",
    resourceId: updatedTag.id,
    actorId: sessionData.user.id,
    payload: withChanges(toTagPayload(updatedTag), Object.keys(body.data)),
  }).catch(logDashboardEventError);

  invalidateCache(workspaceId, "tags");
  invalidateCache(workspaceId, "posts");

  return NextResponse.json(updatedTag, { status: 200 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { sessionData, workspaceId } = accessData;

  const { id } = await params;

  const tag = await db.query.tag.findFirst({
    where: and(eq(tagTable.id, id), eq(tagTable.workspaceId, workspaceId)),
    columns: { id: true, name: true, slug: true, description: true },
  });

  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  try {
    await db
      .delete(tagTable)
      .where(and(eq(tagTable.id, id), eq(tagTable.workspaceId, workspaceId)));

    await emitDashboardEvent({
      type: "tag_deleted",
      workspaceId,
      resourceType: "tag",
      resourceId: id,
      actorId: sessionData.user.id,
      payload: toTagPayload(tag),
    }).catch(logDashboardEventError);

    invalidateCache(workspaceId, "tags");
    invalidateCache(workspaceId, "posts");

    return new NextResponse(null, { status: 204 });
  } catch (_e) {
    return NextResponse.json(
      { error: "Failed to delete tag" },
      { status: 500 }
    );
  }
}
