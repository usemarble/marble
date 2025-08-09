import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { postSchema } from "@/lib/validations/post";

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
  const session = await getServerSession();
  const user = session?.user;

  if (!(user && session?.session.activeOrganizationId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const values = postSchema.parse(await request.json());

  const authorId = session.user.id;
  const contentJson = JSON.parse(values.contentJson);
  const validAttribution = values.attribution ? values.attribution : undefined;

  const postCreated = await db.post.create({
    data: {
      primaryAuthorId: authorId,
      contentJson,
      slug: values.slug,
      title: values.title,
      status: values.status,
      content: values.content,
      categoryId: values.category,
      coverImage: values.coverImage,
      publishedAt: values.publishedAt,
      description: values.description,
      attribution: validAttribution,
      workspaceId: session.session.activeOrganizationId,
      tags: {
        connect: values.tags.map((id) => ({ id })),
      },
      authors: {
        connect: { id: authorId },
      },
    },
  });

  return NextResponse.json({ id: postCreated.id });
}
