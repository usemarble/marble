import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { postSchema } from "@/lib/validations/post";
import { validateWorkspaceTags } from "@/lib/validations/tags";
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
      newPrimaryAuthor: {
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

  // Transform posts to use new author data when available
  const transformedPosts = posts.map((post) => ({
    ...post,
    primaryAuthor: post.newPrimaryAuthor || post.primaryAuthor,
  }));

  return NextResponse.json(transformedPosts);
}

export async function POST(request: Request) {
  const session = await getServerSession();
  const user = session?.user;

  if (!user || !session?.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const values = postSchema.parse(await request.json());

  // Find the author for this user in the current workspace
  const author = await db.author.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: session.session.activeOrganizationId,
        userId: session.user.id,
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
    session.session.activeOrganizationId,
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
      workspaceId: session.session.activeOrganizationId,
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

  const postCreated = await db.post.create({
    data: {
      // Legacy fields (keep for backward compatibility during transition)
      primaryAuthorId: session.user.id,
      // New author fields
      newPrimaryAuthorId: primaryAuthor?.id,
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
      workspaceId: session.session.activeOrganizationId,
      tags:
        uniqueTagIds.length > 0
          ? {
              connect: uniqueTagIds.map((id) => ({ id })),
            }
          : undefined,
      // Legacy authors (keep for backward compatibility)
      authors: {
        connect: { id: session.user.id },
      },
      // New authors
      newAuthors: {
        connect: validAuthors.map((a) => ({ id: a.id })),
      },
    },
  });

  return NextResponse.json({ id: postCreated.id });
}
