"use server";

import db from "@repo/db";
import { NextResponse } from "next/server";
import getServerSession from "../auth/session";
import type { CreateCategoryValues } from "../validations/workspace";

export async function checkCategorySlugAction(
  slug: string,
  workspaceId: string,
) {
  const result = await db.category.findFirst({
    where: { workspaceId: workspaceId, slug: slug },
  });

  return !!result;
}

export async function checkCategorySlugForUpdateAction(
  slug: string,
  workspaceId: string,
  currentCategoryId: string,
) {
  const result = await db.category.findFirst({
    where: {
      workspaceId: workspaceId,
      slug: slug,
      NOT: {
        id: currentCategoryId,
      },
    },
  });

  return !!result;
}

export async function createCategoryAction(
  data: CreateCategoryValues,
  workspaceId: string,
) {
  const isAllowed = await getServerSession();
  if (!isAllowed) {
    return;
  }

  const categoryToCreate = await db.category.create({
    data: {
      ...data,
      workspaceId,
    },
  });

  const resData = {
    id: categoryToCreate.id,
    name: categoryToCreate.name,
    slug: categoryToCreate.slug,
  };
  return resData;
}

export async function updateCategoryAction(
  payload: CreateCategoryValues,
  id: string,
) {
  const isAllowed = await getServerSession();
  if (!isAllowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.category.update({
    where: { id: id },
    data: payload,
  });
}

export async function deleteCategoryAction(id: string) {
  const isAllowed = await getServerSession();
  if (!isAllowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.category.delete({
    where: { id: id },
  });

  return NextResponse.json({ status: 200 });
}
