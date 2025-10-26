import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { categorySchema } from "@/lib/validations/workspace";
import { getWebhooks, WebhookClient } from "@/lib/webhooks/webhook-client";

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

  const categoryUpdated = await db.category.update({
    where: {
      id,
      workspaceId,
    },
    data: {
      name: body.data.name,
      slug: body.data.slug,
    },
  });

  const webhooks = getWebhooks(sessionData.session, "category_updated");

  for (const webhook of await webhooks) {
    const webhookClient = new WebhookClient({ secret: webhook.secret });
    await webhookClient.send({
      url: webhook.endpoint,
      event: "category.updated",
      data: {
        id: categoryUpdated.id,
        slug: categoryUpdated.slug,
        userId: sessionData.user.id,
      },
      format: webhook.format,
    });
  }

  return NextResponse.json(categoryUpdated, { status: 200 });
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

    const webhooks = getWebhooks(sessionData.session, "category_deleted");

    for (const webhook of await webhooks) {
      const webhookClient = new WebhookClient({ secret: webhook.secret });
      await webhookClient.send({
        url: webhook.endpoint,
        event: "category.deleted",
        data: { id, slug: category.slug, userId: sessionData.user.id },
        format: webhook.format,
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (_e) {
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
