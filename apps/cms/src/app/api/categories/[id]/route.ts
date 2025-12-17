import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { categorySchema } from "@/lib/validations/workspace";
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

  dispatchWebhooks({
    workspaceId,
    validationEvent: "category_updated",
    deliveryEvent: "category.updated",
    payload: {
      id: updatedCategory.id,
      slug: updatedCategory.slug,
      userId: sessionData.user.id,
    },
  }).catch((error) => {
    console.error(
      `[CategoryUpdate] Failed to dispatch webhooks: categoryId=${updatedCategory.id}`,
      error
    );
  });

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
    select: { slug: true },
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

    // Fire and forget - don't block response
    dispatchWebhooks({
      workspaceId,
      validationEvent: "category_deleted",
      deliveryEvent: "category.deleted",
      payload: { id, slug: category.slug, userId: sessionData.user.id },
    }).catch((error) => {
      console.error(
        `[CategoryDelete] Failed to dispatch webhooks: categoryId=${id}`,
        error
      );
    });

    return new NextResponse(null, { status: 204 });
  } catch (_e) {
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
