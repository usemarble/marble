import { db } from "@marble/db";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { invalidateCache } from "@/lib/cache/invalidate";
import { postSchema } from "@/lib/validations/post";
import { validateWorkspaceTags } from "@/lib/validations/tags";
import { dispatchWebhooks } from "@/lib/webhooks/dispatcher";
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
      featured: true,
      publishedAt: true,
      updatedAt: true,
      authors: {
        select: {
          id: true,
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
  const activeWorkspaceId = sessionData?.session.activeOrganizationId;

  if (!sessionData || !activeWorkspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const values = postSchema.safeParse(await request.json());
  if (!values.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: values.error.issues },
      { status: 400 }
    );
  }

  const existingPost = await db.post.findFirst({
    where: {
      slug: values.data.slug,
      workspaceId: activeWorkspaceId,
    },
  });

  if (existingPost) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }

  const baseSlug = generateSlug(sessionData.user.name);
  const uniqueSlug = `${baseSlug}-${nanoid(6)}`;
  // Ensure there is an author profile for this user; create if missing using upsert
  // since its possible for a user to have no author profile, We can take several directions
  // 1. create an author profile for the user
  // 2. use the first author in the workspace
  // 3. reject the request

  // since primary author is not required and is really only a way for us to track the original creator of the post,
  // We'll go with the first option and create an author profile for the user (for now)
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

  const contentJson = JSON.parse(values.data.contentJson);
  const validAttribution = values.data.attribution
    ? values.data.attribution
    : undefined;
  const cleanContent = sanitizeHtml(values.data.content);

  const tagValidation = await validateWorkspaceTags(
    values.data.tags,
    activeWorkspaceId
  );

  if (!tagValidation.success) {
    return tagValidation.response;
  }

  const { uniqueTagIds } = tagValidation;

  if (values.data.category) {
    const category = await db.category.findFirst({
      where: {
        id: values.data.category,
        workspaceId: activeWorkspaceId,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Invalid category provided" },
        { status: 400 }
      );
    }
  }

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
      featured: values.data.featured,
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

  // Fire and forget - don't block response
  if (postCreated.status === "published") {
    dispatchWebhooks({
      workspaceId: activeWorkspaceId,
      validationEvent: "post_published",
      deliveryEvent: "post.published",
      payload: {
        id: postCreated.id,
        title: postCreated.title,
        slug: postCreated.slug,
        userId: sessionData.user.id,
      },
    }).catch((error) => {
      console.error(
        `[PostCreate] Failed to dispatch webhooks: postId=${postCreated.id}`,
        error
      );
    });
  }

  invalidateCache(activeWorkspaceId, "posts");

  return NextResponse.json({ id: postCreated.id });
}
