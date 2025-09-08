import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { postSchema } from "@/lib/validations/post";
import { validateWorkspaceTags } from "@/lib/validations/tags";
import { getWebhooks, WebhookClient } from "@/lib/webhooks/webhook-client";
import { sanitizeHtml } from "@/utils/editor";
import { generateSlug } from "@/utils/string";

export async function GET() {
  const sessionData = await getServerSession();
  const activeWorkspaceId = sessionData?.session.activeOrganizationId;

  if (!sessionData || !activeWorkspaceId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const posts = await db.post.findMany({
    where: { workspaceId: activeWorkspaceId },
    select: {
      id: true,
      title: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  const sessionData = await getServerSession();
  const activeWorkspaceId = sessionData?.session.activeOrganizationId;

  if (!sessionData || !activeWorkspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const values = postSchema.safeParse(await request.json());
  if (!values.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: values.error.issues },
      { status: 400 },
    );
  }

  // Find the author for this user in the current workspace
  // this is the primary author for the post
  let primaryAuthor = await db.author.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: activeWorkspaceId,
        userId: sessionData.user.id,
      },
    },
  });

  // since its possible for a user to have no author profile, We can take several directions
  // 1. create an author profile for the user
  // 2. use the first author in the workspace
  // 3. reject the request

  // since primary author is not required and is really only a way for us to track the original creator of the post,
  // We'll go with the first option and create an author profile for the user (for now)

  if (!primaryAuthor) {
    primaryAuthor = await db.author.create({
      data: {
        name: sessionData.user.name,
        email: sessionData.user.email,
        slug: generateSlug(sessionData.user.name),
        image: sessionData.user.image,
        workspaceId: activeWorkspaceId,
        userId: sessionData.user.id,
        role: "Writer",
      },
    });
  }

  const contentJson = JSON.parse(values.data.contentJson);
  const validAttribution = values.data.attribution
    ? values.data.attribution
    : undefined;
  const cleanContent = sanitizeHtml(values.data.content);

  const tagValidation = await validateWorkspaceTags(
    values.data.tags,
    activeWorkspaceId,
  );

  if (!tagValidation.success) {
    return tagValidation.response;
  }

  const { uniqueTagIds } = tagValidation;

  // Find all authors for the provided author IDs, this may or may not include the primary author
  // if the list of authors selected by the user doesnt include their own author profile
  // it will not be added to the list as this is what is returned to users via the public api
  // however for internal tracking they will be saved as the primary author
  const authorIds = values.data.authors || [primaryAuthor.id];
  const validAuthors = await db.author.findMany({
    where: {
      id: { in: authorIds },
      workspaceId: activeWorkspaceId,
    },
  });

  if (validAuthors.length === 0) {
    return NextResponse.json(
      { error: "No valid authors found" },
      { status: 400 },
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
