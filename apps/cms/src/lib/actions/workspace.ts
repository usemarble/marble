"use server";

import prisma from "@repo/db";
import { revalidatePath } from "next/cache";
import getSession from "../auth/session";
import { setActiveWorkspace } from "../auth/workspace";
import {
  type CreateWorkspaceValues,
  workspaceSchema,
} from "../validations/workspace";

export async function createWorkspaceAction(payload: CreateWorkspaceValues) {
  const session = await getSession();
  if (!session?.user || !session?.user.id) {
    throw new Error("Unauthorized");
  }

  const parsedPayload = workspaceSchema.parse(payload);

  const workspace = await prisma.organization.create({
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
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const workspace = await prisma.organization.findFirst({
    where: {
      slug,
      NOT: currentWorkspaceId ? { id: currentWorkspaceId } : undefined,
    },
  });

  return !workspace; // Return true if slug is available (no workspace found)
}

export async function updateWorkspaceAction(
  workspaceId: string,
  payload: CreateWorkspaceValues,
) {
  const session = await getSession();
  if (!session?.user || !session?.user.id) {
    throw new Error("Unauthorized");
  }

  const parsedPayload = workspaceSchema.parse(payload);

  const workspace = await prisma.organization.update({
    where: { id: workspaceId },
    data: parsedPayload,
  });

  return workspace;
}
