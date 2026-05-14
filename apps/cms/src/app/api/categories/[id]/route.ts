import { db } from "@marble/db";
import { toCategoryPayload, withChanges } from "@marble/events";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { invalidateCache } from "@/lib/cache/invalidate";
import { emitDashboardEvent, logDashboardEventError } from "@/lib/events/fire";
import { categorySchema } from "@/lib/validations/workspace";

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
  const body = categorySchema.safeParse(json);

  if (!body.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: body.error.issues },
      { status: 400 }
    );
  }

  const existingCategoryWithSlug = await db.category.findFirst({
    where: {
      slug: body.data.slug,
      workspaceId,
      id: { not: id },
    },
  });

  if (existingCategoryWithSlug) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }

  const updatedCategory = await db.category.update({
    where: {
      id,
      workspaceId,
    },
    data: {
      name: body.data.name,
      slug: body.data.slug,
      description: body.data.description,
    },
  });

  await emitDashboardEvent({
    type: "category_updated",
    workspaceId,
    resourceType: "category",
    resourceId: updatedCategory.id,
    actorId: sessionData.user.id,
    payload: withChanges(
      toCategoryPayload(updatedCategory),
      Object.keys(body.data)
    ),
  }).catch(logDashboardEventError);

  // Invalidate cache for categories and posts (categories affect posts)
  invalidateCache(workspaceId, "categories");
  invalidateCache(workspaceId, "posts");

  return NextResponse.json(updatedCategory, { status: 200 });
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

  const category = await db.category.findFirst({
    where: { id, workspaceId },
    select: { id: true, name: true, slug: true, description: true },
  });

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const postsWithCategory = await db.post.findFirst({
    where: {
      categoryId: id,
      workspaceId,
    },
    select: { id: true },
  });

  if (postsWithCategory) {
    return NextResponse.json(
      { error: "Category is associated with existing posts" },
      { status: 400 }
    );
  }

  try {
    await db.category.delete({
      where: {
        id,
        workspaceId,
      },
    });

    await emitDashboardEvent({
      type: "category_deleted",
      workspaceId,
      resourceType: "category",
      resourceId: id,
      actorId: sessionData.user.id,
      payload: toCategoryPayload(category),
    }).catch(logDashboardEventError);

    // Invalidate cache for categories and posts (categories affect posts)
    invalidateCache(workspaceId, "categories");
    invalidateCache(workspaceId, "posts");

    return new NextResponse(null, { status: 204 });
  } catch (_e) {
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
