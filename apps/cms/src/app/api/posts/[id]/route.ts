import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { type Attribution, postSchema } from "@/lib/validations/post";
import { validateWorkspaceTags } from "@/lib/validations/tags";
import { getWebhooks, WebhookClient } from "@/lib/webhooks/webhook-client";
import { sanitizeHtml } from "@/utils/editor";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionData = await getServerSession();
  const activeWorkspaceId = sessionData?.session.activeOrganizationId;
  const { id } = await params;

  if (!sessionData || !activeWorkspaceId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const post = await db.post.findFirst({
    where: { id: id, workspaceId: activeWorkspaceId },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      content: true,
      coverImage: true,
      description: true,
      publishedAt: true,
      contentJson: true,
      categoryId: true,
      attribution: true,
      tags: {
        select: { id: true },
      },
      authors: {
        select: { id: true },
      },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const structuredData = {
    slug: post.slug,
    title: post.title,
    status: post.status,
    content: post.content,
    coverImage: post.coverImage,
    description: post.description,
    publishedAt: post.publishedAt,
    attribution: post.attribution as Attribution,
    contentJson: JSON.stringify(post.contentJson),
    tags: post.tags.map((tag) => tag.id),
    category: post.categoryId,
    authors: post.authors.map((author) => author.id),
  };

  return NextResponse.json(structuredData, { status: 200 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionData = await getServerSession();
  const workspaceId = sessionData?.session.activeOrganizationId;
  const { id } = await params;

  if (!sessionData || !workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const values = postSchema.safeParse(body);

  if (!values.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: values.error.issues },
      { status: 400 },
    );
  }

  const contentJson = JSON.parse(values.data.contentJson);
  const validAttribution = values.data.attribution
    ? values.data.attribution
    : undefined;
  const cleanContent = sanitizeHtml(values.data.content);

  const tagValidation = await validateWorkspaceTags(
    values.data.tags,
    workspaceId,
  );

  if (!tagValidation.success) {
    return tagValidation.response;
  }

  const { uniqueTagIds } = tagValidation;

  // Find all authors for the provided author IDs
  const validAuthors = await db.author.findMany({
    where: {
      id: { in: values.data.authors },
      workspaceId: workspaceId,
    },
  });

  if (validAuthors.length === 0) {
    return NextResponse.json(
      { error: "No valid authors found" },
      { status: 400 },
    );
  }

  // Use the first valid author as primary
  const primaryAuthor = validAuthors[0];

  if (!primaryAuthor) {
    // This should never happen since validAuthors.length > 0
    return NextResponse.json(
      { error: "Unable to determine primary author" },
      { status: 500 },
    );
  }

  const post = await db.post.findFirst({
    where: { id, workspaceId: workspaceId },
    select: { status: true },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  try {
    const postUpdated = await db.post.update({
      where: { id },
      data: {
        contentJson,
        slug: values.data.slug,
        title: values.data.title,
        status: values.data.status,
        content: cleanContent,
        categoryId: values.data.category,
        coverImage: values.data.coverImage,
        description: values.data.description,
        publishedAt:  values.data.status === "published" ? values.data.publishedAt : null,
        attribution: validAttribution,
        workspaceId: workspaceId,
        tags: values.data.tags
          ? { set: uniqueTagIds.map((id) => ({ id })) }
          : undefined,
        primaryAuthorId: primaryAuthor.id,
        authors: {
          set: validAuthors.map((author) => ({ id: author.id })),
        },
      },
    });

    const data = {
      id: postUpdated.id,
      title: postUpdated.title,
      slug: postUpdated.slug,
      userId: sessionData.user.id,
    };

    if (values.data.status === "published" && post.status === "draft") {
      const webhooksPublished = getWebhooks(
        sessionData.session,
        "post_published",
      );

      for (const webhook of await webhooksPublished) {
        const webhookClient = new WebhookClient({ secret: webhook.secret });
        await webhookClient.send({
          url: webhook.endpoint,
          event: "post.published",
          data,
          format: webhook.format,
        });
      }
    }

    const webhooksUpdated = getWebhooks(sessionData.session, "post_updated");

    for (const webhook of await webhooksUpdated) {
      const webhookClient = new WebhookClient({ secret: webhook.secret });
      await webhookClient.send({
        url: webhook.endpoint,
        event: "post.updated",
        data,
        format: webhook.format,
      });
    }

    return NextResponse.json({ id: postUpdated.id }, { status: 200 });
  } catch (_e) {
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionData = await getServerSession();

  if (!sessionData?.user || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const activeWorkspaceId = sessionData.session.activeOrganizationId;

  try {
    const deletedPost = await db.post.delete({
      where: { id: id, workspaceId: activeWorkspaceId },
    });

    if (!deletedPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const webhooksDeleted = getWebhooks(sessionData.session, "post_deleted");

    for (const webhook of await webhooksDeleted) {
      const webhookClient = new WebhookClient({ secret: webhook.secret });
      await webhookClient.send({
        url: webhook.endpoint,
        event: "post.deleted",
        data: { id: id, slug: deletedPost.slug, userId: sessionData.user.id },
        format: webhook.format,
      });
    }

    return NextResponse.json({ id: deletedPost.id }, { status: 200 });
  } catch (_e) {
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 },
    );
  }
}
