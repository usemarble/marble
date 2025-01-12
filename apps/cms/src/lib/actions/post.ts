"use server";

import { type PostValues, postSchema } from "@/lib/validations/post";
import prisma from "@repo/db";
import { redirect } from "next/navigation";
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

  await prisma.post.create({
    data: {
      authorId,
      contentJson,
      slug: values.slug,
      title: values.title,
      content: values.content,
      categoryId: values.category,
      coverImage: values.coverImage,
      description: values.description,
      workspaceId: session?.session.activeOrganizationId,
      tags: {
        connect: values.tags.map((id) => ({ id })),
      },
    },
  });

  return redirect("/");
};
