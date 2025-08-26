import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { type Attribution, postSchema } from "@/lib/validations/post";
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
  const session = await getServerSession();
  const user = session?.user;

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session?.session.activeOrganizationId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const values = postSchema.parse(body);

  const contentJson = JSON.parse(values.contentJson);
  const validAttribution = values.attribution ? values.attribution : undefined;
  const cleanContent = sanitizeHtml(values.content);

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
        workspaceId: session?.session.activeOrganizationId,
        tags: values.tags
         ?  {
            set: [],
            connect: values.tags.map((id: string) => ({ id })),
          } : undefined,
        authors: {
          set: [],
          connect: values.authors.map((id: string) => ({ id })),
        },
      },
    });

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
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const deletedPost = await db.post.delete({
      where: { id },
    });

    return NextResponse.json({ id: deletedPost.id }, { status: 200 });
  } catch (_e) {
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 },
    );
  }
}
