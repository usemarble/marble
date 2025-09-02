import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { categorySchema } from "@/lib/validations/workspace";
import { getWebhooks, WebhookClient } from "@/lib/webhooks/webhook-client";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const json = await req.json();
  const body = categorySchema.parse(json);

  const categoryUpdated = await db.category.update({
    where: {
      id: id,
      workspaceId: sessionData.session.activeOrganizationId,
    },
    data: {
      name: body.name,
      slug: body.slug,
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
    });
  }

  return NextResponse.json(categoryUpdated, { status: 200 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const category = await db.category.findFirst({
    where: { id, workspaceId: sessionData.session.activeOrganizationId },
    select: { slug: true },
  });

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const postsWithCategory = await db.post.findFirst({
    where: {
      categoryId: id,
      workspaceId: sessionData.session.activeOrganizationId,
    },
    select: { id: true },
  });

  if (postsWithCategory) {
    return NextResponse.json(
      { error: "Category is associated with existing posts" },
      { status: 400 },
    );
  }

  try {
    await db.category.delete({
      where: {
        id: id,
        workspaceId: sessionData.session.activeOrganizationId,
      },
    });

    const webhooks = getWebhooks(sessionData.session, "category_deleted");

    for (const webhook of await webhooks) {
      const webhookClient = new WebhookClient({ secret: webhook.secret });
      await webhookClient.send({
        url: webhook.endpoint,
        event: "category.deleted",
        data: { id: id, slug: category.slug, userId: sessionData.user.id },
      });
    }

    return NextResponse.json(null, { status: 204 });
  } catch (_e) {
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 },
    );
  }
}
