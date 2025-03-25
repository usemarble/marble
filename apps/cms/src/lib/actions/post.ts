"use server";

import { type PostValues, postSchema } from "@/lib/validations/post";
import db from "@marble/db";
import { NextResponse } from "next/server";
import getServerSession from "../auth/session";

/**
 * Create a new post
 * @param post - The post values to create
 * @returns The id of the created post
 */
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
      workspaceId: session?.session.activeOrganizationId,
      tags: {
        connect: values.tags.map((id) => ({ id })),
      },
      authors: {
        connect: { id: authorId },
      },
    },
  });

  return postCreated.id;
};

/**
 * Update a post
 * @param post - The post values to update
 * @param id - The id of the post to update
 * @returns The id of the updated post
 */
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
        set: [], // First disconnect existing tags
        connect: values.tags.map((id) => ({ id })), // Then connect new ones
      },
      authors: {
        set: [], // First disconnect existing authors
        connect: values.authors.map((id) => ({ id })), // Then connect new ones
      },
    },
  });

  return postUpdated.id;
};

/**
 * Delete a post
 * @param id - The id of the post to delete
 * @returns The id of the deleted post
 */
export async function deletePostAction(id: string) {
  const session = await getServerSession();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const deletedPost = await db.post.delete({
    where: { id },
  });

  return deletedPost.id;
}
