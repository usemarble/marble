"use server";

import { db } from "@marble/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "../auth/session";
import { setActiveWorkspace } from "../auth/workspace";
import {
  type CreateWorkspaceValues,
  workspaceSchema,
} from "../validations/workspace";

export async function createWorkspaceAction(payload: CreateWorkspaceValues) {
  const session = await getServerSession();
  if (!session?.user || !session?.user.id) {
    throw new Error("Unauthorized");
  }

  const parsedPayload = workspaceSchema.parse(payload);

  const workspace = await db.organization.create({
    data: {
      ...parsedPayload,
      slug: parsedPayload.slug.toLocaleLowerCase(),
    },
  });
  setActiveWorkspace(workspace.slug);

  // not too sure this works
  revalidatePath(`/${workspace.slug}`);
  return workspace;
}

export async function checkWorkspaceSlug(
  slug: string,
  currentWorkspaceId?: string,
) {
  const session = await getServerSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const workspace = await db.organization.findFirst({
    where: {
      slug,
      NOT: currentWorkspaceId ? { id: currentWorkspaceId } : undefined,
    },
  });

  return !!workspace; // Return true if slug is in use (workspace found)
}

export async function updateWorkspaceAction(
  workspaceId: string,
  payload: CreateWorkspaceValues,
) {
  const session = await getServerSession();
  if (!session?.user || !session?.user.id) {
    throw new Error("Unauthorized");
  }

  const parsedPayload = workspaceSchema.parse(payload);

  const workspace = await db.organization.update({
    where: { id: workspaceId },
    data: parsedPayload,
  });

  return workspace;
}

export async function deleteWorkspaceAction(workspaceId: string) {
  const session = await getServerSession();
  if (!session?.user || !session?.user.id) {
    throw new Error("Unauthorized");
  }

  try {
    const deleted = await db.organization.delete({
      where: {
        id: workspaceId,
      },
    });
    return deleted.id;
  } catch (error) {
    console.error("Error deleting workspace:", error);
    throw new Error("Failed to delete workspace");
  }
}
