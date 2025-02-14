"use server";

import db from "@marble/db";
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

export async function createTagAction(
  data: CreateTagValues,
  workspaceId: string,
) {
  const isAllowed = await getServerSession();
  if (!isAllowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tagToCreate = await db.tag.create({
    data: {
      ...data,
      workspaceId,
    },
  });

  const resData = {
    id: tagToCreate.id,
    name: tagToCreate.name,
    slug: tagToCreate.slug,
  };
  return resData;
}

export async function updateTagAction(payload: CreateTagValues, id: string) {
  const isAllowed = await getServerSession();
  if (!isAllowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.tag.update({
    where: { id: id },
    data: payload,
  });
}

export async function deleteTagAction(id: string) {
  const isAllowed = await getServerSession();
  if (!isAllowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.tag.delete({
    where: { id: id },
  });

  return NextResponse.json({ status: 200 });
}
