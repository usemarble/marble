"use server";

import prisma from "@repo/db";
import getSession from "@/lib/auth/get-session";
import { postSchema, PostValues } from "@/lib/validations/post";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export const publishArticle = async (post: PostValues) => {
  const session = await getSession();
  const user = session?.user;

  if (!user) return NextResponse.json("unallowed", { status: 401 });
  const values = postSchema.parse(post);

  const authorId = user.id!;
  const contentJson = JSON.parse(values.contentJson);

  await prisma.post.create({
    data: {
      ...values,
      contentJson,
      authorId,
      tags: {
        connect: values.tags.map((slug) => ({ slug })),
      },
    },
  });

  return redirect(`/app`);
};
