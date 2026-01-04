import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { invalidateCache } from "@/lib/cache/invalidate";
import { tagSchema } from "@/lib/validations/workspace";
import { dispatchWebhooks } from "@/lib/webhooks/dispatcher";

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
  const body = tagSchema.safeParse(json);

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

  dispatchWebhooks({
    workspaceId,
    validationEvent: "tag_updated",
    deliveryEvent: "tag.updated",
    payload: {
      id: updatedTag.id,
      slug: updatedTag.slug,
      userId: sessionData.user.id,
    },
  }).catch((error) => {
    console.error(
      `[TagUpdate] Failed to dispatch webhooks: tagId=${updatedTag.id}`,
      error
    );
  });

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
    select: { slug: true },
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

    // Fire and forget - don't block response
    dispatchWebhooks({
      workspaceId,
      validationEvent: "tag_deleted",
      deliveryEvent: "tag.deleted",
      payload: { id, slug: tag.slug, userId: sessionData.user.id },
    }).catch((error) => {
      console.error(
        `[TagDelete] Failed to dispatch webhooks: tagId=${id}`,
        error
      );
    });

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
