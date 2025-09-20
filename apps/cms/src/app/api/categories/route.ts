import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { categorySchema } from "@/lib/validations/workspace";
import { getWebhooks, WebhookClient } from "@/lib/webhooks/webhook-client";

export async function GET() {
  const sessionData = await getServerSession();
  const workspaceId = sessionData?.session.activeOrganizationId;

  if (!sessionData || !workspaceId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const categories = await db.category.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return NextResponse.json(categories, { status: 200 });
}

export async function POST(req: Request) {
  const sessionData = await getServerSession();
  const workspaceId = sessionData?.session.activeOrganizationId;

  if (!sessionData || !workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json();
  const body = categorySchema.safeParse(json);

  if (!body.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: body.error.issues },
      { status: 400 }
    );
  }

  const categoryCreated = await db.category.create({
    data: {
      name: body.data.name,
      slug: body.data.slug,
      workspaceId,
    },
  });

  const webhooks = getWebhooks(sessionData.session, "category_created");

  for (const webhook of await webhooks) {
    const webhookClient = new WebhookClient({ secret: webhook.secret });
    await webhookClient.send({
      url: webhook.endpoint,
      event: "category.created",
      data: {
        id: categoryCreated.id,
        slug: categoryCreated.slug,
        userId: sessionData.user.id,
      },
      format: webhook.format,
    });
  }

  return NextResponse.json(categoryCreated, { status: 201 });
}
