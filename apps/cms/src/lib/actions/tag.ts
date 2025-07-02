"use server";

import { db } from "@marble/db";
import { NextResponse } from "next/server";
import getServerSession from "../auth/session";
import type { CreateTagValues } from "../validations/workspace";

export async function checkTagSlugAction(slug: string, workspaceId: string) {
  const result = await db.tag.findFirst({
    where: { workspaceId: workspaceId, slug: slug },
  });

  return !!result;
}

export async function checkTagSlugForUpdateAction(
  slug: string,
  workspaceId: string,
  currentTagId: string,
) {
  const result = await db.tag.findFirst({
    where: {
      workspaceId: workspaceId,
      slug: slug,
      NOT: {
        id: currentTagId,
      },
    },
  });

  return !!result;
}

/**
 * Create a tag
 * @param data - The data to create the tag with
 * @param workspaceId - The workspace ID
 * @returns The created tag
 */
export async function createTagAction(
  data: CreateTagValues,
  workspaceId: string,
) {
  try {
    const tag = await db.tag.create({
      data: {
        name: data.name,
        slug: data.slug,
        workspaceId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    return tag;
  } catch (_error) {
    throw new Error("Failed to create tag");
  }
}

/**
 * Update a tag
 * @param payload - The payload to update the tag with
 * @param id - The tag ID
 * @returns The updated tag
 */
export async function updateTagAction(payload: CreateTagValues, id: string) {
  const isAllowed = await getServerSession();
  if (!isAllowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tag = await db.tag.update({
    where: { id: id },
    data: payload,
  });

  return tag;
}

/**
 * Delete a tag
 * @param id - The tag ID
 * @returns The deleted tag ID
 */
export async function deleteTagAction(id: string) {
  const isAllowed = await getServerSession();
  if (!isAllowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deletedTag = await db.tag.delete({
    where: { id: id },
  });

  return deletedTag.id;
}
