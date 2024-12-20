"use server";

import prisma from "@repo/db";
import { revalidatePath } from "next/cache";
import getSession from "../auth/get-session";
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

  const site = await prisma.workspace.create({
    data: {
      ...parsedPayload,
      slug: parsedPayload.slug.toLocaleLowerCase(),
      ownerId: session.user.id,
    },
  });

  revalidatePath("/");
  return site;
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
