"use server";

import db from "@marble/db";
import { NextResponse } from "next/server";
import getServerSession from "../auth/session";
import type { CreateCategoryValues } from "../validations/workspace";

/**
 * Check if a category slug is taken
 * @param slug - The slug of the category to check
 * @param workspaceId - The id of the workspace
 * @returns True if the slug is taken, false otherwise
 */
export async function checkCategorySlugAction(
  slug: string,
  workspaceId: string,
) {
  const result = await db.category.findFirst({
    where: { workspaceId: workspaceId, slug: slug },
  });

  return !!result;
}

/**
 * Check if a category slug is taken for update
 * @param slug - The slug of the category to check
 * @param workspaceId - The id of the workspace
 * @param currentCategoryId - The id of the current category
 * @returns True if the slug is taken, false otherwise
 */
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

/**
 * Create a new category
 * @param data - The data of the category to create
 * @param workspaceId - The id of the workspace
 * @returns The created category
 */
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

/**
 * Update a category
 * @param payload - The data of the category to update
 * @param id - The id of the category to update
 * @returns The id of the updated category
 */
export async function updateCategoryAction(
  payload: CreateCategoryValues,
  id: string,
) {
  const isAllowed = await getServerSession();
  if (!isAllowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categoryToUpdate = await db.category.update({
    where: { id: id },
    data: payload,
  });

  return categoryToUpdate.id;
}

/**
 * Delete a category
 * @param id - The id of the category to delete
 * @returns The id of the deleted category
 */
export async function deleteCategoryAction(id: string) {
  const isAllowed = await getServerSession();
  if (!isAllowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deletedCategory = await db.category.delete({
    where: { id: id },
  });

  return deletedCategory.id;
}
