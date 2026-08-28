import { db } from "@marble/drizzle";
import { category as categoryTable, post } from "@marble/drizzle/schema";
import { toCategoryPayload, withChanges } from "@marble/events";
import { and, eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import { invalidateCache } from "@/lib/cache/invalidate";
import {
  emitDashboardEvent,
  logDashboardEventError,
} from "@/lib/queues/events";
import { categorySchema } from "@/lib/validations/workspace";

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

  const json = await req.json();
  const body = categorySchema.safeParse(json);

  if (!body.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: body.error.issues },
      { status: 400 }
    );
  }

  const categoryWithSlug = await db.query.category.findFirst({
    where: and(
      eq(categoryTable.slug, body.data.slug),
      eq(categoryTable.workspaceId, workspaceId),
      ne(categoryTable.id, id)
    ),
  });

  if (categoryWithSlug) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }

  const [updatedCategory] = await db
    .update(categoryTable)
    .set({
      name: body.data.name,
      slug: body.data.slug,
      description: body.data.description,
      updatedAt: new Date(),
    })
    .where(and(eq(categoryTable.id, id), eq(categoryTable.workspaceId, workspaceId)))
    .returning();

  if (!updatedCategory) {
    throw new Error("Record to update not found.");
  }

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

  invalidateCache(workspaceId, "categories");
  invalidateCache(workspaceId, "posts");

  return NextResponse.json(updatedCategory, { status: 200 });
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

  const category = await db.query.category.findFirst({
    where: and(eq(categoryTable.id, id), eq(categoryTable.workspaceId, workspaceId)),
    columns: { id: true, name: true, slug: true, description: true },
  });

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const postsWithCategory = await db.query.post.findFirst({
    where: and(eq(post.categoryId, id), eq(post.workspaceId, workspaceId)),
    columns: { id: true },
  });

  if (postsWithCategory) {
    return NextResponse.json(
      { error: "Category is associated with existing posts" },
      { status: 400 }
    );
  }

  try {
    await db
      .delete(categoryTable)
      .where(and(eq(categoryTable.id, id), eq(categoryTable.workspaceId, workspaceId)));

    await emitDashboardEvent({
      type: "category_deleted",
      workspaceId,
      resourceType: "category",
      resourceId: id,
      actorId: sessionData.user.id,
      payload: toCategoryPayload(category),
    }).catch(logDashboardEventError);

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
