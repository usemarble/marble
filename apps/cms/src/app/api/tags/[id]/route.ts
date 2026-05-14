import { db } from "@marble/db";
import { toTagPayload, withChanges } from "@marble/events";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { invalidateCache } from "@/lib/cache/invalidate";
import { emitDashboardEvent, logDashboardEventError } from "@/lib/events/fire";
import { tagSchema } from "@/lib/validations/workspace";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionData = await getServerSession();
  const workspaceId = sessionData?.session.activeOrganizationId;

  if (!sessionData || !workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const json = await req.json();
  const body = tagSchema.parse(json);

  const existing = await db.tag.findFirst({
    where: { id, workspaceId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  const existingTagWithSlug = await db.tag.findFirst({
    where: {
      slug: body.slug,
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
      name: body.name,
      slug: body.slug,
      description: body.description,
    },
  });

  await emitDashboardEvent({
    type: "tag_updated",
    workspaceId,
    resourceType: "tag",
    resourceId: updatedTag.id,
    actorId: sessionData.user.id,
    payload: withChanges(toTagPayload(updatedTag), Object.keys(body)),
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
  const sessionData = await getServerSession();
  const workspaceId = sessionData?.session.activeOrganizationId;
  if (!sessionData || !workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
