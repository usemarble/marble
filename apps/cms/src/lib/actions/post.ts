"use server";

import { type PostValues, postSchema } from "@/lib/validations/post";
import db from "@repo/db";
import { NextResponse } from "next/server";
import getServerSession from "../auth/session";

export const createPostAction = async (post: PostValues) => {
  const session = await getServerSession();
  const user = session?.user;

  if (!user) return NextResponse.json("unallowed", { status: 401 });
  if (!session?.session.activeOrganizationId)
    return NextResponse.json("unallowed", { status: 401 });

  const values = postSchema.parse(post);

  const authorId = session?.user.id;
  const contentJson = JSON.parse(values.contentJson);
  const validAttribution = values.attribution ? values.attribution : undefined;

  const postCreated = await db.post.create({
    data: {
      authorId,
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
      workspaceId: session?.session.activeOrganizationId,
      tags: {
        connect: values.tags.map((id) => ({ id })),
      },
    },
  });

  return postCreated.id;
};

export const updatePostAction = async (post: PostValues, id: string) => {
  const session = await getServerSession();
  const user = session?.user;

  if (!user) return NextResponse.json("unallowed", { status: 401 });
  if (!session?.session.activeOrganizationId)
    return NextResponse.json("unallowed", { status: 401 });

  const values = postSchema.parse(post);

  const contentJson = JSON.parse(values.contentJson);
  const validAttribution = values.attribution ? values.attribution : undefined;

  const postUpdated = await db.post.update({
    where: { id },
    data: {
      contentJson,
      slug: values.slug,
      title: values.title,
      status: values.status,
      content: values.content,
      categoryId: values.category,
      coverImage: values.coverImage,
      description: values.description,
      publishedAt: values.publishedAt,
      attribution: validAttribution,
      workspaceId: session?.session.activeOrganizationId,
      tags: {
        connect: values.tags.map((id) => ({ id })),
      },
    },
  });

  return postUpdated.id;
};

export async function deletePostAction(id: string) {
  const session = await getServerSession();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  await db.post.delete({
    where: { id },
  });

  return { success: true };
}
