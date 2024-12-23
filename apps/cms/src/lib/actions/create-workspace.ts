"use server";

import prisma from "@repo/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import getSession from "../auth/session";
import { setActiveWorkspace } from "../auth/workspace";
import {
  type CreateWorkspaceValues,
  workspaceSchema,
} from "../validations/site";

export async function createWorkspaceAction(payload: CreateWorkspaceValues) {
  const session = await getSession();
  if (!session?.user || !session?.user.id) {
    throw new Error("Unauthorized");
  }

  const parsedPayload = workspaceSchema.parse(payload);

  const workspace = await prisma.workspace.create({
    data: {
      ...parsedPayload,
      slug: parsedPayload.slug.toLocaleLowerCase(),
      ownerId: session.user.id,
    },
  });
  setActiveWorkspace({ id: workspace.id, slug: workspace.slug });

  // I need to update to the corre ct path
  revalidatePath("/");
  // redirect(`/${workspace.slug}`);
  return workspace;
}

export async function checkWorkspaceSlug(slug: string): Promise<boolean> {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug },
  });

  return !!workspace;
}
