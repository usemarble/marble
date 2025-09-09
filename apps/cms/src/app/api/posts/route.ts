import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { postSchema } from "@/lib/validations/post";
import { validateWorkspaceTags } from "@/lib/validations/tags";
import { getWebhooks, WebhookClient } from "@/lib/webhooks/webhook-client";
import { sanitizeHtml } from "@/utils/editor";

export async function GET() {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const posts = await db.post.findMany({
    where: { workspaceId: sessionData.session.activeOrganizationId },
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

  if (!sessionData || !sessionData?.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const values = postSchema.parse(await request.json());

  // Find the author for this user in the current workspace
  const author = await db.author.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: sessionData.session.activeOrganizationId,
        userId: sessionData.user.id,
      },
    },
  });

  if (!author) {
    return NextResponse.json(
      { error: "Author not found for user" },
      { status: 400 },
    );
  }

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

  // Find all authors for the provided author IDs
  const authorIds = values.authors || [author.id];
  const validAuthors = await db.author.findMany({
    where: {
      id: { in: authorIds },
      workspaceId: sessionData.session.activeOrganizationId,
    },
  });

  if (validAuthors.length === 0) {
    return NextResponse.json(
      { error: "No valid authors found" },
      { status: 400 },
    );
  }

  // Use the first valid author as primary, or default to current user's author
  const primaryAuthor =
    validAuthors.find((a) => a.id === author.id) || validAuthors[0];

  // We should ideally never hit this since validAuthors.length > 0
  if (!primaryAuthor) {
    return NextResponse.json(
      { error: "Unable to determine primary author" },
      { status: 500 },
    );
  }

  const postCreated = await db.post.create({
    data: {
      primaryAuthorId: primaryAuthor.id,
      contentJson,
      slug: values.slug,
      title: values.title,
      status: values.status,
      content: cleanContent,
      categoryId: values.category,
      coverImage: values.coverImage,
      publishedAt: values.status === "published" ? values.publishedAt : null,
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
        connect: validAuthors.map((author) => ({ id: author.id })),
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
          title: postCreated.title,
          slug: postCreated.slug,
          userId: sessionData.user.id,
        },
        format: webhook.format,
      });
    }
  }

  return NextResponse.json({ id: postCreated.id });
}
