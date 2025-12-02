import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
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

    return new NextResponse(null, { status: 204 });
  } catch (_e) {
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
