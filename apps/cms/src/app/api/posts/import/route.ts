import { db } from "@marble/db";
import { markdownToHtml, markdownToTiptap } from "@marble/parser/tiptap";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { postImportSchema } from "@/lib/validations/post";
import { validateWorkspaceTags } from "@/lib/validations/tags";
import { getWebhooks, WebhookClient } from "@/lib/webhooks/webhook-client";
import { sanitizeHtml } from "@/utils/editor";
import { generateSlug } from "@/utils/string";

export async function POST(request: Request) {
  const sessionData = await getServerSession();
  const activeWorkspaceId = sessionData?.session.activeOrganizationId;

  if (!sessionData || !activeWorkspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const values = postImportSchema.safeParse(body);
  if (!values.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: values.error.issues },
      { status: 400 }
    );
  }

  const baseSlug = generateSlug(sessionData.user.name);
  const uniqueSlug = `${baseSlug}-${nanoid(6)}`;

  const primaryAuthor = await db.author.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: activeWorkspaceId,
        userId: sessionData.user.id,
      },
    },
    update: {},
    create: {
      name: sessionData.user.name,
      email: sessionData.user.email,
      slug: uniqueSlug,
      image: sessionData.user.image,
      workspaceId: activeWorkspaceId,
      userId: sessionData.user.id,
      role: "Writer",
    },
  });

  const validAttribution = values.data.attribution
    ? values.data.attribution
    : undefined;

  const contentJson = markdownToTiptap(values.data.content);
  const htmlContent = await markdownToHtml(values.data.content || "");
  const cleanContent = sanitizeHtml(htmlContent);

  const tagValidation = await validateWorkspaceTags(
    values.data.tags,
    activeWorkspaceId
  );

  if (!tagValidation.success) {
    return tagValidation.response;
  }

  const { uniqueTagIds } = tagValidation;

  const authorIds = values.data.authors?.length
    ? values.data.authors
    : [primaryAuthor.id];
  const validAuthors = await db.author.findMany({
    where: {
      id: { in: authorIds },
      workspaceId: activeWorkspaceId,
    },
  });

  if (validAuthors.length === 0) {
    return NextResponse.json(
      { error: "No valid authors found" },
      { status: 400 }
    );
  }

  const postCreated = await db.post.create({
    data: {
      primaryAuthorId: primaryAuthor.id,
      contentJson,
      slug: values.data.slug,
      title: values.data.title,
      status: values.data.status,
      content: cleanContent,
      categoryId: values.data.category,
      coverImage: values.data.coverImage,
      publishedAt: values.data.publishedAt,
      description: values.data.description,
      attribution: validAttribution,
      workspaceId: activeWorkspaceId,
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
