import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { categorySchema } from "@/lib/validations/workspace";
import { getWebhooks, WebhookClient } from "@/lib/webhooks/webhook-client";

export async function GET() {
  const sessionData = await getServerSession();

  if (!sessionData) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const categories = await db.category.findMany({
    where: { workspaceId: sessionData.session?.activeOrganizationId as string },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return NextResponse.json(categories, { status: 200 });
}

export async function POST(req: Request) {
  const session = await getServerSession();
  const user = session?.user;

  if (!user || !session?.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json();
  const body = categorySchema.parse(json);

  const categoryCreated = await db.category.create({
    data: {
      name: body.name,
      slug: body.slug,
      workspaceId: session.session.activeOrganizationId,
    },
  });

  const webhooks = getWebhooks(session.session, "category_created");

  for (const webhook of await webhooks) {
    const webhookClient = new WebhookClient({ secret: webhook.secret });
    await webhookClient.send({
      url: webhook.endpoint,
      event: "category.created",
      data: {
        id: categoryCreated.id,
        slug: categoryCreated.slug,
        userId: session.user.id,
      },
      format: webhook.format,
    });
  }

  return NextResponse.json(categoryCreated, { status: 201 });
}
