"use server";

import prisma from "@repo/db";
import { revalidatePath } from "next/cache";
import getSession from "../auth/get-session";
import { type CreateSiteValues, siteSchema } from "../validations/site";

export async function createSiteAction(
  payload: CreateSiteValues,
  workspaceSlug: string,
) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const parsedPayload = siteSchema.parse(payload);

  const workspaceMatch = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    select: { id: true },
  });

  if (!workspaceMatch) {
    throw new Error("Workspace not found");
  }

  const site = await prisma.site.create({
    data: {
      ...parsedPayload,
      workspaceId: workspaceMatch.id,
    },
  });

  revalidatePath("/");
  return site;
}
