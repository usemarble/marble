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

  if (!sessionData) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  const post = await db.post.findUnique({
    where: { id: id },
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
  const user = sessionData?.user;

  if (!user || !sessionData?.session.activeOrganizationId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const values = postSchema.parse(body);

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

  const post = await db.post.findFirst({
    where: { id, workspaceId: sessionData.session.activeOrganizationId },
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
        slug: values.slug,
        title: values.title,
        status: values.status,
        content: cleanContent,
        categoryId: values.category,
        coverImage: values.coverImage,
        description: values.description,
        publishedAt: values.publishedAt,
        attribution: validAttribution,
        workspaceId: sessionData?.session.activeOrganizationId,
        tags: values.tags
          ? { set: uniqueTagIds.map((id) => ({ id })) }
          : undefined,
        authors: {
          set: [],
          connect: values.authors.map((id: string) => ({ id })),
        },
      },
    });

    const data = {
      id: postUpdated.id,
      slug: postUpdated.slug,
      userId: sessionData.user.id,
    };

    if (values.status === "published" && post.status === "draft") {
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

  const post = await db.post.findFirst({
    where: { id, workspaceId: sessionData.session.activeOrganizationId },
    select: { slug: true },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  await db.post
    .delete({
      where: { id },
    })
    .catch((_e) => {
      return NextResponse.json(
        { error: "Failed to delete post" },
        { status: 500 },
      );
    });

  const webhooks = getWebhooks(sessionData.session, "post_deleted");

  for (const webhook of await webhooks) {
    const webhookClient = new WebhookClient({ secret: webhook.secret });
    await webhookClient.send({
      url: webhook.endpoint,
      event: "post.deleted",
      data: { id: id, slug: post.slug, userId: sessionData.user.id },
      format: webhook.format,
    });
  }

  return new NextResponse(null, { status: 204 });
}
