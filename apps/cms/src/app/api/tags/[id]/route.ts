import { db } from "@marble/db";
import { toTagPayload, withChanges } from "@marble/events";
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

  const existing = await db.tag.findFirst({
    where: { id, workspaceId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  const existingTagWithSlug = await db.tag.findFirst({
    where: {
      slug: body.data.slug,
      workspaceId,
      id: { not: id },
    },
  });

  if (existingTagWithSlug) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }

  const updatedTag = await db.tag.update({
    where: { id },
    data: {
      name: body.data.name,
      slug: body.data.slug,
      description: body.data.description,
    },
  });

  await emitDashboardEvent({
    type: "tag_updated",
    workspaceId,
    resourceType: "tag",
    resourceId: updatedTag.id,
    actorId: sessionData.user.id,
    payload: withChanges(toTagPayload(updatedTag), Object.keys(body.data)),
  }).catch(logDashboardEventError);

  // Invalidate cache for tags and posts (tags affect posts)
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

  const tag = await db.tag.findFirst({
    where: { id, workspaceId },
    select: { id: true, name: true, slug: true, description: true },
  });

  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  try {
    await db.tag.delete({
      where: {
        id,
        workspaceId,
      },
    });

    await emitDashboardEvent({
      type: "tag_deleted",
      workspaceId,
      resourceType: "tag",
      resourceId: id,
      actorId: sessionData.user.id,
      payload: toTagPayload(tag),
    }).catch(logDashboardEventError);

    // Invalidate cache for tags and posts (tags affect posts)
    invalidateCache(workspaceId, "tags");
    invalidateCache(workspaceId, "posts");

    return new NextResponse(null, { status: 204 });
  } catch (_e) {
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
