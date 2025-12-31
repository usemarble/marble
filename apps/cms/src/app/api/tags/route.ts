import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { invalidateCache } from "@/lib/cache/invalidate";
import { tagSchema } from "@/lib/validations/workspace";
import { getWebhooks } from "@/lib/webhooks/utils";
import { WebhookClient } from "@/lib/webhooks/webhook-client";

export async function GET() {
  const sessionData = await getServerSession();
  const workspaceId = sessionData?.session.activeOrganizationId;

  if (!sessionData || !workspaceId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const tags = await db.tag.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      _count: {
        select: {
          posts: true,
        },
      },
    },
  });

  const transformedTags = tags.map((tag) => {
    const { _count, ...rest } = tag;
    return {
      ...rest,
      postsCount: _count.posts,
    };
  });

  return NextResponse.json(transformedTags, { status: 200 });
}

export async function POST(req: Request) {
  const sessionData = await getServerSession();
  const workspaceId = sessionData?.session.activeOrganizationId;

  if (!sessionData || !workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json();
  const body = tagSchema.parse(json);

  const existingTag = await db.tag.findFirst({
    where: {
      slug: body.slug,
      workspaceId,
    },
  });

  if (existingTag) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }

  const tagCreated = await db.tag.create({
    data: {
      name: body.name,
      slug: body.slug,
      description: body.description,
      workspaceId,
    },
  });

  const webhooks = getWebhooks(workspaceId, "tag_created");

  for (const webhook of await webhooks) {
    const webhookClient = new WebhookClient({ secret: webhook.secret });
    await webhookClient.send({
      url: webhook.endpoint,
      event: "tag.created",
      data: {
        id: tagCreated.id,
        slug: tagCreated.slug,
        userId: sessionData.user.id,
      },
      format: webhook.format,
    });
  }

  // Invalidate cache for tags and posts (tags affect posts)
  invalidateCache(workspaceId, "tags");
  invalidateCache(workspaceId, "posts");

  return NextResponse.json(tagCreated, { status: 201 });
}
