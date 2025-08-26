import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { postSchema } from "@/lib/validations/post";
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
  const session = await getServerSession();
  const user = session?.user;

  if (!user || !session?.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const values = postSchema.parse(await request.json());

  console.log("for testing",values);

  const authorId = session.user.id;
  const contentJson = JSON.parse(values.contentJson);
  const validAttribution = values.attribution ? values.attribution : undefined;
  const cleanContent = sanitizeHtml(values.content);

  const postCreated = await db.post.create({
    data: {
      primaryAuthorId: authorId,
      contentJson,
      slug: values.slug,
      title: values.title,
      status: values.status,
      content: cleanContent,
      categoryId: values.categoryId,
      coverImage: values.coverImage,
      publishedAt: values.publishedAt,
      description: values.description,
      attribution: validAttribution,
      workspaceId: session.session.activeOrganizationId,
      tags: values.tags
       ? {
          connect: values.tags.map((id) => ({ id })),
        } : undefined
      ,
      authors: {
        connect: { id: authorId },
      },
    },
  });

  return NextResponse.json({ id: postCreated.id });
}
