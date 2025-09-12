import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { tagSchema } from "@/lib/validations/workspace";
import { getWebhooks, WebhookClient } from "@/lib/webhooks/webhook-client";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
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

  const tagUpdated = await db.tag.update({
    where: { id },
    data: {
      name: body.name,
      slug: body.slug,
    },
  });

  const webhooks = getWebhooks(sessionData.session, "tag_updated");

  for (const webhook of await webhooks) {
    const webhookClient = new WebhookClient({ secret: webhook.secret });
    await webhookClient.send({
      url: webhook.endpoint,
      event: "tag.updated",
      data: {
        id: tagUpdated.id,
        slug: tagUpdated.slug,
        userId: sessionData.user.id,
      },
      format: webhook.format,
    });
  }

  return NextResponse.json(tagUpdated, { status: 200 });
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

  const tag = await db.tag.findFirst({
    where: { id, workspaceId: sessionData.session.activeOrganizationId },
    select: { slug: true },
  });

  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  try {
    await db.tag.delete({
      where: {
        id,
        workspaceId: sessionData.session.activeOrganizationId,
      },
    });

    const webhooks = getWebhooks(sessionData.session, "tag_deleted");

    for (const webhook of await webhooks) {
      const webhookClient = new WebhookClient({ secret: webhook.secret });
      await webhookClient.send({
        url: webhook.endpoint,
        event: "tag.deleted",
        data: { id: id, slug: tag.slug, userId: sessionData.user.id },
        format: webhook.format,
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (_e) {
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 },
    );
  }
}
