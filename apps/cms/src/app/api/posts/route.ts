import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { postSchema } from "@/lib/validations/post";
import { validateWorkspaceTags } from "@/lib/validations/tags";
import { getWebhooks, WebhookClient } from "@/lib/webhooks/webhook-client";
import { sanitizeHtml } from "@/utils/editor";

export async function GET() {
  const sessionData = await getServerSession();

  if (!sessionData) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const posts = await db.post.findMany({
    where: { workspaceId: sessionData.session?.activeOrganizationId as string },
    select: {
      id: true,
      title: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
      primaryAuthor: {
        select: {
          name: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  const sessionData = await getServerSession();
  const user = sessionData?.user;

  if (!user || !sessionData?.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const values = postSchema.parse(await request.json());

  const authorId = sessionData.user.id;
  const contentJson = JSON.parse(values.contentJson);
  const validAttribution = values.attribution ? values.attribution : undefined;
  const cleanContent = sanitizeHtml(values.content);

  const tagValidation = await validateWorkspaceTags(
    values.tags,
    sessionData.session.activeOrganizationId,
  );

  if (!tagValidation.success) {
    return tagValidation.response;
  }

  const { uniqueTagIds } = tagValidation;

  const postCreated = await db.post.create({
    data: {
      primaryAuthorId: authorId,
      contentJson,
      slug: values.slug,
      title: values.title,
      status: values.status,
      content: cleanContent,
      categoryId: values.category,
      coverImage: values.coverImage,
      publishedAt: values.publishedAt,
      description: values.description,
      attribution: validAttribution,
      workspaceId: sessionData.session.activeOrganizationId,
      tags:
        uniqueTagIds.length > 0
          ? {
              connect: uniqueTagIds.map((id) => ({ id })),
            }
          : undefined,
      authors: {
        connect: { id: authorId },
      },
    },
  });

  const webhooks = getWebhooks(sessionData.session, "post_published");

  if (postCreated.status === "published") {
    for (const webhook of await webhooks) {
      const webhookClient = new WebhookClient({ secret: webhook.secret });
      await webhookClient.send({
        url: webhook.endpoint,
        event: "post.published",
        data: {
          id: postCreated.id,
          slug: postCreated.slug,
          userId: sessionData.user.id,
        },
        format: webhook.format,
      });
    }
  }

  return NextResponse.json({ id: postCreated.id });
}
