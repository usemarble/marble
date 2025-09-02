import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { tagSchema } from "@/lib/validations/workspace";
import { getWebhooks, WebhookClient } from "@/lib/webhooks/webhook-client";

export async function GET() {
  const sessionData = await getServerSession();

  if (!sessionData) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const tags = await db.tag.findMany({
    where: { workspaceId: sessionData.session?.activeOrganizationId as string },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return NextResponse.json(tags, { status: 200 });
}

export async function POST(req: Request) {
  const session = await getServerSession();
  const user = session?.user;

  if (!user || !session?.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json();
  const body = tagSchema.parse(json);

  const tagCreated = await db.tag.create({
    data: {
      name: body.name,
      slug: body.slug,
      workspaceId: session.session.activeOrganizationId,
    },
  });

  const webhooks = getWebhooks(session.session, "tag_created");

  for (const webhook of await webhooks) {
    const webhookClient = new WebhookClient({ secret: webhook.secret });
    await webhookClient.send({
      url: webhook.endpoint,
      event: "tag.created",
      data: {
        id: tagCreated.id,
        slug: tagCreated.slug,
        userId: session.user.id,
      },
    });
  }

  return NextResponse.json(tagCreated, { status: 201 });
}
